"use client";

import { useSyncExternalStore } from "react";

const PHONE_QUERY = "(max-width: 767px)";
function subscribePhone(notify: () => void) {
  const list = window.matchMedia(PHONE_QUERY);
  list.addEventListener("change", notify);
  return () => list.removeEventListener("change", notify);
}

export function usePhone() {
  return useSyncExternalStore(subscribePhone, () => window.matchMedia(PHONE_QUERY).matches, () => false);
}

function subscribeViewport(notify: () => void) {
  const viewport = window.visualViewport;
  viewport?.addEventListener("resize", notify);
  viewport?.addEventListener("scroll", notify);
  return () => {
    viewport?.removeEventListener("resize", notify);
    viewport?.removeEventListener("scroll", notify);
  };
}

/** Visible height and offset; the visible area shrinks when the on-screen keyboard opens. */
export function useVisualViewport(): { height: number; top: number } | null {
  const raw = useSyncExternalStore(
    subscribeViewport,
    () => `${Math.round(window.visualViewport?.height ?? window.innerHeight)}:${Math.round(window.visualViewport?.offsetTop ?? 0)}`,
    () => "",
  );
  if (!raw) return null;
  const [height, top] = raw.split(":").map(Number);
  return { height, top };
}
