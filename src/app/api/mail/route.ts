import { auth } from "@/lib/auth";
import { getGmailService } from "@/utils/gmail";
import { NextResponse } from "next/server";

// Helper function to extract email addresses from a header string
function extractEmails(headerValue: string): string[] {
  if (!headerValue) return [];

  // Match email addresses that are either:
  // 1. Inside angle brackets: "Name <email@example.com>"
  // 2. Plain email addresses: "email@example.com"
  const emailRegex = /(?:<([^>]+)>|([^,\s<]+@[^,\s>]+))/g;
  const emails: string[] = [];
  let match;

  while ((match = emailRegex.exec(headerValue)) !== null) {
    // match[1] is for addresses in brackets, match[2] is for plain addresses
    const email = match[1] || match[2];
    if (email) emails.push(email);
  }

  return emails;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pageToken = searchParams.get("pageToken") || undefined;
  const category = searchParams.get("category") || "all";
  const searchQuery = searchParams.get("search") || "";

  const session = await auth();
  const access_token = session?.accessToken;
  const refresh_token = session?.refreshToken;

  if (session === null) return new NextResponse("Unauthorized", { status: 401 });
  else if (access_token === null) return new NextResponse("No access token", { status: 401 });
  else if (refresh_token === null) return new NextResponse("No refresh token", { status: 401 });

  const gmail = getGmailService(access_token as string, refresh_token as string);

  // Build the query combining category and search terms
  let query = "";
  switch (category) {
    case "drafts":
      query = "in:draft";
      break;
    case "sent":
      query = "in:sent";
      break;
    case "junk":
      query = "in:spam";
      break;
    case "trash":
      query = "in:trash";
      break;
    case "archive":
      query = "in:archive";
      break;
    case "social":
      query = "category:social in:inbox -in:drafts";
      break;
    case "updates":
      query = "category:updates in:inbox -in:drafts";
      break;
    case "promotions":
      query = "category:promotions in:inbox -in:drafts";
      break;
    case "all":
    default:
      query = "in:inbox -in:draft -in:sent -in:trash -in:spam";
      break;
  }

  // Append search query if provided
  if (searchQuery) {
    // Escape special characters in the search query
    const escapedSearchQuery = searchQuery
      .replace(/"/g, '\\"') // Escape double quotes
      .replace(/\\/g, "\\\\"); // Escape backslashes

    // Combine search with existing query
    query += ` "${escapedSearchQuery}"`;
  }

  const response = await (
    await gmail
  ).users.threads.list({
    userId: "me",
    maxResults: 7,
    pageToken,
    q: query,
  });

  const threads = await Promise.all(
    response.data.threads?.map(async (thread) => {
      const fullThread = await (
        await gmail
      ).users.threads.get({
        userId: "me",
        id: thread.id as string,
        format: "full",
      });

      // Set to store unique participants across the thread
      const threadParticipants = new Set<string>();

      const messages =
        fullThread.data.messages?.map((message) => {
          const headers = message.payload?.headers || [];
          const subject =
            headers.find((header) => header.name?.toLowerCase() === "subject")?.value ||
            "No Subject";
          const from =
            headers.find((header) => header.name?.toLowerCase() === "from")?.value ||
            "Unknown Sender";
          const to = headers.find((header) => header.name?.toLowerCase() === "to")?.value || "";
          const cc = headers.find((header) => header.name?.toLowerCase() === "cc")?.value || "";
          const replyTo =
            headers.find((header) => header.name?.toLowerCase() === "reply-to")?.value || "";
          const date = headers.find((header) => header.name?.toLowerCase() === "date")?.value || "";

          // Extract all email addresses from headers
          const fromEmails = extractEmails(from);
          const toEmails = extractEmails(to);
          const ccEmails = extractEmails(cc);
          const replyToEmails = extractEmails(replyTo);

          // Add all participants to the thread-level Set
          [...fromEmails, ...toEmails, ...ccEmails, ...replyToEmails].forEach((email) => {
            threadParticipants.add(email);
          });

          // Extract attachments
          const attachments =
            message.payload?.parts
              ?.filter((part: any) => part.filename && part.filename.length > 0)
              .map((part: any) => ({
                id: part.body?.attachmentId,
                filename: part.filename,
                mimeType: part.mimeType,
                size: part.body?.size,
              })) || [];

          // Extract other message information
          const email = fromEmails[0] || from;
          const name = cleanName(from.replace(/<[^>]+>/, "").trim());
          const text = extractMessageBody(message.payload);
          const read = !message.labelIds?.includes("UNREAD");
          const labels = message.labelIds || [];

          return {
            id: message.id,
            name,
            email,
            subject,
            text,
            date,
            read,
            labels,
            to: toEmails,
            cc: ccEmails,
            from: fromEmails,
            replyTo: replyToEmails,
            attachments,
            participants: {
              from: fromEmails,
              to: toEmails,
              cc: ccEmails,
              replyTo: replyToEmails,
            },
          };
        }) || [];

      return {
        id: thread.id,
        messages,
        participants: Array.from(threadParticipants),
      };
    }) || []
  );

  return new NextResponse(
    JSON.stringify({
      threads,
      nextPageToken: response.data.nextPageToken,
    }),
    { status: 200 }
  );
}
// Helper function to extract the message body
function extractMessageBody(payload: any): string {
  if (!payload) return "";

  const decodeBody = (data: string) => {
    return Buffer.from(data, "base64").toString("utf-8");
  };

  let htmlBody = "";
  let plainTextBody = "";

  const findBodies = (part: any) => {
    if (part.mimeType === "text/html" && part.body?.data) {
      htmlBody = decodeBody(part.body.data);
    } else if (part.mimeType === "text/plain" && part.body?.data) {
      plainTextBody = decodeBody(part.body.data);
    }

    if (part.parts) {
      part.parts.forEach(findBodies);
    }
  };

  findBodies(payload);
  return htmlBody || plainTextBody || "";
}

// Helper function to clean name strings
function cleanName(name: string): string {
  return name
    .replace(/^["']|["']$/g, "")
    .replace(/\\"/g, '"')
    .trim();
}
// Add a new endpoint to fetch attachment content
export async function GET_ATTACHMENT(req: Request) {
  const { searchParams } = new URL(req.url);
  const messageId = searchParams.get("messageId");
  const attachmentId = searchParams.get("attachmentId");

  const session = await auth();
  const access_token = session?.accessToken;
  const refresh_token = session?.refreshToken;

  if (!messageId || !attachmentId) {
    return new NextResponse("Missing messageId or attachmentId", { status: 400 });
  }

  if (session === null) return new NextResponse("Unauthorized", { status: 401 });
  else if (access_token === null) return new NextResponse("No access token", { status: 401 });
  else if (refresh_token === null) return new NextResponse("No refresh token", { status: 401 });

  const gmail = getGmailService(access_token as string, refresh_token as string);

  try {
    const attachment = await (
      await gmail
    ).users.messages.attachments.get({
      userId: "me",
      messageId,
      id: attachmentId,
    });

    return new NextResponse(JSON.stringify(attachment.data), { status: 200 });
  } catch (error) {
    return new NextResponse("Failed to fetch attachment", { status: 500 });
  }
}
