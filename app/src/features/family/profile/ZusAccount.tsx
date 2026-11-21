"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button, FieldError, Panel, RefreshIcon, SectionTitle, SummaryList } from "@/components/ui";
import { ZUS_ACCOUNT, ZUS_FETCHED_AT } from "./data";

/** „Moje konto w ZUS (symulacja eZUS)”: tylko do odczytu, „Odśwież dane” i „Zapytaj ZUS”. */
export function ZusAccount() {
  const [refreshing, setRefreshing] = useState(false);
  const [fetchedAt, setFetchedAt] = useState(ZUS_FETCHED_AT);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const refresh = () => {
    setRefreshing(true);
    // TODO(backend): ponowne pobranie danych z symulacji eZUS.
    timer.current = setTimeout(() => {
      setRefreshing(false);
      setFetchedAt(`${ZUS_FETCHED_AT}, przed chwilą`);
    }, 1200);
  };

  return (
    <Panel aria-labelledby="konto-zus">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <SectionTitle id="konto-zus">Moje konto w ZUS (symulacja eZUS)</SectionTitle>
          <p className="mt-1 text-meta text-on-surface-variant" aria-live="polite">
            {refreshing ? "Pobieramy dane z ZUS…" : `Źródło: ZUS · symulacja · pobrano ${fetchedAt}`}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={refresh} disabled={refreshing} className="self-start">
          <RefreshIcon size={16} className={refreshing ? "animate-spin" : undefined} />
          {refreshing ? "Odświeżamy…" : "Odśwież dane"}
        </Button>
      </div>
      <div className={refreshing ? "opacity-50" : undefined} aria-busy={refreshing}>
        {ZUS_ACCOUNT.map((group) => (
          <div key={group.title} className="mb-6">
            <h3 className="mb-2 font-sans text-label font-medium">{group.title}</h3>
            <SummaryList rows={group.rows} />
          </div>
        ))}
      </div>
      <AskZus />
    </Panel>
  );
}

/** Formularz wiadomości do ZUS — celowo bez postaci Zusika, żeby nie mylić z czatem. */
function AskZus() {
  const id = useId();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (sent)
    return (
      <div role="status" className="rounded-sm border border-outline bg-background p-4">
        <p className="font-medium">Wysłano w symulacji.</p>
        <p className="text-on-surface-variant">W prawdziwej usłudze odpowiedź przyjdzie do skrzynki eZUS. Wiadomość znajdziesz w korespondencji w „Dokumentach i wnioskach”.</p>
        <button type="button" className="mt-2 underline underline-offset-4 decoration-outline hover:decoration-on-surface" onClick={() => { setSent(false); setText(""); }}>
          Napisz kolejną wiadomość
        </button>
      </div>
    );

  return (
    <form
      className="flex flex-col gap-3 border-t border-outline pt-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return setError("Wpisz treść wiadomości");
        // TODO(backend): zapis w korespondencji sprawy jako „Wysłano w symulacji”.
        setSent(true);
      }}
    >
      <h3 className="font-sans text-label font-medium">Zapytaj ZUS</h3>
      <p className="text-meta text-on-surface-variant">Wiadomość do urzędu, nie do asystenta. W demo nic nie opuszcza aplikacji.</p>
      <label htmlFor={id} className="text-label font-medium">
        Treść wiadomości
      </label>
      {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
      <textarea
        id={id}
        rows={4}
        value={text}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => {
          setText(e.target.value);
          setError(null);
        }}
        className="w-full rounded-sm border border-outline bg-surface p-4 text-body focus:border-on-surface focus:outline-none"
      />
      <Button type="submit" variant="secondary" className="self-start">
        Wyślij do ZUS
      </Button>
    </form>
  );
}
