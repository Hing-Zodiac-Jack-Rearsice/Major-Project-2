// /app/api/chat/messages/route.ts
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const threadId = url.searchParams.get("threadId");

  if (!threadId) {
    return NextResponse.json({ error: "ThreadId is required" }, { status: 400 });
  }

  try {
    const messages = await prisma.chatMessage.findMany({
      where: {
        threadId: threadId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Format messages to match AI SDK format
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
