# Knihovna strategií — předání pro backend

:::Stav: Z velké části HOTOVO — zbývá jen skrývání strategií

Aktualizace: katalog, kontakty i perzistentní uživatelský stav jsou napojené
(`CopingStrategyService`, `ContactService`, Dexie adaptéry). Z tohoto zadání
zbývá **skrývání strategií**: obrazovka ho umí zobrazit, ale `CopingFlow`
plní `hiddenStrategies` prázdnou konstantou a `onHideStrategy` nepředává.
Zbytek dokumentu ponechán jako popis očekávaného chování.

## Cíl

Napojit hotovou frontendovou vrstvu Knihovny strategií na skutečný katalog,
kontakty a lokálně perzistentní uživatelský stav. Po obnovení PWA musí uživatel
vidět stejné vlastní, vybrané a skryté strategie jako před zavřením aplikace.

Toto zadání popisuje očekávané chování a integrační potřeby. Záměrně
nepředepisuje databázové tabulky, schéma, migrace, repository API ani to, zda má
být katalog přibalený k aplikaci, seedovaný do lokálního úložiště nebo získaný
jiným způsobem. Za návrh datové vrstvy odpovídá backendový tým.

## Výchozí stav

- Frontendové komponenty jsou v `src/ui/coping` a mají komponentové testy.
- `StrategySection` přijímá katalogové detaily, kontakty a rozdělené seznamy
  strategií přes props.
- Uživatelské akce předává nadřazené vrstvě pomocí callbacků.
- Současný `CopingStrategyEntity` nepokrývá celý požadovaný stav knihovny ani
  strukturovaný katalogový detail.
- Současné katalogové návrhy v `src/data/seeds/copingDefaults.ts` slouží
  stávajícímu onboardingu a nejsou kompletním zdrojem pro novou knihovnu.
- `App` po této větvi nadále standardně otevírá existující onboarding. Neobsahuje
  preview katalog ani dočasný in-memory store.

## Co frontend potřebuje načíst

### Katalog strategií

Pro každou publikovanou katalogovou strategii potřebuje frontend:

- stabilní identifikátor,
- pevné pořadí,
- název a souhrn pro kartu,
- obsah detailu „Co udělat“, „Proč to může pomoci“, „Jak na to“ a „Kdy se může
  hodit“,
- volitelnou realistickou poznámku nebo dostupnou alternativu,
- volitelné oficiální odkazy pro relevantní strategii.

Konkrétní aktuální texty a vizuální pořadí určuje Figma. `content.md` je pomocný
obsahový podklad; při rozporu má přednost Figma.

### Aktuální stav knihovny

Při otevření knihovny musí být možné načíst:

- které katalogové strategie jsou ve Vybraných,
- které katalogové strategie jsou skryté,
- všechny vlastní strategie včetně názvu, volitelného pole „Kdy ji chci použít?“
  a volitelného pole „Jak začnu?“,
- stav Vybrané a Skryté každé vlastní strategie,
- údaj umožňující řadit vlastní strategie od nejnovější.

Stavy Vybrané a Skryté jsou nezávislé. Skrytí nesmí zrušit výběr a obnovená
strategie se musí vrátit do původní sekce.

### Kontakty

Frontend potřebuje seznam kontaktů s názvem, účelem a dostupnými kontaktními
údaji nebo odkazy v pořadí schváleném obsahem/Figmou.

## Operace, které musí datová vrstva obsloužit

- načíst knihovnu a kontakty,
- přidat nebo odebrat katalogovou i vlastní strategii z Vybraných,
- skrýt a obnovit katalogovou i vlastní strategii,
- vytvořit vlastní strategii,
- upravit tři povolená pole vlastní strategie,
- trvale smazat vlastní strategii,
- vrátit srozumitelnou chybu při neúspěšném načtení nebo uložení.

Katalogovou strategii nelze upravit ani smazat. Frontend už potvrzuje smazání
vlastní strategie, ale datová vrstva musí odmítnout neplatnou operaci bez ohledu
na klientské rozhraní.

## Funkční pravidla, která musí zůstat zachována

- Nejvýše pět vlastních strategií; do limitu se počítají i skryté a nevybrané.
- Nová vlastní strategie se automaticky zařadí do Vybraných.
- Duplicitní název katalogové nebo vlastní strategie není povolen; porovnání
  ignoruje velikost písmen a mezery před a za názvem.
- Název vlastní strategie je povinný a má nejvýše 80 znaků.
- Volitelná pole mají každé nejvýše 240 znaků.
- Vlastní strategie se řadí od nejnovější, katalogové v pevném katalogovém
  pořadí; ruční řazení není podporované.
- Změny zůstávají po reloadu PWA zachované.

## Očekávané napojení frontendu

Backendový tým může navrhnout vhodné service/repository rozhraní. Na integrační
hranici ale frontend potřebuje:

1. jeden načtený stav, ze kterého lze sestavit Vybrané, Další a Skryté,
2. úplné katalogové detaily a kontakty,
3. asynchronní operace pro všechny změny uvedené výše,
4. rozlišení stavu načítání a chyby,
5. možnost po úspěšné mutaci zobrazit aktuální uložený stav.

Před finálním napojením je možné upravit současné props/callbacky
`StrategySection`, pokud backendový návrh nabídne čistší aplikační rozhraní.
Vizuální komponenty a jejich produktové chování se tím nemají měnit.

## Akceptační kritéria backendového předání

- Knihovna se sestaví bez hardcoded preview dat v `App.tsx`.
- Všech šest katalogových strategií má kartu i úplný detail z aktuálního zdroje
  obsahu.
- Všechny podporované mutace přežijí reload aplikace.
- Výběr a skrytí zůstanou nezávislé také po reloadu.
- Vytvoření, úprava a smazání vlastní strategie se projeví v uloženém stavu.
- Limit, délky polí a unikátnost názvu jsou chráněné i mimo klientskou validaci.
- Chyba načtení nebo uložení je rozlišitelná a frontend na ni může reagovat bez
  ztráty rozepsaného formuláře.
- Existují testy datové vrstvy a alespoň jeden integrační test toku načtení →
  změna → reload → opětovné načtení.

## Rozhodnutí ponechaná backendovému týmu

- výsledný datový model a vztah k současnému `coping_strategy`,
- způsob distribuce a případného verzování katalogového obsahu,
- použitá lokální nebo vzdálená persistence,
- migrace existujících dat,
- hranice repository/service vrstvy a transakční chování,
- strategie optimistic/pessimistic aktualizací po dohodě s frontendem.
