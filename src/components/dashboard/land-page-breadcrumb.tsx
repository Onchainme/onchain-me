import { UI_LAYOUT, UI_TEXT } from "@/lib/ui-styles";

interface LandPageBreadcrumbProps {
  wallet: string;
}

/** URL bar strip above public land grid — matches app page horizontal padding. */
export function LandPageBreadcrumb({ wallet }: LandPageBreadcrumbProps) {
  return (
    <div className={`${UI_LAYOUT.pageGrid} pb-0 sm:pb-0 pt-3 sm:pt-4`}>
      <p className={`${UI_TEXT.labelText} text-muted-neon break-all col-span-full`}>
        <span className="text-cyan-neon">onchain.me</span>/land/
        <span className="glow-m">{wallet}</span>
      </p>
    </div>
  );
}
