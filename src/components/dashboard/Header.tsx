"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type MouseEvent } from "react";
import { ChevronDown, Copy, ExternalLink, LogOut, Pencil, User } from "lucide-react";
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
import { UI_TEXT } from "@/lib/ui-styles";
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
  "font-px text-[12px] 2xl:text-[16px] tracking-[0.08em] uppercase text-muted-neon px-2.5 py-2 border-b-2 border-transparent transition-colors hover:text-ink-2";

function NavLink({
  label,
  href,
  active,
  disabled,
  prefetch = true,
  onGuard,
}: {
  label: string;
  href: string;
  active: boolean;
  disabled: boolean;
  prefetch?: boolean;
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
    <Link href={href} prefetch={prefetch} className={className}>
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

  const openPublicLand = () => {
    if (!wallet) return;
    router.push(`/land/${wallet.address}`);
  };

  const openExplorer = () => {
    if (!wallet) return;
    window.open(`https://solscan.io/account/${wallet.address}`, "_blank", "noopener,noreferrer");
  };

  return (
    <header
      className="flex items-center gap-3 px-5 py-3 border-b-2 border-border-neon relative z-20 bg-[rgba(10,6,18,0.85)] backdrop-blur-sm"
    >
      <Link href="/" className="flex items-center gap-2.5">
        <PixelLogo size={32} />
        <div className="font-px text-[16px] 2xl:text-[20px] leading-none">
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
          prefetch
        />
        <NavLink
          label="My Land"
          href="/my-land"
          active={current === "my"}
          disabled={needsWallet}
          prefetch={false}
          onGuard={guard("/my-land")}
        />
        <NavLink
          label="Edit"
          href="/edit"
          active={current === "edit"}
          disabled={needsWallet}
          prefetch={false}
          onGuard={guard("/edit")}
        />
      </nav>

      {isConnected && wallet ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "gap-2 px-2.5 py-1.5 h-auto border-2 border-border-neon bg-bg-2 hover:bg-panel-2 hover:border-border-neon shadow-none normal-case tracking-normal",
                UI_TEXT.labelText,
              )}
            >
              <WalletAvatar size="sm" />
              {wallet.shortAddress}
              <ChevronDown className="size-3 text-muted-neon" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 border-2 border-border-neon bg-bg-2 font-pixel-body text-[16px]"
          >
            <DropdownMenuItem
              onSelect={() => router.push("/my-land")}
              className="cursor-pointer text-[16px]"
            >
              <User className="size-4" />
              <span>My Land</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => router.push("/edit")}
              className="cursor-pointer text-[16px]"
            >
              <Pencil className="size-4" />
              <span>Edit Land</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={openPublicLand} className="cursor-pointer text-[16px]">
              <ExternalLink className="size-4" />
              <span>Public Land Page</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={copyAddress} className="cursor-pointer text-[16px]">
              <Copy className="size-4" />
              <span>Copy address</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={openExplorer} className="cursor-pointer text-[16px]">
              <ExternalLink className="size-4" />
              <span>Open in Solscan</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => void disconnect()}
              variant="destructive"
              className="cursor-pointer text-[16px]"
            >
              <LogOut className="size-4" />
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