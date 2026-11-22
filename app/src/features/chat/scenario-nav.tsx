import { chatStarters } from "@/lib/zusik/conversation";
import s from "./scenario-nav.module.css";

export function ChatStarters({ onSelect, disabled }: { onSelect: (prompt: string) => void; disabled: boolean }) {
  return (
    <div className={s.shortcuts} role="group" aria-label="Zacznij od pytania">
      {chatStarters.map(({ label, prompt }) => (
        <button type="button" key={label} disabled={disabled} onClick={() => onSelect(prompt)}>{label}</button>
      ))}
    </div>
  );
}
