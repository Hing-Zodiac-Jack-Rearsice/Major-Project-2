"use server";

import { prisma } from "@/lib/prisma";

export async function getPrompt(userEmail: string) {
  const prompt = prisma.user.findUnique({
    where: {
      email: userEmail,
    },
    select: {
      prompts: true,
    },
  });
  return prompt;
}
