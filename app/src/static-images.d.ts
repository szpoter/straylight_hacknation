// Typy dla importów obrazów (np. hero-visual.tsx importuje .jpg z app/assets).
// Next dodaje je w next-env.d.ts, ale ten plik powstaje dopiero przy `next dev` / `next build`
// i jest w .gitignore, a CI uruchamia `tsc --noEmit` przed buildem.
/// <reference types="next/image-types/global" />
