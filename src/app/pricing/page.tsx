"use client";
import type React from "react";
import { Check } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

export default function PricingPage() {
  const { data: session } = useSession();
  return (
    <div className="container px-4 py-24 mx-auto">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Choose the plan that's right for you and start empowering your mailbox with AI
        </p>
      </div>

      <div className="grid max-w-md grid-cols-1 gap-8 mx-auto lg:max-w-4xl lg:grid-cols-2">
        {/* Free Plan */}
        <div className="flex flex-col justify-between rounded-lg border bg-card p-8 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold">Free</h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-4xl font-bold tracking-tight">$0</span>
              <span className="ml-1 text-muted-foreground">/month</span>
            </div>
            <p className="mt-4 text-muted-foreground">Perfect for trying out our service</p>

            <ul className="mt-8 space-y-3">
              <PricingFeature>
                <strong>15</strong> AI prompts per day
              </PricingFeature>
              {/* <PricingFeature>Basic support</PricingFeature> */}
              <PricingFeature>Access to gpt-3.5-turbo</PricingFeature>
              {/* <PricingFeature>Standard response time</PricingFeature> */}
            </ul>
          </div>
          {session?.user ? (
            <Button asChild className="mt-8 w-full">
              <Link href="/mail">Get started</Link>
            </Button>
          ) : (
            <Button asChild className="mt-8 w-full">
              <Link href="/login">Get started</Link>
            </Button>
          )}
        </div>

        {/* Paid Plan */}
        <div className="relative flex flex-col justify-between rounded-lg border border-primary bg-card p-8 shadow-lg">
          <div className="absolute -top-4 left-0 right-0 mx-auto w-fit rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground">
            Recommended
          </div>
          <div>
            <h3 className="text-lg font-semibold">Pro</h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-4xl font-bold tracking-tight">$7.99</span>
              <span className="ml-1 text-muted-foreground">/month</span>
            </div>
            <p className="mt-4 text-muted-foreground">
              For power users who need more AI capabilities
            </p>

            <ul className="mt-8 space-y-3">
              <PricingFeature>
                <strong>45</strong> AI prompts per day
              </PricingFeature>
              {/* <PricingFeature>Priority support</PricingFeature> */}
              <PricingFeature>Access to gpt-4o-mini</PricingFeature>
              {/* <PricingFeature>Faster response time</PricingFeature>
              <PricingFeature>Advanced customization options</PricingFeature>
              <PricingFeature>Detailed analytics</PricingFeature> */}
            </ul>
          </div>
          {session?.user ? (
            <Button asChild className="mt-8 w-full">
              <Link href="/mail">Upgrade now</Link>
            </Button>
          ) : (
            <Button asChild className="mt-8 w-full">
              <Link href="/login">Upgrade now</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
        <div className="mt-8 max-w-3xl mx-auto grid gap-6">
          <FAQ
            question="What counts as an AI prompt?"
            answer="An AI prompt is any request you send to our AI system. Each time you ask the AI to generate content, answer a question, or perform a task, it counts as one prompt."
          />
          <FAQ
            question="Can I upgrade or downgrade at any time?"
            answer="Yes, you can upgrade to the Pro plan at any time. If you downgrade from Pro to Free, the change will take effect at the end of your current billing cycle."
          />
          <FAQ
            question="Do unused prompts roll over to the next day?"
            answer="No, unused prompts do not roll over. Your prompt count resets at the beginning of each day."
          />
        </div>
      </div>
    </div>
  );
}

function PricingFeature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start">
      <div className="flex-shrink-0">
        <Check className="h-5 w-5 text-primary" />
      </div>
      <p className="ml-3 text-muted-foreground">{children}</p>
    </li>
  );
}

function FAQ({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-lg border p-6 text-left">
      <h3 className="font-medium">{question}</h3>
      <p className="mt-2 text-muted-foreground">{answer}</p>
    </div>
  );
}
