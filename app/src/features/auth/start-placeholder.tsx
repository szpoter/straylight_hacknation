"use client";

import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { DEMO_PROFILE, endDemoSession, useDemoSession } from "./demo-session";
import { AUTH_PATHS } from "./flow";
import styles from "./auth.module.css";

// Ekran zastępczy po zalogowaniu. Docelowo tu zaczyna się onboarding z SPEC-PO-LOGOWANIU.md
// (zakres Macieja). Pokazuje, że logowanie demo się udało i jakie dane „wczytaliśmy”.

const NBSP = " ";

export function StartHeaderAside() {
  const router = useRouter();
  const session = useDemoSession();
  if (!session) return null;

  const restart = () => {
    endDemoSession();
    router.push("/");
  };

  return (
    <>
      <span className={styles.who}>
        <span className={styles.whoName}>
          {DEMO_PROFILE.firstName} {DEMO_PROFILE.lastName}
        </span>
        <span className={styles.whoTag}>profil demo</span>
      </span>
      <Button variant="ghost" size="sm" onClick={restart}>
        Zacznij demo od nowa
      </Button>
    </>
  );
}

export function StartPlaceholder() {
  const session = useDemoSession();

  // Pierwszy render (serwer i hydracja) nie zna jeszcze sesji z sessionStorage.
  if (session === undefined) return <div className={styles.startPending} aria-busy="true" />;

  if (session === null) {
    return (
      <div className={styles.start}>
        <h1 className={styles.startTitle}>Ta część przewodnika wymaga logowania</h1>
        <p className={styles.startLead}>
          Zaloguj się w{NBSP}wersji demonstracyjnej. Skorzystasz z{NBSP}fikcyjnego profilu, bez prawdziwych danych.
        </p>
        <div className={styles.actions}>
          <ButtonLink href={AUTH_PATHS.login}>Zaloguj się</ButtonLink>
          <ButtonLink href="/" variant="secondary">
            Wróć na stronę główną
          </ButtonLink>
        </div>
      </div>
    );
  }

  const loadedAt = new Date(session.loggedInAt).toLocaleString("pl-PL", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={styles.start}>
      <p className={styles.service}>
        <span className={styles.serviceDot} aria-hidden="true" />
        Zalogowano przez mObywatel
        <span className={styles.serviceDemo}>· symulacja</span>
      </p>
      <h1 className={styles.startTitle}>Zaraz będzie reszta.</h1>
      <p className={styles.startLead}>
        Logowanie się udało. Jesteś w{NBSP}przewodniku jako {DEMO_PROFILE.firstName} {DEMO_PROFILE.lastName},
        fikcyjny profil demonstracyjny. Kolejne ekrany, od pierwszego pytania po plan dziecka, właśnie powstają.
      </p>

      <section className={styles.dataCard} aria-labelledby="dane-zus">
        <div className={styles.dataHead}>
          <h2 id="dane-zus" className={styles.dataTitle}>
            Dane z{NBSP}ZUS
          </h2>
          <span className={styles.badge}>Przykład</span>
        </div>
        {session.data === "manual" ? (
          <p className={styles.dataEmpty}>
            Wybrano „Wpisz dane samodzielnie”. Formularz do uzupełnienia danych pojawi się w{NBSP}tym miejscu.
          </p>
        ) : session.data === "pending" ? (
          <p className={styles.dataEmpty}>Danych jeszcze nie wczytano.</p>
        ) : (
          <>
            <dl className={styles.dataList}>
              {DEMO_PROFILE.insurance.map((row) => (
                <div key={row.label} className={styles.dataRow}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
            <p className={styles.dataSource}>ZUS · symulacja, pobrano {loadedAt}</p>
          </>
        )}
      </section>

      <div className={styles.actions}>
        <ButtonLink href="/" variant="secondary">
          Wróć na stronę główną
        </ButtonLink>
      </div>
    </div>
  );
}
