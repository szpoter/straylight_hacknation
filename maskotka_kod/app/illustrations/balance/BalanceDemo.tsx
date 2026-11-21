"use client";

import { useState } from "react";
import { BalanceScale } from "@/components/illustrations/BalanceScale";
import { LOOP, REST } from "@/components/illustrations/balanceScaleModel";

/** Suwak klatek: waga zatrzymana w wybranej sekundzie pętli. */
export function BalanceFrames() {
  const [time, setTime] = useState(REST);
  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-4 text-sm">
        <span className="w-20 tabular-nums">{time.toFixed(2)} s</span>
        <input
          type="range"
          min={0}
          max={LOOP}
          step={0.05}
          value={time}
          onChange={(event) => setTime(Number(event.target.value))}
          className="flex-1"
        />
      </label>
      <BalanceScale time={time} className="mx-auto w-full max-w-md" />
    </div>
  );
}
