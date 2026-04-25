"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type MouseEvent } from "react";
import { ChevronDown, Copy, LogOut } from "lucide-react";
import { PixelLogo } from "@/components/ui/pixel-logo";
import { Button } from "@/components/ui/button";
import { WalletAvatar } from "@/components/ui/wallet-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useWallet } from "@/hooks/wallet";

type PageKey = "home" | "my" | "edit" | "public";

function getPageKey(pathname: string | null): PageKey | null {
  if (!pathname) return null;
  if (pathname === "/") return "home";
  if (pathname.startsWith("/my-land")) return "my";
  if (pathname.startsWith("/edit")) return "edit";
  if (pathname.startsWith("/land/")) return "public";
  return null;
}

const navLinkClass =
  "font-px text-[10px] tracking-[0.08em] uppercase text-muted-neon px-2.5 py-2 border-b-2 border-transparent transition-colors hover:text-ink-2";

function NavLink({
  label,
  href,
  active,
  disabled,
  onGuard,
}: {
  label: string;
  href: string;
  active: boolean;
  disabled: boolean;
  onGuard?: (e: MouseEvent) => void;
}) {
  const className = cn(
    navLinkClass,
    active &&
      "text-cyan-neon border-cyan-neon [text-shadow:0_0_8px_rgba(34,211,238,0.5)]",
    disabled && "text-muted-neon-2 cursor-not-allowed hover:text-muted-neon-2",
  );
  if (disabled) {
    return (
      <button type="button" className={className} onClick={onGuard}>
        {label}
      </button>
    );
  }
  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isConnected, wallet, disconnect, openConnectModal } = useWallet();

  const current = getPageKey(pathname);
  const needsWallet = !isConnected;

  const guard = (href: string) => (e: MouseEvent) => {
    if (needsWallet) {
      e.preventDefault();
      openConnectModal();
    } else {
      router.push(href);
    }
  };

  const copyAddress = async () => {
    if (!wallet) return;
    try {
      await navigator.clipboard.writeText(wallet.address);
    } catch {}
  };

  return (
    <header
      className="flex items-center gap-3 px-5 py-3 border-b-2 border-border-neon relative z-20 bg-[rgba(10,6,18,0.85)] backdrop-blur-sm"
    >
      <Link href="/" className="flex items-center gap-2.5">
        <PixelLogo size={32} />
        <div className="font-px text-[13px] leading-none">
          <span className="glow-m">ONCHAIN</span>
          <span className="glow-c">.ME</span>
        </div>
      </Link>

      <nav className="flex items-center gap-0.5 flex-1 ml-7">
        <NavLink
          label="Home"
          href="/"
          active={current === "home"}
          disabled={false}
        />
        <NavLink
          label="My Land"
          href="/my-land"
          active={current === "my"}
          disabled={needsWallet}
          onGuard={guard("/my-land")}
        />
        <NavLink
          label="Edit"
          href="/edit"
          active={current === "edit"}
          disabled={needsWallet}
          onGuard={guard("/edit")}
        />
      </nav>

      {isConnected && wallet ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="gap-2 px-2.5 py-1.5 h-auto border-2 border-border-neon bg-bg-2 hover:bg-panel-2 hover:border-border-neon shadow-none font-silk text-[11px] normal-case tracking-normal"
            >
              <WalletAvatar size="sm" />
              {wallet.shortAddress}
              <ChevronDown className="size-3 text-muted-neon" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={copyAddress}>
              <Copy className="size-3" />
              <span>Copy address</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => disconnect()} variant="destructive">
              <LogOut className="size-3" />
              <span>Disconnect</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button variant="primary" onClick={openConnectModal}>
          Connect Wallet
        </Button>
      )}
    </header>
  );
}
