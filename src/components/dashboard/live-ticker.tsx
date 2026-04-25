import { Fragment } from "react";
import { LIVE_TICKER } from "@/lib/mock-data";

export function LiveTicker() {
  return (
    <div className="flex items-center gap-3.5 flex-wrap text-muted-neon">
      <span className="font-silk text-[12px] glow-c tracking-widest">◉ LIVE</span>
      <span className="font-pixel-body text-base">
        {LIVE_TICKER.map((event, i) => {
          const addrClass = i % 2 === 0 ? "glow-m" : "glow-c";
          return (
            <Fragment key={event.addr + event.target}>
              <span className={addrClass}>{event.addr}</span> {event.action}{" "}
              <span className="text-yellow-neon">{event.target}</span>
              {i < LIVE_TICKER.length - 1 ? (
                <span className="opacity-50 mx-3.5">·</span>
              ) : null}
            </Fragment>
          );
        })}
      </span>
    </div>
  );
}
