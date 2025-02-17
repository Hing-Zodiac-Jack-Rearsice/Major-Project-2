// app/api/mail/send/route.ts
import { auth } from "@/lib/auth";
import { getGmailService } from "@/utils/gmail";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  const access_token = session?.accessToken;
  const refresh_token = session?.refreshToken;

  if (session === null) return new NextResponse("Unauthorized", { status: 401 });
  else if (access_token === null) return new NextResponse("No access token", { status: 401 });
  else if (refresh_token === null) return new NextResponse("No refresh token", { status: 401 });

  try {
    const { to, cc, subject, content, attachments } = await req.json();
    const gmail = await getGmailService(access_token as string, refresh_token as string);

    // Create the email MIME message
    const boundary = `boundary-${Date.now()}`;
    const mimeHeaders = [
      `To: ${to}`,
      cc ? `Cc: ${cc}` : "",
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/mixed; boundary=${boundary}`,
      "",
      `--${boundary}`,
      "Content-Type: text/html; charset=utf-8",
      "",
      content,
    ];

    // Add attachments if present
    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        const content = await file.arrayBuffer();
        mimeHeaders.push(
          `--${boundary}`,
          "Content-Type: application/octet-stream",
          `Content-Disposition: attachment; filename="${file.name}"`,
          "Content-Transfer-Encoding: base64",
          "",
          Buffer.from(content).toString("base64")
        );
      }
    }

    mimeHeaders.push(`--${boundary}--`);

    const message = mimeHeaders.join("\r\n");
    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    return new NextResponse(JSON.stringify(response.data), { status: 200 });
  } catch (error) {
    console.error("Error sending email:", error);
    return new NextResponse(JSON.stringify({ error: "Failed to send email" }), { status: 500 });
  }
}
