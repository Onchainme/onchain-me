import type { Metadata } from "next";
import { Press_Start_2P, VT323, Silkscreen } from "next/font/google";
import { WalletProvider } from "@/hooks/wallet";
import { cn } from "@/lib/utils";
import "./globals.css";

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const vt323 = VT323({
  variable: "--font-vt323",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Onchain.me — Your Wallet, Your World",
  description:
    "Turn your Solana history into a collectible island. Each protocol you use unlocks a unique pixel building.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn(
        "dark",
        pressStart.variable,
        vt323.variable,
        silkscreen.variable,
      )}
    >
      <body className="min-h-screen">
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
