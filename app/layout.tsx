import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: {
    default: "Jaffna Basket Export Intelligence",
    template: "%s | Jaffna Basket Export Intelligence",
  },
  description:
    "AI-powered export compliance platform for Sri Lankan products. Analyze regulations, generate compliance reports, and export with confidence.",
  keywords: [
    "export compliance",
    "Sri Lanka",
    "customs",
    "trade regulations",
    "Jaffna Basket",
    "export intelligence",
  ],
  authors: [{ name: "Jaffna Basket" }],
  openGraph: {
    title: "Jaffna Basket Export Intelligence",
    description: "AI-powered export compliance for Sri Lankan products",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} min-h-screen bg-background text-foreground antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "hsl(40 33% 99%)",
                border: "1px solid hsl(38 22% 86%)",
                color: "hsl(222 35% 15%)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
