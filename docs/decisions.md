# Rozhodnutí — vědomé odchylky od zadání

Zadání ([Zadání_Hackathon_2026_shared.docx.md](../Zadání_Hackathon_2026_shared.docx.md)) je
autoritativní. Tenhle soubor drží místa, kde se tým **vědomě rozhodl jinak** — aby se
nemusela pokaždé znovu otevírat a aby bylo při vyhodnocení vidět, že nejde o opomenutí.

Co sem patří: rozhodnutí, které je v rozporu s tím, co zadání říká, nebo které zadání
neřeší a mohlo by se zdát jako chyba. Co sem nepatří: běžná implementační volba.

Formát: `## YYYY-MM-DD — rozhodnutí`, pak **Zadání říká** / **Rozhodli jsme** /
**Proč** / **Důsledek**.

---

## 2026-08-16 — Den 1 je den dokončení onboardingu

**Zadání říká:** Den 1 = první *celý* kalendářní den po onboardingu
(`intervention_start_date`).

**Rozhodli jsme:** Den 1 je kalendářní den, kdy uživatel dokončí onboarding.

**Proč:** Původní pravidlo nechávalo mrtvý den. Kdo dokončil nastavení v neděli, uviděl
v pondělí „Den 1" — ale s ničím k udělání, protože check-in za pondělí přichází až
v úterý. První věc, kterou šlo reálně zaznamenat, byla dva dny po instalaci. Teď přijde
první check-in hned druhý den ráno.

**Důsledek:** Den 1 je **částečný den**. Kdo dokončí onboarding ve 22:00, dostane druhý
den otázku na „včerejšek", který z velké části proběhl ještě před instalací aplikace —
data za den 1 tedy nejsou plně „pod intervencí". Slovo *celý* v zadání na tohle nejspíš
mířilo; při vyhodnocení dat je dobré s tím počítat.

Kód: `completeOnboarding` (`src/domain/onboarding.ts`), zrcadleno v
`OnboardingServiceImpl.complete`. Časová zóna se řídí lokálním datem okamžiku, ne UTC —
jinak by onboarding pozdě večer začal o den dřív.

---

## 2026-08-16 — CSV export jsou surové tabulky, ne person-day

**Zadání říká:** Příloha 2 — export na úrovni osoba-den: jeden řádek na každý plánovaný
den 1–28 včetně dnů bez hraní a chybějících dnů, u chybějícího dne hodnoty prázdné/NA.

