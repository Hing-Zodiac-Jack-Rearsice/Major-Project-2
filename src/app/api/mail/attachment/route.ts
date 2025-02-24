// app/api/mail/attachment/route.ts
import { auth } from "@/lib/auth";
import { getGmailService } from "@/utils/gmail";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const access_token = session?.accessToken;
    const refresh_token = session?.refreshToken;

    if (!session) return new NextResponse("Unauthorized", { status: 401 });
    if (!access_token) return new NextResponse("No access token", { status: 401 });
    if (!refresh_token) return new NextResponse("No refresh token", { status: 401 });

    // Get messageId and attachmentId from query parameters
    const url = new URL(req.url);
    const messageId = url.searchParams.get("messageId");
    const attachmentId = url.searchParams.get("attachmentId");

    if (!messageId || !attachmentId) {
      return new NextResponse("Missing messageId or attachmentId", { status: 400 });
    }

    const gmail = await getGmailService(access_token as string, refresh_token as string);

    // Get the attachment using the correct endpoint structure
    const response = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId: messageId,
      id: attachmentId,
    });

    if (!response.data.data) {
      return new NextResponse("Attachment not found", { status: 404 });
    }

    // Return the attachment data
    return new NextResponse(
      JSON.stringify({
        success: true,
        data: response.data.data, // This is the base64 encoded attachment data
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Error downloading attachment:", error);

    // More detailed error handling
    const errorMessage = error.errors?.[0]?.message || error.message || "An unknown error occurred";
    const statusCode = error.code || error.status || 500;

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: statusCode,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
