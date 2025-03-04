import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { signIn } from "next-auth/react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-02-24.acacia",
  });
  const body = await request.text();
  const signature = headers().get("stripe-signature");
  let data, eventType, event;
  if (!signature || !webhookSecret) {
    // Handle the case where the signature is missing
    return new Response("Missing Stripe signature or webhooksecret", { status: 400 });
  }
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error(`Webhook signature verification failed. Error: ${error}`);
    return NextResponse.json({ error: error }, { status: 400 });
  }
  data = event.data;
  eventType = event.type;
  try {
    switch (eventType) {
      case "checkout.session.completed": {
        const sessionId = (data.object as Stripe.Checkout.Session).id;
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ["line_items"],
        });
        const customerID = session?.customer as string;
        const customer = (await stripe.customers.retrieve(customerID)) as Stripe.Customer;
        const priceID = "price_1QyrwBRn7kObMNRdrcfmzcze";
        console.log("Stripe Session:", session);
        console.log("Customer Retrieved:", customer);
        let user;
        if (customer.email) {
          user = await prisma.user.findUnique({ where: { email: customer.email } });
          if (!user) {
            user = await prisma.user.create({
              data: {
                email: customer.email as string,
                name: customer.name,
                customerID: customerID,
                priceID: priceID,
              },
            });
          }
        } else {
          console.error("No user found");
          throw new Error("No user found");
        }
        if (user.email) {
          user = await prisma.user.update({
            where: { email: user.email },
            // update user role to grant access to dashboard
            data: {
              isSubscribed: true,
              priceID: priceID,
              customerID: customerID,
            },
          });
          console.log("User After Update:", user);
          await signIn();
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = await stripe.subscriptions.retrieve(
          (data.object as Stripe.Subscription).id
        );
        const user = await prisma.user.findFirst({
          where: { customerID: subscription.customer as string },
        });
        const revokeUserAccess = await prisma.user.update({
          where: {
            email: user?.email as string,
          },
          data: {
            // return back to user role to revoke dashboard access
            isSubscribed: false,
          },
        });
        break;
      }
    }
  } catch (error) {
    console.error("stripe error: " + error + "| EVENT TYPE: " + eventType);
  }
  return NextResponse.json({});
}
