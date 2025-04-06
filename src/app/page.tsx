"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
  return (
    <div>
      <div className="h-screen w-full dark:bg-black bg-white  dark:bg-grid-white/[0.2] bg-grid-black/[0.2] relative flex items-center justify-center">
        {/* Radial gradient for the container to give a faded look */}
        <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
        {/* HERO SECTION CONTENT */}
        <div>
          <p className="text-3xl sm:text-7xl font-bold relative z-20 bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-black py-8 text-center">
            A modern,
            <br /> AI driven email client.
          </p>
          <p className="text-center text-zinc-600 text-xl flex items-center justify-center">
            {/* <img src="LOGO.png" className="w-8 h-8 mr-2" /> */}
            PHNER is a mordern email client that streamlines your mailbox management with AI
          </p>
          {/* BUTTONS */}
          <div className="flex items-center justify-center gap-4 mt-5">
            <a href="/login">
              <Button className="rounded-s-full font-mono font-bold">Get started</Button>
            </a>
            <a href="/pricing">
              <Button variant="link" className="font-mono font-bold hover-underline">
                Learn more
              </Button>
            </a>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* What we offer section */}
        <section className="space-y-8">
          <h1
            className="text-4xl md:text-5xl font-bold text-center text-zinc-600 scroll-mt-20"
            id="features"
          >
            What we offer:
          </h1>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              title="AI driven features"
              description="Compose, Reply, Forward to or Ask our built in AI assistant for quick summary to help quicken your workflow"
            />
            <FeatureCard
              title="Eliminate Clutter"
              description="Easily manage your inbox with AI organization and free up additional storage space"
            />
            <FeatureCard
              title="Built on top of GMAIL"
              description="Keeping you focused on your workflow and worry-free, as our client is built on top of Google's encrypted mailing API"
            />
          </div>
        </section>
        <section></section>
        {/* Email Client Interface Image */}
        <div className="relative max-w-screen-lg rounded-lg overflow-hidden shadow-lg mx-auto border-gray-300 border-[1px]">
          <img src="/mailUI.png" alt="Email client interface" className="w-full h-auto" />
        </div>
      </div>
      {/* session stuff */}
      {/* {session?.user && <p>logged in</p>}
      <div>home page</div>
      <Button onClick={() => signOut()}>Sign out</Button> */}
    </div>
  );
}
function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="p-6 shadow-lg hover:shadow-xl transition-shadow">
      <h2 className="text-2xl font-semibold mb-3 text-zinc-600 text-center">{title}</h2>
      <p className="text-gray-500">{description}</p>
    </Card>
  );
}
