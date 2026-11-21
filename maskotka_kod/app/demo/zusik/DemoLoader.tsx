"use client";

import dynamic from "next/dynamic";

/** The demo reads the browser (screen width, saved "Nie teraz", test switches), so it renders on the client only. */
export const DemoLoader = dynamic(() => import("./ZusikDemo"), { ssr: false });
