"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type MouseEvent } from "react";
import { ChevronDown, Copy, ExternalLink, LogOut, Menu, Pencil, User, X } from "lucide-react";
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
  if (pathname.startsWith("/land")) return "public";
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
  className: extraClassName,
  onNavigate,
}: {
  label: string;
  href: string;
  active: boolean;
  disabled: boolean;
  prefetch?: boolean;
  onGuard?: (e: MouseEvent) => void;
  className?: string;
  onNavigate?: () => void;
}) {
  const className = cn(
    navLinkClass,
    active &&
      "text-cyan-neon border-cyan-neon [text-shadow:0_0_8px_rgba(34,211,238,0.5)]",
    disabled && "text-muted-neon-2 cursor-not-allowed hover:text-muted-neon-2",
    extraClassName,
  );
  if (disabled) {
    return (
      <button
        type="button"
        className={className}
        onClick={(e) => {
          onGuard?.(e);
          onNavigate?.();
        }}
      >
        {label}
      </button>
    );
  }
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={className}
      onClick={() => onNavigate?.()}
    >
      {label}
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isConnected, wallet, disconnect, openConnectModal } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);

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
    router.push(`/land?wallet=${encodeURIComponent(wallet.address)}`);
  };

  const openExplorer = () => {
    if (!wallet) return;
    window.open(`https://solscan.io/account/${wallet.address}`, "_blank", "noopener,noreferrer");
  };

  return (
    <header className="relative z-30 border-b-2 border-border-neon bg-[rgba(10,6,18,0.85)] backdrop-blur-sm">
      <div className="flex items-center gap-3 px-3 py-2.5 sm:px-5 sm:py-3">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <PixelLogo size={28} />
          <div className="font-px text-[14px] xs:text-[16px] 2xl:text-[20px] leading-none">
            <span className="glow-m">ONCHAIN</span>
            <span className="glow-c">.ME</span>
          </div>
        </Link>

        <nav className="hidden sm:flex items-center gap-0.5 flex-1 ml-7">
          <NavLink label="Home" href="/" active={current === "home"} disabled={false} prefetch />
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

        <div className="flex-1 sm:hidden" />

        {isConnected && wallet ? (
          <div className="hidden sm:block">
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
                <DropdownMenuItem onSelect={() => router.push("/my-land")} className="cursor-pointer text-[16px]">
                  <User className="size-4" />
                  <span>My Land</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => router.push("/edit")} className="cursor-pointer text-[16px]">
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
                <DropdownMenuItem onSelect={() => void disconnect()} variant="destructive" className="cursor-pointer text-[16px]">
                  <LogOut className="size-4" />
                  <span>Disconnect</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="hidden sm:block">
            <Button variant="primary" onClick={openConnectModal}>
              Connect Wallet
            </Button>
          </div>
        )}

        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="sm:hidden inline-flex items-center justify-center w-10 h-10 border-2 border-border-neon bg-bg-2 text-ink"
        >
          {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {menuOpen ? (
        <div className="sm:hidden border-t-2 border-border-neon bg-[rgba(10,6,18,0.96)] px-3 py-3 flex flex-col gap-2">
          <nav className="flex flex-col">
            <NavLink
              label="Home"
              href="/"
              active={current === "home"}
              disabled={false}
              prefetch
              className="border-b-0 px-2 py-2.5"
              onNavigate={() => setMenuOpen(false)}
            />
            <NavLink
              label="My Land"
              href="/my-land"
              active={current === "my"}
              disabled={needsWallet}
              prefetch={false}
              onGuard={guard("/my-land")}
              className="border-b-0 px-2 py-2.5"
              onNavigate={() => setMenuOpen(false)}
            />
            <NavLink
              label="Edit"
              href="/edit"
              active={current === "edit"}
              disabled={needsWallet}
              prefetch={false}
              onGuard={guard("/edit")}
              className="border-b-0 px-2 py-2.5"
              onNavigate={() => setMenuOpen(false)}
            />
          </nav>

          <div className="border-t-2 border-border-neon pt-3">
            {isConnected && wallet ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-1">
                  <WalletAvatar size="sm" />
                  <span className={cn(UI_TEXT.labelText, "glow-c truncate")}>
                    {wallet.shortAddress}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void copyAddress();
                  }}
                  className="justify-start"
                >
                  <Copy className="size-3" /> Copy address
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMenuOpen(false);
                    openPublicLand();
                  }}
                  className="justify-start"
                >
                  <ExternalLink className="size-3" /> Public Land
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMenuOpen(false);
                    openExplorer();
                  }}
                  className="justify-start"
                >
                  <ExternalLink className="size-3" /> Solscan
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMenuOpen(false);
                    void disconnect();
                  }}
                  className="justify-start text-magenta-neon border-magenta-neon"
                >
                  <LogOut className="size-3" /> Disconnect
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                onClick={() => {
                  setMenuOpen(false);
                  openConnectModal();
                }}
                className="w-full"
              >
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
