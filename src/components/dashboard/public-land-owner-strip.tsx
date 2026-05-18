import { WalletAvatar } from "@/components/ui/wallet-avatar";
import { UI_TEXT } from "@/lib/ui-styles";
import { cn, shortWallet } from "@/lib/utils";

interface PublicLandOwnerStripProps {
  owner: string;
  className?: string;
}

/** Owner wallet row — mobile header or desktop overlay on the map. */
export function PublicLandOwnerStrip({ owner, className }: PublicLandOwnerStripProps) {
  return (
    <div className={cn("flex items-center gap-2.5 min-w-0", className)}>
      <WalletAvatar size="md" />
      <div className="min-w-0">
        <div className="font-px glow-c text-[12px] 2xl:text-[16px]">
          {shortWallet(owner)}
        </div>
        <div className={`${UI_TEXT.labelTextSm} text-muted-neon truncate max-w-[min(100%,280px)]`}>
          {owner} · OWNER
        </div>
      </div>
    </div>
  );
}