**Rozhodli jsme:** ZIP se čtyřmi surovými tabulkami — `profile`, `check_in`, `limit`,
`coping_strategy` — každá tak, jak je uložená. Žádné odvozené řádky. („As raw as it
gets.")

**Proč:** Týmová dohoda, zaznamenaná i v README § „Exporting data from app". Surová data
jsou pro další zpracování univerzálnější než jeden předpočítaný pohled.

**Důsledek:** Den bez check-inu **nemá řádek vůbec** — místo řádku s prázdnými hodnotami.
Chybí také odvozené sloupce `study_day` a `checkin_status`. Kdo bude export porovnávat
s Přílohou 2, ten rozdíl uvidí.

**Jedna výjimka, dodaná později:** `is_backfill` v tabulce `check_in` je odvozený sloupec
(počítá se při exportu přes `isBackfill` — odesláno víc než kalendářní den po dni, kterého
se záznam týká). Bez něj by v surovém výpisu nešlo poznat, co uživatel doplňoval zpětně,
což je pro vyhodnocení podstatné. „As raw as it gets" tím zůstává v platnosti jako pravidlo
pro tvar exportu, ne jako zákaz jediného dopočítaného příznaku.

**Co tím ale nepadá:** den bez hraní je pořád **skutečný záznam s nulami**
(`played=false`, `time_min=0`, …), zatímco chybějící den prostě řádek nemá. Tyhle dvě
věci se nesmí splést — dopočítat chybějící dny nulami by zkreslilo data.

Kód: `buildExportBundle` (`src/domain/export.ts`), `exportMapper.ts`, `exportServiceImpl.ts`.

---

## 2026-08-25 — Týdenní review nejdřív vyzve doplnit poslední den týdne

**Zadání říká:** Review se otevře po dnech 7/14/21 i s chybějícími check-iny; má být
dokončitelné, i když check-iny chybí (uloží se jako `incomplete`). Původně jsme to tak
i měli — review se otevřelo hned na začátku nového týdne, i když check-in za poslední den
předchozího týdne ještě chyběl.

**Rozhodli jsme:** V překryvový den (den 8/15/22) přijde nový týdenní limit až **po**
doplnění posledního dne uzavíraného týdne (den 7/14/21), pokud je ten den ještě
doplnitelný. Review flow na ten check-in nejdřív přesměruje a formulář limitů ukáže
teprve potom. Blokuje **jen poslední den** týdne; dřívější díry v týdnu neblokují.

**Proč:** Poslední den týdne je „včerejšek" přesně ve chvíli, kdy se review otevře, takže
jeho check-in je běžně splatný ve stejný okamžik. Původní chování otevřelo review jako
tvrdý redirect (nový týden nemá dashboard, dokud review nenastaví limit) — uživatel byl
nucen review dokončit, čímž se týden uzavřel (`isWeekClosed`) a poslední den se zamknul
(`locked_week`) dřív, než ho stihl vyplnit. Ztráta dat za den, který šlo ještě doplnit.
Nahlásil to uživatel jako bug: „nemůžeme přece uzavřít týden, dokud nemáme vše vyplněno".

**Důsledek:** `getPendingReview` vystavuje `blockingCheckInDay` (poslední den týdne, když
je nevyplněný a stále v 5denním okně, jinak `null`). `WeekReviewFlow` na něj přesměruje na
check-in; po vyplnění se vrátí přes dashboard zpět a ukáže limity. Jakmile den vyplní
nebo vypadne z okna, přestane blokovat — pak se review dokončí jako `incomplete`, takže
„dokončitelné s chybějícími check-iny" ze zadání platí pro dny, které už doplnit nejdou
(NA). Dřívější díry v okně se při uzavření pořád zamknou — vědomě: gate cílí jen na den
7/14/21, aby demo přes stroj času (skok na den 8 s prázdným týdnem) nevynutilo pět
doplnění po sobě.

Kód: `getPendingReview` (`src/domain/review.ts`), DTO `ReviewResponse`
(`src/app/dto/review.ts`), `WeekReviewFlow` (`src/ui/review/WeekReviewFlow.tsx`). Guard
`canEditCheckIn` (`src/domain/guards.ts`) zůstal beze změny — backfill okno i `locked_week`
platí dál.

---

## 2026-10-24 — Review 4. týdne jen uzavírá týden, bez limitů

**Zadání říká:** Review s nastavením limitů je po dnech 7, 14 a 21. Po dni 28 se během
dne 29 zpřístupní závěrečný souhrn **bez nastavování limitů**. Tabulka `review`
má `review_week_no` 1..4 a „uzavírá příslušný týden".

**Bug:** 4. týden šel uzavřít jen přes stejný formulář „Nové limity na další týden" jako
týdny 1–3 — jenže 5. týden neexistuje. Navíc se na ten formulář v den 29+ nedalo
normálně dostat (dashboard týden 4 limit má, takže gate na chybějící limit nespustí),
takže týden 4 zůstal navždy otevřený a notifikace `review_due` chodila dál
(„Nastavte limity pro týden 4"). Text notifikace byl navíc o jedna mimo i pro týdny 1–3
(uváděl uzavíraný týden místo následujícího).

**Rozhodli jsme:** Review 4. týdne zůstává (zapíše řádek `review` pro týden 4,
`limit_changed=false`), ale **bez limitů**: `getPendingReview` vrací `isFinalWeek`,
`completeReview` pro týden 4 nebere `nextLimits` (pro 1–3 jsou povinné,
`REVIEW_NEXT_LIMITS_REQUIRED`). `WeekReviewFlow` pro týden 4 ukáže uzavírací obrazovku
a po potvrzení otevře závěrečný souhrn. Blokující den 28 (backfill) platí stejně jako u
dnů 7/14/21. `DashboardFlow` od dne 29 na otevřené review týdne 4 přesměruje. Notifikace
pro týden 4 má vlastní text; pro 1–3 uvádí číslo následujícího týdne.

Kód: `completeReview` / `getPendingReview` (`src/domain/review.ts`),
`WeekReviewFlow` / `WeekReviewScreen` (`src/ui/review/`), `DashboardFlow`
(`src/ui/dashboard/DashboardFlow.tsx`), `useReminderNotifications.ts`.
