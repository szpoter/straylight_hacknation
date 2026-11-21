"use client";

import { useState, type FormEvent } from "react";
import { MartaPdfPreview } from "./marta-pdf-preview";
import { AttachmentLinks, SavedAttachment, checkedCopy, storeCopy } from "./marta-attachment";
import type { MartaView } from "@/lib/marta/types";
import type { useCaseResource } from "./use-case-resource";
import s from "./marta-workflow.module.css";

type Case = ReturnType<typeof useCaseResource<MartaView>>;
type Variant = "together" | "sequential";
const labels: Record<Variant, string> = { together: "Razem", sequential: "Kolejno" };
const date = (iso: string) => iso.split("-").reverse().join(".");
const money = (value: number | null) =>
  value === null ? "Brak stawki" : new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(value);
const period = (item: { from: string; to: string }) => `${date(item.from)} – ${date(item.to)}`;

function ComparisonInputs({ state, onSaved }: { state: Case; onSaved: () => void }) {
  const { view, send, busy, loaded } = state;
  async function compare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const rate = (key: string) => (data.get(key) ? Number(data.get(key)) : null);
    if (
      await send({
        type: "compare",
        version: view?.version ?? 0,
        firstStart: data.get("start"),
        days: Number(data.get("days")),
        firstDaily: rate("first"),
        secondDaily: rate("second"),
        firstName: data.get("firstName"),
        secondName: data.get("secondName"),
        childName: data.get("childName"),
      })
    )
      onSaved();
  }
  return (
    <form className={s.form} onSubmit={compare}>
      <label>
        Początek urlopu Marty
        <input required name="start" type="date" defaultValue={view?.inputs.firstStart ?? "2027-01-11"} />
      </label>
      <label>
        Liczba dni dla każdego rodzica
        <input required name="days" type="number" min={1} max={143} step={1} defaultValue={view?.inputs.days ?? 28} />
      </label>
      <details>
        <summary>Dane rodziny i stawki</summary>
        <div className={s.fields}>
          <label>
            Pierwszy rodzic
            <input name="firstName" required maxLength={90} defaultValue={view?.firstName ?? "Marta Lis"} />
          </label>
          <label>
            Drugi rodzic
            <input name="secondName" required maxLength={90} defaultValue={view?.secondName ?? "Paweł Lis"} />
          </label>
          <label>
            Dziecko
            <input name="childName" required maxLength={90} defaultValue={view?.childName ?? "Ola Lis"} />
          </label>
          <label>
            Stawka pierwszego rodzica (zł brutto/dzień)
            <input
              name="first"
              type="number"
              min={0}
              max={100000}
              step=".01"
              defaultValue={view ? (view.inputs.firstDaily ?? "") : 140}
            />
          </label>
          <label>
            Stawka drugiego rodzica (zł brutto/dzień)
            <input
              name="second"
              type="number"
              min={0}
              max={100000}
              step=".01"
              defaultValue={view ? (view.inputs.secondDaily ?? "") : 105}
            />
          </label>
        </div>
      </details>
      <button disabled={!loaded || busy} type="submit">
        Porównaj warianty
      </button>
    </form>
  );
}

function Comparison({ view }: { view: MartaView }) {
  const { together, sequential } = view.variants;
  const rows = [
    ["Pierwszy rodzic", period(together.first), period(sequential.first)],
    ["Drugi rodzic", period(together.second), period(sequential.second)],
    ["Dni z dzieckiem", together.calendarDays, sequential.calendarDays],
    ["Łącznie brutto", money(together.total), money(sequential.total)],
  ];
  return (
    <div className={s.comparison}>
      <table>
        <caption>Porównanie urlopów</caption>
        <thead>
          <tr>
            <th scope="col">Okres i kwota</th>
            <th scope="col">Razem</th>
            <th scope="col">Kolejno</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, a, b]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>{a}</td>
              <td>{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={s.comparisonNote}>
        Przy urlopach jeden po drugim opieka trwa o {sequential.calendarDays - together.calendarDays} dni dłużej.
      </p>
      <p className={s.comparisonNote}>
        {view.firstName} · {view.inputs.firstDaily === null ? "Brak stawki" :
          `${view.inputs.days} dni × ${money(view.inputs.firstDaily)} = ${money(together.first.amount)} brutto`}
        <br />
        {view.secondName} · {view.inputs.secondDaily === null ? "Brak stawki" :
          `${view.inputs.days} dni × ${money(view.inputs.secondDaily)} = ${money(together.second.amount)} brutto`}
      </p>
    </div>
  );
}

