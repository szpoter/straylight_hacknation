"use client";

import { useState } from "react";
import { Button, ChoiceGroup, FieldError } from "@/components/ui";
import { CHANNEL_LABEL, type Channel, type FormDef } from "@/lib/demo/forms";
import { displayValue, isVisible, type Values } from "./flow";

/**
 * „Sprawdź odpowiedzi” (GOV.UK Check answers): sekcje wniosku jako listy etykieta → wartość,
 * przy każdym polu „Zmień”. `readOnly` — podgląd wysłanego wniosku, bez zmian i zatwierdzania.
 */
export function CheckAnswers({
  def,
  values,
  onChangeField,
  onApprove,
  onBack,
  readOnly,
}: {
  def: FormDef;
  values: Values;
  onChangeField?: (fieldId: string) => void;
  onApprove?: () => void;
  onBack: () => void;
  readOnly?: boolean;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="flex flex-col gap-stack">
      {def.sections.map((section) => {
        const fields = section.fields.filter((f) => isVisible(f, values));
        if (fields.length === 0) return null;
        return (
          <section key={section.id} aria-labelledby={`spr-${section.id}`}>
            <h3 id={`spr-${section.id}`} className="mb-3 font-serif text-title">
              {section.title}
            </h3>
            <dl className="divide-y divide-outline border-y border-outline">
              {fields.map((f) => (
                <div key={f.id} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 py-4 md:grid-cols-[minmax(10rem,16rem)_1fr_auto] md:items-baseline">
                  <dt className="text-meta text-on-surface-variant md:text-body md:text-on-surface">{f.label}</dt>
                  <dd className="col-start-1 font-medium md:col-start-2">{displayValue(f, values[f.id])}</dd>
                  {!readOnly && onChangeField && (
                    <dd className="col-start-2 row-span-2 row-start-1 self-center md:col-start-3 md:row-span-1">
                      <button type="button" onClick={() => onChangeField(f.id)} className="text-label underline underline-offset-4 decoration-outline hover:decoration-on-surface">
                        Zmień<span className="sr-only"> {f.label.toLowerCase()}</span>
                      </button>
                    </dd>
                  )}
                </div>
              ))}
            </dl>
          </section>
        );
      })}

      {readOnly ? (
        <Button variant="secondary" className="self-start" onClick={onBack}>
          Wróć do sprawy
        </Button>
      ) : (
        <div className="flex flex-col gap-4 border-t border-outline pt-6">
          {error && <FieldError>Potwierdź oświadczenie, żeby zatwierdzić wniosek</FieldError>}
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => {
                setConfirmed(e.target.checked);
                setError(false);
              }}
              className="mt-1 size-5 shrink-0 accent-primary"
            />
            <span>Sprawdziłam/sprawdziłem dane. Są zgodne z prawdą.</span>
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button className="justify-center" onClick={() => (confirmed ? onApprove?.() : setError(true))}>
              Zatwierdź wniosek
            </Button>
            <Button variant="secondary" className="justify-center" onClick={onBack}>
              Wróć do sprawy
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * „Przekaż”: wybór kanału i symulowana wysyłka. Przy „E-mailem jako PDF” pokazujemy plik
 * do pobrania (`pdf`), bo ten kanał rodzic obsługuje sam.
 */
export function SendStep({
  channels,
  recipient,
  pdf,
  onSend,
  onBack,
}: {
  channels: Channel[];
  recipient: string;
  pdf?: React.ReactNode;
  onSend: (channel: Channel) => void;
  onBack: () => void;
}) {
  const [channel, setChannel] = useState<Channel>(channels[0]);
  return (
    <div className="flex flex-col gap-stack">
      <ChoiceGroup
        legend={`Jak przekazano wniosek? Odbiorca: ${recipient.replace(/^Do /, "")}`}
        choices={channels.map((c) => ({ value: c, label: CHANNEL_LABEL[c].label, hint: CHANNEL_LABEL[c].hint }))}
        value={channel}
        onChange={(v) => setChannel(v as Channel)}
        columns={2}
      />
      {channel === "email" && pdf && (
        <section aria-labelledby="plik-pdf" className="flex max-w-prose flex-col gap-3 rounded-sm border border-outline p-4">
          <h3 id="plik-pdf" className="font-medium">
            Wniosek jako PDF
          </h3>
          <p className="text-on-surface-variant">Pobierz plik z Twoimi danymi i wyślij go sam(a), np. do kadr. Potem kliknij „Przekaż wniosek”, żeby zapisać wysyłkę w przebiegu sprawy.</p>
          {pdf}
        </section>
      )}
      <p className="max-w-prose rounded-sm bg-surface p-4 text-on-surface-variant">
        Najpierw samodzielnie przekaż wniosek odbiorcy. Potem zapisz w planie datę i sposób przekazania. Urzędowe potwierdzenie zachowaj u siebie.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button className="justify-center" onClick={() => onSend(channel)}>
          Potwierdzam samodzielne przekazanie
        </Button>
        <Button variant="secondary" className="justify-center" onClick={onBack}>
          Wróć do sprawy
        </Button>
      </div>
    </div>
  );
}
