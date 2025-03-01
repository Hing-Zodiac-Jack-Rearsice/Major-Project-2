import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { auth } from "@/lib/auth"; // Adjust path based on your NextAuth setup
import { streamText } from "ai";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!, // Ensure you have this in your .env
// });

export async function POST(req: Request) {
  try {
    const session = await auth;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, mailContext } = await req.json();

    const result = streamText({
      model: openai("gpt-3.5-turbo"),
      system: `You are a helpful AI assistant embedded in an email client app. Use the following context about the email thread to answer the user's questions. Be concise and direct in your responses
       
      START CONTEXT BLOCK
      ${mailContext}
      END OF CONTEXT BLOCK
      `,
      messages,
    });
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
