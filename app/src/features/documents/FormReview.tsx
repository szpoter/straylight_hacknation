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

export function SendStep({ def, values, recipient, pdf, onSend, onBack, onEdit }: {
  def: FormDef;
  recipient: string;
  pdf?: React.ReactNode;
  values: Values;
  onEdit: (field: string) => void;
  onSend: (channel: Channel) => void;
  onBack: () => void;
}) {
  const [channel, setChannel] = useState<Channel>(def.channels[0]);
  const delivery = CHANNEL_LABEL[channel];
  const destination = def.recipientFor?.(values, channel) ?? recipient;
  const missing = Object.entries(def.validateChannel?.(values, channel) ?? {});
  return (
    <div className="flex flex-col gap-stack">
      <ChoiceGroup
        legend={`Jak chcesz przekazać wniosek? Odbiorca: ${destination.replace(/^Do /, "")}`}
        choices={def.channels.map((value) => ({ value, label: CHANNEL_LABEL[value].label, hint: CHANNEL_LABEL[value].hint }))}
        value={channel}
        onChange={(value) => setChannel(value as Channel)}
        columns={2}
      />
      {delivery.mode === "online" ? (
        <p className="max-w-prose">To symulacja. Dane zostaną w Twoim planie. Po zatwierdzeniu zobaczysz przykładowe potwierdzenie.</p>
      ) : (
        <section className="flex max-w-prose flex-col gap-3">
          {delivery.mode === "pdf" && pdf}
          {(def.bring || delivery.mode === "osobiscie") && <p><strong>Co zabrać lub dołączyć</strong><br />{def.bring ?? delivery.hint}</p>}
          {delivery.mode === "pdf" && <p>Po samodzielnym przekazaniu dokumentu zapisz ten krok w planie.</p>}
        </section>
      )}
      {missing.length > 0 && <div role="alert">{missing.map(([id, message]) => (
        <p key={id}>{message} <button type="button" className="underline" onClick={() => onEdit(id)}>Popraw dane</button></p>
      ))}</div>}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button className="justify-center" disabled={missing.length > 0} onClick={() => onSend(channel)}>
          {delivery.mode === "online" ? "Symuluj wysyłkę" : delivery.mode === "osobiscie" ? "Załatwione w urzędzie" : "Potwierdzam samodzielne przekazanie"}
        </Button>
        <Button variant="secondary" className="justify-center" onClick={onBack}>Wróć do sprawy</Button>
      </div>
    </div>
  );
}
