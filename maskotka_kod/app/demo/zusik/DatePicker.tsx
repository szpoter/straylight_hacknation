"use client";

import { useRef, useState } from "react";
import { MONTH_NAMES, toIso } from "./data";
import { CalendarIcon } from "./icons";

const WEEKDAYS = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"];

/** "Wybierz datę" under Zusik's question: a calendar next to the question; picking a day sends it. */
export function DatePicker({ month, onPick, disabled }: { month: string; onPick: (iso: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(() => month.split("-").map(Number) as [number, number]);
  const button = useRef<HTMLButtonElement>(null);
  const [year, monthNo] = shown;
  const firstWeekday = (new Date(Date.UTC(year, monthNo - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, monthNo, 0)).getUTCDate();

  const close = () => {
    setOpen(false);
    button.current?.focus();
  };
  const step = (delta: number) => {
    const index = year * 12 + (monthNo - 1) + delta;
    setShown([Math.floor(index / 12), (index % 12) + 1]);
  };

  return (
    <div className="zd-picker">
      <button
        ref={button}
        type="button"
        className="zd-btn zd-btn--ghost"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
      >
        <CalendarIcon />
        Wybierz datę
      </button>
      {open && (
        <div
          className="zd-calendar"
          role="dialog"
          aria-label="Wybierz datę"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              close();
            }
          }}
        >
          <div className="zd-calendar__head">
            <button type="button" className="zd-icon-btn" aria-label="Poprzedni miesiąc" onClick={() => step(-1)}>
              ‹
            </button>
            <span aria-live="polite">
              {MONTH_NAMES[monthNo - 1]} {year}
            </span>
            <button type="button" className="zd-icon-btn" aria-label="Następny miesiąc" onClick={() => step(1)}>
              ›
            </button>
          </div>
          <div className="zd-calendar__grid">
            {WEEKDAYS.map((day) => (
              <span key={day} className="zd-calendar__dow" aria-hidden="true">
                {day}
              </span>
            ))}
            {Array.from({ length: firstWeekday }, (_, i) => (
              <span key={`blank-${i}`} />
            ))}
            {Array.from({ length: days }, (_, i) => {
              const iso = toIso(year, monthNo, i + 1);
              return (
                <button
                  key={iso}
                  type="button"
                  className="zd-calendar__day"
                  aria-label={`${i + 1} ${MONTH_NAMES[monthNo - 1]} ${year}`}
                  autoFocus={i === 0}
                  onClick={() => {
                    setOpen(false);
                    onPick(iso);
                  }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
