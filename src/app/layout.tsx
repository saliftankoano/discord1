import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "./convex-client-provider";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Discord",
  description: "Discord clone",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider dynamic>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
