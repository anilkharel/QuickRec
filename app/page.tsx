import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowRight, Video } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 m-auto">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Record Your Screen With Ease
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Create professional screen recordings, tutorials, and
                    presentations in seconds.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" className="h-12" asChild>
                    <Link href="/record">
                      Start Recording Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="relative flex items-center justify-center">
                <div className="relative w-full overflow-hidden rounded-xl border bg-background shadow-xl">
                  <div className="flex h-8 items-center border-b bg-muted px-4">
                    <div className="flex space-x-1.5">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500"></div>
                      <div className="h-2.5 w-2.5 rounded-full bg-yellow-500"></div>
                      <div className="h-2.5 w-2.5 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                  <div className="relative aspect-video overflow-hidden bg-black">
                    <Image
                      src="/image/image1.jpg"
                      width={1280}
                      height={720}
                      alt="Screen recording preview"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex h-10 items-center border-t bg-muted px-4">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Video className="h-4 w-4" />
                      <span>Recording in progress...</span>
                    </div>
                    <div className="ml-auto flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                      <span className="text-xs text-muted-foreground">
                        00:00
                      </span>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 -z-10 h-[350px] w-[350px] rounded-full bg-gradient-to-r from-primary/20 to-primary/40 blur-3xl"></div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
