import { db } from "@/server/db";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {
  const { data } = await req.json();
  console.log("clerk webhook received", data);

  const emailAddress = data.email_addresses[0].email_address;
  const firstName = data.first_name;
  const lastName = data.last_name;
  const imageUrl = data.image_url;
  const id = data.id;
  await db.user.create({
    data: {
      emailAddress: emailAddress,
      firstName,
      lastName,
      imageUrl,
      id: id,
    },
  });
  return new NextResponse("webhook receieved", { status: 200 });
};
