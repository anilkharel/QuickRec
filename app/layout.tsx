import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuickRec",
  description:
    "Create professional screen recordings, tutorials, and presentations in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
