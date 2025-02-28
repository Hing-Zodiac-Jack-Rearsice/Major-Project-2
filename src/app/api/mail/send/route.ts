import { auth } from "@/lib/auth";
import { getGmailService } from "@/utils/gmail";
import { NextResponse } from "next/server";
import { encode as base64Encode } from "js-base64";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const access_token = session?.accessToken;
    const refresh_token = session?.refreshToken;

    if (session === null) return new NextResponse("Unauthorized", { status: 401 });
    if (access_token === null) return new NextResponse("No access token", { status: 401 });
    if (refresh_token === null) return new NextResponse("No refresh token", { status: 401 });
    if (!session.user?.email) return new NextResponse("User email not found", { status: 401 });

    const gmail = await getGmailService(access_token as string, refresh_token as string);

    // Get email data from request
    const { to, cc, subject, body, attachments } = await req.json();

    // Validate required fields
    if (!to) return new NextResponse("Recipient email is required", { status: 400 });
    if (!subject) return new NextResponse("Subject is required", { status: 400 });
    if (!body) return new NextResponse("Message body is required", { status: 400 });

    const fromHeader = session.user?.name
      ? `${session.user.name} <${session.user.email}>`
      : session.user?.email;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
${body}
</body>
</html>`;

    const boundary = `boundary-${Date.now()}`;

    // Construct the email headers
    const headers = [
      "MIME-Version: 1.0",
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      `From: ${fromHeader}`,
      `To: ${to}`,
      cc ? `Cc: ${cc}` : "",
      `Subject: ${subject}`,
    ]
      .filter(Boolean)
      .join("\r\n"); // Remove empty strings and join with CRLF

    // Construct the email body
    const bodyContent = [
      `--${boundary}`,
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      base64Encode(htmlContent),
    ].join("\r\n");

    // Add attachments if present
    let attachmentContent = "";
    if (attachments?.length) {
      for (const attachment of attachments) {
        attachmentContent += [
          `--${boundary}`,
          `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`,
          "Content-Transfer-Encoding: base64",
          `Content-Disposition: attachment; filename="${attachment.filename}"`,
          "",
          attachment.data, // Ensure this is already base64 encoded
        ].join("\r\n");
      }
    }

    // Combine all parts
    const emailContent = [
      headers,
      "", // Blank line to separate headers and body
      bodyContent,
      attachmentContent,
      `--${boundary}--`, // Final boundary
    ].join("\r\n");

    // Log the email content for debugging
    // console.log("Email Content:", emailContent);

    // Base64 encode the email content
    const encodedMessage = base64Encode(emailContent)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Send the email using the Gmail API
    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    // Log the response from the Gmail API
    console.log("Gmail API Response:", response.data);

    return NextResponse.json({
      success: true,
      messageId: response.data.id,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}
