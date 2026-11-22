"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { routeCaseQuestion } from "@/lib/zusik/v1/intent";
import { chatStarters } from "@/lib/zusik/conversation";
import type { CaseFile, EvidenceFact, FactInput, Patch } from "@/lib/zusik/memory/contract";
import { ApiError, caseApi, loadCase, type AssessmentInput, type CaseView, type MessageInput } from "./case-api";
import { ChatHeader } from "./chat-panel";
import { findCasePassages } from "./find-case-passages";
import { clearCaseReadProgress } from "./case-read-progress";
import { Composer } from "./composer";
import { ChatStarters } from "./scenario-nav";
import { DecisionCard, DocumentReview, Evidence, FactForm, labels, valueLabel, type FactDraft, type LocalPdf } from "./case-review";
import { usePhone, useVisualViewport } from "./use-chat-viewport";
import s from "./zusik.module.css";

const id = () => crypto.randomUUID();
const messageLabel = (m: MessageInput) => m.intent === "public_question" ? m.publicQuestion : m.intent === "explain_result" ? "Skąd ten wynik?" : m.intent === "hypothetical" ? "Wariant symulacji" : m.intent === "read_context" ? "Dane w sprawie" : "Sprawdź moją sprawę";

export function ImportConversation() {
  const [view, setView] = useState<CaseView | null>(null);
  const active = useRef<CaseFile | null>(null);
  const createKey = useRef("");
  const [history, setHistory] = useState<CaseFile[]>([]);
  const [draft, setDraft] = useState("");
  const [inFlightQuestion, setInFlightQuestion] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(true);
  const locked = useRef(true);
  const [retry, setRetry] = useState<(() => Promise<void>) | null>(null);
  const [local, setLocal] = useState(new Map<string, LocalPdf>());
  const urls = useRef(new Set<string>());
  const [originals, setOriginals] = useState(new Map<string, string>());
  const [form, setForm] = useState<FactDraft | "new" | null>(null);
  const [benefit, setBenefit] = useState("maternity");
  const [asOf, setAsOf] = useState("");
  const [subject, setSubject] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [progress, setProgress] = useState("");
  const [reading, setReading] = useState(false);
  const readController = useRef<AbortController | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [lastChange, setLastChange] = useState("");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const thread = useRef<HTMLDivElement>(null);
  const sticky = useRef(true);
  const lifecycle = useRef<AbortController | null>(null);
  const phone = usePhone();
  const viewport = useVisualViewport();

  const restore = useCallback(async () => {
    await caseApi.open();
    const cases = await caseApi.cases();
    const params = new URLSearchParams(location.search);
    const requested = params.get("sprawa") ?? (!params.has("nowa") ? sessionStorage.getItem("zusik.activeCase") : null);
    const file = cases.find(c => c.id === requested);
    const restored = file ? await loadCase(file.id) : null;
    active.current = restored?.file ?? null;
    setView(restored);
    setHistory(cases);
    if (requested && !file) {
      sessionStorage.removeItem("zusik.activeCase");
      setNotice("Ta sprawa jest niedostępna w bieżącej sesji.");
    }
  }, []);
  const run = useCallback(async (work: () => Promise<void>) => {
    if (locked.current) return;
    locked.current = true;
    setBusy(true); setNotice(""); setRetry(null);
    try { await work(); }
    catch (error) {
      if (lifecycle.current?.signal.aborted) return;
      if (error instanceof ApiError && [401, 404].includes(error.status)) {
        setView(null); active.current = null; setLocal(new Map()); setOriginals(new Map()); setForm(null); setHistory([]); setPendingFile(null); setDraft(""); setLastChange(""); setProgress(""); createKey.current = "";
        urls.current.forEach(url => URL.revokeObjectURL(url)); urls.current.clear();
        sessionStorage.removeItem("zusik.activeCase");
        setNotice("Ta sprawa jest niedostępna. Wznów sesję."); setRetry(() => restore);
      } else if (error instanceof ApiError && [409, 412].includes(error.status)) {
        setForm(null);
        setNotice("Dane zmieniły się w innej karcie. Sprawdź aktualną wartość przed zatwierdzeniem.");
        if (active.current) {
          try { setView(await loadCase(active.current.id)); } catch { setRetry(() => restore); }
        }
      } else {
        setRetry(() => work);
        setNotice(error instanceof ApiError && error.status === 422 ? "Sprawdź dane. Serwer nie przyjął tej zmiany." : "Nie udało się zakończyć operacji. Możesz ponowić próbę.");
      }
    } finally { locked.current = false; setBusy(false); setInFlightQuestion(""); }
  }, [restore]);
  useEffect(() => {
    const controller = new AbortController();
    lifecycle.current = controller;
    // The browser may replay mount effects. Start the session once after mount settles.
    const timer = window.setTimeout(() => { locked.current = false; void run(restore); }, 0);
    const handles = urls.current;
    return () => { clearTimeout(timer); controller.abort(); handles.forEach(url => URL.revokeObjectURL(url)); handles.clear(); };
  }, [run, restore]);
  useEffect(() => {
    if (thread.current && sticky.current) thread.current.scrollTop = thread.current.scrollHeight;
  }, [view, busy, form, local]);
  useEffect(() => {
    if (!view?.messages.some(m => m.state === "processing") || busy) return;
    const timer = window.setTimeout(() => void run(async () => { setView(await loadCase(view.file.id)); }), 1500);
    return () => clearTimeout(timer);
  }, [view, busy, run]);

  async function current() {
    if (active.current) return active.current;
    createKey.current ||= id();
    const file = await caseApi.create(createKey.current);
    active.current = file;
    const url = new URL(location.href);
    url.searchParams.delete("nowa"); url.searchParams.set("sprawa", file.id);
    window.history.replaceState(null, "", url);
    sessionStorage.setItem("zusik.activeCase", file.id);
    setHistory(items => [file, ...items.filter(item => item.id !== file.id)]);
    return file;
  }
  function send(text: string) {
    const question = text.trim();
    if (!question || locked.current) return;
    const routed = routeCaseQuestion(question, {
      facts: view?.facts ?? [], subjectId: subject || undefined, lastMessage: view?.messages.at(-1),
      assessmentId: view?.assessments.at(-1)?.id, hasDocuments: Boolean(view?.documents.length),
    });
    if ("clarify" in routed) { setNotice(routed.clarify); return; }
    if ("correction" in routed) { setNotice("Wybierz „Popraw” przy polu i okresie, którego dotyczy zmiana."); return; }
    const input = routed.input;
    const key = id();
    sticky.current = true;
    setDraft(question);
    void run(async () => {
      setInFlightQuestion(question);
      const file = await current();
      const result = await caseApi.message(file.id, input, key);
      setOriginals(prev => new Map(prev).set(result.data.id, question));
      setView(await loadCase(file.id));
      setDraft(prev => prev.trim() === question ? "" : prev);
    });
  }
  function attach(selected: File, fresh = false) {
    if (locked.current) return;
    if (selected.type && selected.type !== "application/pdf") { setNotice("Wybierz dokument PDF."); return; }
    const startKey = id(), docKey = id(), messageKey = id();
    const question = draft.trim();
    let file: CaseFile | null = null;
    let opened: LocalPdf | null = null;
    let existing: boolean | undefined;
    void run(async () => {
      if (fresh && !file) {
        file = await caseApi.create(startKey);
        active.current = file; sessionStorage.setItem("zusik.activeCase", file.id);
        window.history.replaceState(null, "", "?sprawa=" + encodeURIComponent(file.id));
        setView(null); setForm(null); setLastChange(""); setOriginals(new Map()); setLocal(new Map());
        urls.current.forEach(url => URL.revokeObjectURL(url)); urls.current.clear();
        setSubject(""); setAsOf(""); const created = file; setHistory(items => [created, ...items]);
      }
      file ??= await current();
      if (!opened) {
        const { readCaseDocument } = await import("./read-case-pdf");
        const readAbort = new AbortController();
        readController.current = readAbort; setReading(true);
        try {
          const signal = lifecycle.current?.signal;
          if (!signal || signal.aborted) return;
          const read = await readCaseDocument(selected, { caseId: file.id, signal: AbortSignal.any([signal, readAbort.signal]), onProgress: setProgress });
          const url = URL.createObjectURL(selected.slice(0, selected.size, "application/pdf")); urls.current.add(url);
          opened = { url, name: selected.name, read };
        } catch {
          if (readAbort.signal.aborted) {
            await clearCaseReadProgress(file.id).catch(() => undefined);
            setProgress(""); setPendingFile(null); setNotice("Anulowano odczyt pliku."); return;
          }
          setProgress("Nie udało się odczytać PDF. Wybierz czytelny plik do 20 MB, bez hasła."); setPendingFile(null); return;
        } finally { readController.current = null; setReading(false); }
      }
      const pdf = opened;
      const metadata = pdf.read.metadata;
      const replaced = local.get(metadata.clientDocumentId);
      if (replaced && replaced.url !== pdf.url) { URL.revokeObjectURL(replaced.url); urls.current.delete(replaced.url); }
      setLocal(prev => new Map(prev).set(metadata.clientDocumentId, pdf));
      existing ??= (await caseApi.documents(file.id)).some(d => d.metadata.clientDocumentId === metadata.clientDocumentId);
      if (!existing) await caseApi.register(file.id, metadata, docKey);
      // Reattaching an existing file for evidence must not append another turn.
      if (!existing || question) {
        const result = await caseApi.message(file.id, { intent: "ask_case" }, messageKey);
        if (question) setOriginals(prev => new Map(prev).set(result.data.id, question));
      }
      setView(await loadCase(file.id)); setProgress(""); setPendingFile(null);
      if (question) setDraft(prev => prev.trim() === question ? "" : prev);
    });
  }
  function erase() {
    const caseEtag = view?.caseEtag;
    if (!view || !caseEtag) return;
    void run(async () => {
      await caseApi.erase(view.file.id, caseEtag);
      await clearCaseReadProgress(view.file.id).catch(() => undefined);
      sessionStorage.removeItem("zusik.activeCase");
      location.replace("?nowa=1");
    });
  }
  function pick(selected: File) {
    if (view?.documents.length) setPendingFile(selected); else attach(selected);
  }
  function change(patch: Patch, summary: string) {
    if (!view?.etag) { setNotice("Odśwież sprawę przed zapisem."); return; }
    const { file, etag } = view;
    const key = id();
    void run(async () => {
      const changed = await caseApi.patch(file.profileId, patch, etag, key);
      setForm(null);
      const previous = view.assessments.at(-1);
      if (previous) {
        const assessed = await caseApi.assess(file.id, { ...previous.input, caseRevision: view.file.revision, profileRevision: changed.data.revision }, key);
        await caseApi.message(file.id, { intent: "explain_result", assessmentId: assessed.data.id }, key);
      }
      setLastChange(summary + " · wersja " + view.profile.revision + " → " + changed.data.revision);
      setView(await loadCase(file.id));
    });
  }
  function save(fact: FactInput, previous?: EvidenceFact) {
    if (!view) return;
    const changes: Patch["changes"] = [];
    if (!view.profile.subjects.includes(fact.subjectId)) changes.push({ action: "add_subject", role: fact.subjectId.startsWith("child") ? "child" : "parent", subjectId: fact.subjectId });
    changes.push(previous ? { action: "correct_fact", previousFactId: previous.factId, fact } : { action: "add_fact", fact });
    change({ changes }, labels[fact.field] + " · " + (previous ? valueLabel(previous.fact.value) + " → " : "") + valueLabel(fact.value));
  }
  function confirmDocument(facts: FactInput[], day: string) {
    if (!view?.etag || !facts.length) return;
    const { file, etag, profile } = view;
    const subjectId = facts[0].subjectId;
    const changes: Patch["changes"] = facts.map(fact => ({ action: "add_fact", fact }));
    const keys = changes.filter((_, index) => index % 25 === 0).map(() => id());
    const subjectKey = id(), messageKey = id();
    void run(async () => {
      let validator: string | null = etag;
      if (!profile.subjects.includes(subjectId)) {
        const added = await caseApi.patch(file.profileId, { changes: [{ action: "add_subject", subjectId, role: subjectId.startsWith("child") ? "child" : "parent" }] }, etag, subjectKey);
        validator = added.etag;
      }
      for (let i = 0; i < changes.length; i += 25) {
        if (!validator) throw new Error("Brak wersji profilu.");
        const patched = await caseApi.patch(file.profileId, { changes: changes.slice(i, i + 25) }, validator, keys[i / 25]);
        validator = patched.etag;
      }
      await caseApi.message(file.id, { intent: "ask_case", subjectId, validAt: day }, messageKey);
      setView(await loadCase(file.id)); setSubject(subjectId); setAsOf(day); setLastChange("Potwierdzone pola: " + facts.length);
    });
  }
  function assess() {
    if (!view || !asOf || !subject) return;
    const key = id();
    const input: AssessmentInput = { asOf, subjectId: subject, benefit, caseRevision: view.file.revision, profileRevision: view.profile.revision };
    void run(async () => {
      const { data } = await caseApi.assess(view.file.id, input, key);
      await caseApi.message(view.file.id, { intent: "explain_result", assessmentId: data.id }, key);
      setView(await loadCase(view.file.id));
    });
  }
  return <main className={s.root} data-zusik-workspace style={phone && viewport ? { height: viewport.height } : undefined}
    onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (!busy && f) pick(f); }}>
    <section className={s.chat + " " + s.caseWindow} aria-label="Czat z Zusikiem">
      <ChatHeader label="Rozmowa ogólna" scenario="ogolna" />
      <details className={s.caseHistory}><summary>Historia rozmów</summary>
        <a href="?nowa=1">Nowa rozmowa</a>
        {history.map(c => <a key={c.id} href={"?sprawa=" + encodeURIComponent(c.id)}>Sprawa z {new Date(c.createdAt).toLocaleString("pl-PL")} · {c.id.slice(-6)}</a>)}
        <a href="?historia=1">Wcześniejsze rozmowy</a>
        {view && (deleting ? <div><p>Usunąć tę sprawę wraz z jej wiadomościami, ocenami i dokumentami?</p>
          <button disabled={busy} onClick={erase}>Tak, usuń sprawę</button> <button onClick={() => setDeleting(false)}>Anuluj</button></div>
          : <button disabled={busy} onClick={() => setDeleting(true)}>Usuń tę sprawę</button>)}</details>
      <div ref={thread} className={s.thread} onScroll={e => { const el = e.currentTarget; sticky.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40; }}>
        <div className={s.threadInner}><div className={s.messages} role="log" aria-label="Przebieg rozmowy">
          <p>O jakie świadczenie albo dokument chcesz zapytać?</p>
          {view?.messages.map(m => <div className={s.messages} key={m.id} data-knowledge-turn>
            <div className={s.userRow}><p className={s.userBubble}>{originals.get(m.id) ?? messageLabel(m.input)}</p></div>
            <div className={s.aiMessage}>{(m.profileRevision < view.profile.revision || m.caseRevision < view.file.revision) && m.input.intent !== "public_question" && <small>Wcześniejsza odpowiedź · wersja profilu {m.profileRevision}</small>}
              <p>{m.state === "processing" ? "Przygotowuję odpowiedź…" : m.state === "failed" ? "Nie udało się przygotować odpowiedzi." : m.answer}</p>
              {m.input.intent === "ask_case" && originals.has(m.id) && Array.from(local.entries()).flatMap(([key, pdf]) =>
                findCasePassages(pdf.read.pages.map(p => p.text), originals.get(m.id) ?? "").map(hit =>
                  <details className={s.source} key={key + hit.page}><summary>Zapis w PDF · strona {hit.page}</summary><blockquote>{hit.excerpt}</blockquote>
                    <a href={pdf.url + "#page=" + hit.page} target="_blank" rel="noreferrer">Otwórz wskazaną stronę</a></details>))}
              <Evidence citations={m.citations} documents={view.documents} local={local} />
              {m.input.intent === "public_question" && m.input.publicQuestion === chatStarters[1].prompt && <a href="/app/kalkulator" target="_blank" rel="noreferrer">Otwórz kalkulator dla swojej sprawy</a>}
            </div></div>)}
          {inFlightQuestion && <div className={s.userRow}><p className={s.userBubble}>{inFlightQuestion}</p></div>}
          {view && <fieldset disabled={busy || !!retry} className={s.caseActions}>
            {view.documents.map(doc => {
              const pdf = local.get(doc.metadata.clientDocumentId);
              return <section key={doc.id} className={s.aiMessage}><strong>{pdf?.name ?? "Dokument sprawy"}</strong>
                <p>Liczba stron: {doc.metadata.pages}.</p>
                {pdf ? <><a href={pdf.url} target="_blank" rel="noreferrer">Otwórz własny PDF</a>
                  {pdf.read.pages.map(page => <details key={page.page} className={s.source}><summary>Strona {page.page}{page.status === "excluded" ? " · poza obliczeniem" : page.status === "manual" ? " · sprawdź ręcznie" : ""}</summary>
                    <p className={s.sourceQuote}>{page.text || "Sprawdź obraz strony w oryginale."}</p><a href={pdf.url + "#page=" + page.page} target="_blank" rel="noreferrer">Otwórz stronę {page.page} w PDF</a></details>)}
                  <DocumentReview pdf={pdf} document={doc} date={view.assessments.at(-1)?.input.asOf} onConfirm={confirmDocument} />
                  {pdf.read.pages.flatMap(page => page.candidates.map((c, i) =>
                    <button type="button" key={page.page + "-" + i} className={s.secondaryButton} onClick={() => setForm({ choice: { document: pdf.read, registered: doc, candidate: c }, fact: { subjectId: c.field === "birthDate" ? "child-A" : "person-A", field: c.field, value: c.value, validFrom: c.validFrom, asOf: c.asOf ?? (c.value.kind === "date" ? c.value.date : undefined), validTo: c.validTo,
                      source: { kind: "document", referenceId: doc.id, page: page.page } } })}>{labels[c.field]} · {valueLabel(c.value)} · sprawdź stronę {page.page}</button>))}
                </> : <p>Dołącz ponownie ten sam PDF, aby otworzyć wskazaną stronę.</p>}
              </section>;
            })}
            {view.facts.map(f => <div key={f.factId} className={s.aiMessage}><strong>{labels[f.fact.field]} · {valueLabel(f.fact.value)}</strong>
              <p>{f.fact.subjectId} · {f.fact.validFrom ?? f.fact.asOf}{f.fact.validTo && " – " + f.fact.validTo} · wersja {f.version}</p>
              <p>{f.verification === "disputed" ? "Sprzeczne dane" : f.verification === "withdrawn" ? "Wycofano" : f.fact.source.kind === "document" ? "Z dokumentu" : f.fact.source.kind === "simulated_zus" ? "Symulowane konto ZUS" : f.fact.source.kind === "workflow" ? "Z przebiegu sprawy" : "Deklaracja w rozmowie"}</p>
              {f.fact.source.kind === "document" && <Evidence citations={[{ kind: "document", ref: f.fact.source.referenceId, version: String(f.version), page: f.fact.source.page }]} documents={view.documents} local={local} />}
              <button className={s.secondaryButton} onClick={() => setForm({ fact: f.fact, previous: f })}>Popraw</button></div>)}
            {view.proposals.filter(p => p.status === "pending").map(p => <div key={p.id} className={s.aiMessage}>Proponowana wartość · {labels[p.fact.field]} · {valueLabel(p.fact.value)} · {p.fact.subjectId} · {p.fact.validFrom ?? p.fact.asOf}
              <button className={s.secondaryButton} onClick={() => change({ changes: [{ action: "accept_proposal", proposalId: p.id }] }, "Potwierdzono " + valueLabel(p.fact.value))}>Potwierdź propozycję</button></div>)}
            {lastChange && <p role="status">{lastChange}</p>}
            {form ? <FactForm key={form === "new" ? "new" : JSON.stringify(form)} draft={form === "new" ? undefined : form} save={save} cancel={() => setForm(null)} />
              : <button className={s.secondaryButton} onClick={() => setForm("new")}>Podaj fakt do sprawy</button>}
            {view.assessments.map((a, index) => <DecisionCard prior={view.assessments.slice(0, index)} key={a.id} assessment={a} historical={a.stale || a.input.profileRevision !== view.profile.revision || a.input.caseRevision !== view.file.revision} documents={view.documents} local={local} />)}
            {view.profile.subjects.length > 0 && <form className={s.reviewForm} onSubmit={e => { e.preventDefault(); assess(); }}>
              <label>Osoba do oceny<select required value={subject} onChange={e => setSubject(e.target.value)}><option value="">Wybierz osobę</option>{view.profile.subjects.map(v => <option key={v}>{v}</option>)}</select></label>
              <label>Świadczenie<select value={benefit} onChange={e => setBenefit(e.target.value)}><option value="maternity">Zasiłek macierzyński</option><option value="paternity">Za okres ojcowski</option><option value="sickness">Zasiłek chorobowy</option></select></label>
              <label>Dzień oceny<input required type="date" value={asOf} onChange={e => setAsOf(e.target.value)} /></label>
              <button className={s.secondaryButton}>Przelicz sprawę</button></form>}
          </fieldset>}
        </div></div></div>
      <div className={s.chatBottom}>
        {reading && <button className={s.secondaryButton} onClick={() => readController.current?.abort()}>Anuluj odczyt</button>}
        {!view && !progress && <ChatStarters disabled={busy || !!retry} onSelect={send} />}
        {retry && !busy && <button className={s.secondaryButton} onClick={() => void run(retry)}>Ponów próbę</button>}
        {retry && !busy && <button className={s.secondaryButton} onClick={() => { setRetry(null); setNotice(""); setProgress(""); }}>Wróć do edycji</button>}
        {pendingFile && !busy && <div className={s.row8}><button className={s.secondaryButton} onClick={() => attach(pendingFile)}>Uzupełnij tę sprawę</button>
          <button className={s.secondaryButton} onClick={() => attach(pendingFile, true)}>Rozpocznij osobną sprawę</button><button onClick={() => setPendingFile(null)}>Anuluj</button></div>}
        <Composer text={draft} textareaRef={textarea} onText={setDraft} onSend={() => send(draft)} busy={busy || !!retry} notice={notice || progress || null}
          fileControl={<><input ref={picker} type="file" hidden accept=".pdf,application/pdf" onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) pick(f); }} />
            <button className={s.secondaryButton} disabled={busy || !!retry} onClick={() => picker.current?.click()}>Dołącz PDF sprawy</button></>} />
      </div>
    </section>
  </main>;
}
