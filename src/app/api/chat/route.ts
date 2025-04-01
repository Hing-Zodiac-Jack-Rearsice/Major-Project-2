import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { auth } from "@/lib/auth"; // Adjust path based on your NextAuth setup
import { streamText } from "ai";
import { prisma } from "@/lib/prisma";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!, // Ensure you have this in your .env
// });

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, mailContext, threadId, isSubscribed } = await req.json();
    // Save the user message to database
    const userMessage = messages[messages.length - 1];
    if (isSubscribed) {
      console.log("from chat: using gpt-4-turbo");
    } else {
      console.log("from chat: using gpt-3.5-turbo");
    }
    const result = streamText({
      model: isSubscribed ? openai("gpt-4-turbo") : openai("gpt-3.5-turbo"),
      system: `You are a helpful AI assistant embedded in an email client app. Use the following context about the email thread to answer the user's questions. Be concise and direct in your responses

      Restrictions: Don't respond to coding questions or anything that is not directly related to the email thread.

      START CONTEXT BLOCK
      ${mailContext}
      END OF CONTEXT BLOCK
      `,
      messages,
      onFinish: async ({ text }) => {
        await prisma.chatMessage.create({
          data: {
            userEmail: session.user.email as string,
            threadId,
            role: userMessage.role,
            content: userMessage.content,
          },
        });
        await prisma.chatMessage.create({
          data: {
            userEmail: session.user.email as string,
            threadId,
            role: "assistant",
            content: text,
          },
        });
        // console.log(text);
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
