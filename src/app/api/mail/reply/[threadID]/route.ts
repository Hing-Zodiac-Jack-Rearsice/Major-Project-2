// First, update the email reply API (first file):

import { auth } from "@/lib/auth";
import { getGmailService } from "@/utils/gmail";
import { NextResponse } from "next/server";
import { encode as base64Encode } from "js-base64";

interface ReplyRequestBody {
  content: string;
  attachments?: {
    name: string;
    type: string;
    content: string;
  }[];
}

export async function POST(req: Request, { params }: { params: { threadID: string } }) {
  try {
    const session = await auth();
    const access_token = session?.accessToken;
    const refresh_token = session?.refreshToken;
    const { threadID } = params;

    if (session === null) return new NextResponse("Unauthorized", { status: 401 });
    if (access_token === null) return new NextResponse("No access token", { status: 401 });
    if (refresh_token === null) return new NextResponse("No refresh token", { status: 401 });

    const gmail = await getGmailService(access_token as string, refresh_token as string);

    const thread = await gmail.users.threads.get({
      userId: "me",
      id: threadID,
    });

    const originalMessage = thread.data.messages?.[thread.data.messages.length - 1];
    if (!originalMessage?.payload?.headers) {
      return new NextResponse("Original message not found", { status: 404 });
    }

    const headers = originalMessage.payload.headers;
    const subject = headers.find((h) => h.name?.toLowerCase() === "subject")?.value || "";
    const from = headers.find((h) => h.name?.toLowerCase() === "from")?.value || "";
    const replyTo = headers.find((h) => h.name?.toLowerCase() === "reply-to")?.value;

    const toAddress = replyTo || from.match(/<([^>]+)>/)?.[1] || from;

    const { content, attachments }: ReplyRequestBody = await req.json();

    const fromHeader = session.user?.name
      ? `${session.user.name} <${session.user.email}>`
      : session.user?.email || "me";

    // Create the HTML email wrapper
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
${content}
</body>
</html>`;

    const boundary = `boundary-${Date.now()}`;
    let emailContent = [
      "MIME-Version: 1.0",
      `Content-Type: multipart/mixed; boundary=${boundary}`,
      `From: ${fromHeader}`,
      `To: ${toAddress}`,
      `Subject: Re: ${subject}`,
      `References: ${originalMessage.id}`,
      `In-Reply-To: ${originalMessage.id}`,
      "",
      `--${boundary}`,
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      base64Encode(htmlContent),
    ].join("\r\n");

    if (attachments?.length) {
      for (const attachment of attachments) {
        emailContent += [
          "",
          `--${boundary}`,
          `Content-Type: ${attachment.type}`,
          "Content-Transfer-Encoding: base64",
          `Content-Disposition: attachment; filename="${attachment.name}"`,
          "",
          attachment.content,
        ].join("\r\n");
      }
    }

    emailContent += `\r\n--${boundary}--`;

    const encodedMessage = base64Encode(emailContent)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
        threadId: threadID,
      },
    });

    return new NextResponse(
      JSON.stringify({
        success: true,
        messageId: response.data.id,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending reply:", error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
