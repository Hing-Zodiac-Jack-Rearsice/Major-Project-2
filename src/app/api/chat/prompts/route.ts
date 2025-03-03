import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const userEmail = session.user.email;
    const user = await prisma.user.findUnique({
      where: { email: userEmail as string },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const now = new Date();
    const DAILY_PROMPT_LIMIT = user.isSubscribed ? 45 : 15;
    // Check if we need to reset (if lastPromptReset was yesterday or earlier)
    const shouldResetCount =
      !user.lastPromptReset ||
      user.lastPromptReset.getDate() !== now.getDate() ||
      user.lastPromptReset.getMonth() !== now.getMonth() ||
      user.lastPromptReset.getFullYear() !== now.getFullYear();

    let promptsRemaining;

    if (shouldResetCount) {
      promptsRemaining = DAILY_PROMPT_LIMIT;
    } else {
      promptsRemaining = DAILY_PROMPT_LIMIT - user.prompts;
    }

    return new NextResponse(JSON.stringify({ promptsRemaining }), { status: 200 });
  } catch (error) {
    console.error("Failed to get prompt count:", error);
    return new NextResponse("Failed to get prompt count", { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();

  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const userEmail = session.user.email;
    const user = await prisma.user.findUnique({
      where: { email: userEmail as string },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const now = new Date();
    const DAILY_PROMPT_LIMIT = user.isSubscribed ? 45 : 15;

    // Check if we need to reset (if lastPromptReset was yesterday or earlier)
    const shouldResetCount =
      !user.lastPromptReset ||
      user.lastPromptReset.getDate() !== now.getDate() ||
      user.lastPromptReset.getMonth() !== now.getMonth() ||
      user.lastPromptReset.getFullYear() !== now.getFullYear();

    let updatedUser;

    if (shouldResetCount) {
      // Reset count for new day and count this usage
      updatedUser = await prisma.user.update({
        where: { email: userEmail as string },
        data: {
          prompts: 1,
          lastPromptReset: now,
        },
      });
    } else {
      // Just increment the prompt count
      updatedUser = await prisma.user.update({
        where: { email: userEmail as string },
        data: {
          prompts: {
            increment: 1,
          },
        },
      });
    }

    // Calculate remaining prompts
    let promptsRemaining;

    if (user.isSubscribed) {
      promptsRemaining = DAILY_PROMPT_LIMIT - updatedUser.prompts;
    } else {
      promptsRemaining = DAILY_PROMPT_LIMIT - updatedUser.prompts;
      if (promptsRemaining < 0) promptsRemaining = 0;
    }

    return new NextResponse(JSON.stringify({ promptsRemaining }), { status: 200 });
  } catch (error) {
    console.error("Failed to decrement prompt count:", error);
    return new NextResponse("Failed to decrement prompt count", { status: 500 });
  }
}