type AttachmentProps = { scope: string; attachment: File | null; onAttach: (file: File | null) => void };
function Declarations({
  state,
  onSaved,
  scope,
  attachment,
  onAttach,
}: { state: Case; onSaved: () => void } & AttachmentProps) {
  const { view, send, busy } = state;
  const [fileError, setFileError] = useState("");
  const [copy, setCopy] = useState(view?.employerHasCopy === null ? "" : view?.employerHasCopy ? "yes" : "no");
  if (!view?.selected) return null;
  const chosen = view.variants[view.selected];
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    let verified: File | null = null;
    if (copy === "no" && attachment) {
      try {
        verified = await checkedCopy(attachment);
      } catch {
        setFileError("Wybierz niepusty PDF, PNG lub JPEG do 25 MB.");
        return;
      }
    }
    const attachmentName = attachment?.name ?? view?.attachmentName;
    if (
      await send({
        type: "confirm",
        version: view?.version,
        employerHasCopy: copy === "yes",
        otherParentConfirmed: data.get("statement") === "on",
        previousDays: Number(data.get("previousDays")),
        previousParts: Number(data.get("previousParts")),
        attachmentName: copy === "no" ? attachmentName : null,
      })
    ) {
      if (verified && view) {
        try {
          await storeCopy(scope, view.version + 1, verified);
        } catch {
          /* Recovery is available in SavedAttachment. */
        }
      }
      onSaved();
    }
  }
  return (
    <form className={s.form} onSubmit={save}>
      <label className={s.check}>
        <input type="checkbox" name="statement" required defaultChecked={view.confirmed} />
        Potwierdzam okres urlopu drugiego rodzica ({view.secondName}) od {date(chosen.second.from)} do{" "}
        {date(chosen.second.to)}.
      </label>
      <label>
        Wykorzystane wcześniej dni rodzicielskiego
        <input type="number" name="previousDays" min={0} step="1" required defaultValue={view.previousDays ?? 0} />
      </label>
      <label>
        Wykorzystane wcześniej części
        <input type="number" name="previousParts" min={0} step="1" required defaultValue={view.previousParts ?? 0} />
      </label>
      <label>
        Czy pracodawca ma już odpis aktu urodzenia?
        <select required value={copy} onChange={(e) => setCopy(e.target.value)}>
          <option value="">Wybierz odpowiedź</option>
          <option value="yes">Tak, ma odpis w aktach</option>
          <option value="no">Nie, dołączę odpis</option>
        </select>
      </label>
      {copy === "no" && (
        <label>
          Kopia odpisu aktu urodzenia
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            name="attachment"
            required={!attachment && !view.attachmentName}
            onChange={async (event) => {
              const selected = event.target.files?.[0];
              onAttach(null);
              if(!selected) return;
              try { onAttach(await checkedCopy(selected)); setFileError(""); }
              catch { setFileError("Wybierz niepusty PDF, PNG lub JPEG do 25 MB."); }
            }}
          />
          <small>W szkicu zapiszemy nazwę pliku. Przy przekazaniu rzeczywistego wniosku dołącz ten odpis.</small>
          {attachment ? <AttachmentLinks file={attachment} /> : view.attachmentName && <span>{view.attachmentName}</span>}
        </label>
      )}
      {fileError && <p role="alert">{fileError}</p>}
      <button disabled={busy || (copy==="no" && !attachment && !view.attachmentName)} type="submit">
        Zatwierdź wniosek
      </button>
    </form>
  );
}

export function MartaInterview({ state, attachment, onAttach, scope, fullscreen }: { state: Case; fullscreen: boolean } & AttachmentProps) {
  const { view, busy, loaded, error, reload, send } = state;
  const [edit, setEdit] = useState(false);
  const [amend, setAmend] = useState(false);
  return (
    <section className={s.interview} aria-label="Przygotowanie wniosku">
      {(!view || edit) && <p>Od którego dnia chcecie zacząć urlop? Porównam wspólny start i urlopy jeden po drugim.</p>}
      {!loaded && !error && <p role="status">Wczytuję dane sprawy…</p>}
      {error && (
        <p role="alert" className={s.error}>
          {error}{" "}
          <button type="button" onClick={reload}>
            Wczytaj ponownie
          </button>
        </p>
      )}
      {loaded && (!view || edit) && (
        <ComparisonInputs state={state} key={view?.version ?? "new"} onSaved={() => setEdit(false)} />
      )}
      {view && (
        <>
          <p className={s.chosen}>
            Początek urlopu · <strong>{date(view.inputs.firstStart)}</strong>
          </p>
          {!edit && <Comparison view={view} />}
          {!view.submitted && !edit && (
            <button type="button" className={s.secondary} disabled={busy} onClick={() => setEdit(true)}>
              Popraw dane porównania
            </button>
          )}
          {(!view.selected || amend) && !edit && (
            <>
              <p>
                <strong>Który wariant wpisać do wniosku?</strong>
              </p>
              <div className={s.actions}>
                {(["together", "sequential"] as const).map((variant) => (
                  <button
                    key={variant}
                    disabled={busy}
                    onClick={async () => {
                      if (await send({ type: "choose", version: view.version, variant })) setAmend(false);
                    }}
                  >
                    Wybieram {labels[variant].toLowerCase()}
                  </button>
                ))}
              </div>
            </>
          )}
          {view.selected && (
            <>
              <p className={s.chosen}>
                Wybrany wariant · <strong>{labels[view.selected]}</strong>
              </p>
              {!view.submitted && !amend && !edit && (
                <button className={s.secondary} disabled={busy} onClick={() => setAmend(true)}>
                  Zmień wariant
                </button>
              )}
              {!view.confirmed && !amend && !edit && (
                <Declarations
                  key={view.version}
                  scope={scope}
                  attachment={attachment}
                  onAttach={onAttach}
                  state={state}
                  onSaved={() => setAmend(false)}
                />
              )}
              {view.confirmed && !edit && !amend && (
                <>
                  <p>
                    <strong>Wniosek zatwierdzony.</strong> Pobierz dokument i sprawdź dane.
                  </p>
                  {fullscreen && (
                    <a className={s.download} href="/api/zusik/marta/pdf" download="wniosek-rodzicielski.pdf">
                      Pobierz wniosek PDF
                    </a>
                  )}
                  {view.attachmentName && (
                    <SavedAttachment
                      key={[scope, view.attachmentName, view.version - (view.submitted ? 1 : 0)].join(":")}
                      view={view}
                      scope={scope}
                    />
                  )}
                  {view.submitted ? (
                    <p role="status">
                      Przekazano do Studia Lipa w symulacji
                      {view.submittedAt && ` · ${date(view.submittedAt.slice(0, 10))}`}.
                    </p>
                  ) : (
                    <button disabled={busy} onClick={() => void send({ type: "submit", version: view.version })}>
                      Przekaż pracodawcy w symulacji
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}

export type DeadlineSource = { label: string; text: string; url: string };
export function MartaDraft({
  view,
  phone,
  loaded,
  source,
}: {
  view: MartaView | null;
  phone: boolean;
  loaded: boolean;
  source?: DeadlineSource;
}) {
  const selected = view?.selected ? view.variants[view.selected] : null;
  const status = view?.submitted ? "Przekazano w symulacji" : view?.confirmed ? "Zatwierdzony" : "Szkic";
  return (
    <article className={s.sheet}>
      <p className={s.eyebrow}>Dokumenty i wnioski · Dane demonstracyjne</p>
      <h1>Wniosek o urlop rodzicielski</h1>
      <p>
        Do pracodawcy · Studio Lipa <span className={s.badge}>{status}</span>
      </p>
      {selected && !view?.submitted && (
        <div className={s.deadline}>
          <p>
            Złóż wniosek do <strong>{date(selected.first.deadline)}</strong>
          </p>
          <p>{view?.secondName} składa osobny wniosek u swojego pracodawcy do {date(selected.second.deadline)}.</p>
          {source && (
            <details>
              <summary>{source.label}</summary>
              <p>Początek urlopu · {date(selected.first.from)}</p>
              <blockquote>{source.text}</blockquote>
              <a href={source.url} target="_blank" rel="noreferrer">
                Otwórz przepis
              </a>
            </details>
          )}
        </div>
      )}
      {view?.submittedAt && (
        <p className={s.deadline}>
          Przekazano do Studia Lipa w symulacji · <strong>{date(view.submittedAt.slice(0, 10))}</strong>
        </p>
      )}
      {loaded && (phone ? (
        <details className={s.preview}>
          <summary>Podgląd wniosku PDF</summary>
          <MartaPdfPreview view={view} />
        </details>
      ) : (
        <div className={s.preview}><MartaPdfPreview view={view} /></div>
      ))}
    </article>
  );
}
