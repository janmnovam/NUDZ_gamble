# Knihovna strategií — předání pro backend

:::Stav: READY FOR BACKEND

## Cíl

Doplnit datovou vrstvu, která umožní zapnout zbývající hotové funkce Knihovny
strategií: úplný katalog a jeho detaily, nezávislé stavy Vybrané a Skryté a
plnou správu vlastních strategií. Po obnovení PWA musí uživatel vidět stejný
stav jako před zavřením aplikace.

Zadání popisuje očekávané chování a integrační potřeby. Návrh databázového
schématu, migrací a service/repository rozhraní je v odpovědnosti backendového
týmu.

## Současný stav na `main`

- `CopingFlow` je napojený na současný `CopingStrategyService`.
- `list` načítá uložené strategie, `create` vytvoří vlastní strategii s názvem a
  `toggle` mění současný stav `active`.
- `active: true` se ve frontendu zobrazuje jako Vybrané a `active: false` jako
  Další strategie.
- `getSuggestions` vrací šest katalogových návrhů s ID odvozeným ze stabilního
  katalogového `code`, názvem a jednořádkovým souhrnem.
- Katalogový souhrn se k uložené strategii dočasně přiřazuje pouze přes přesnou
  shodu názvu. Při neshodě se raději nezobrazí žádný souhrn.
- Záložka Kontakty je napojená přes read-only `ContactService` na existující
  lokální adresář.
- Detail, Skrýt/Obnovit, editace a smazání zůstávají ve flow vypnuté, přestože
  jejich frontendové komponenty a komponentové testy už existují.

Současný uložený záznam strategie obsahuje UUID, uživatele, název, typ,
`priority`, `active` a časová razítka. U katalogové strategie ale neuchovává
stabilní `code` původní katalogové položky. Samotné `list` navíc vrací pouze
uložené strategie, nikoliv celý šestipoložkový katalog.

## Data potřebná pro sestavení knihovny

### Katalogová strategie

Pro všech šest publikovaných katalogových strategií frontend potřebuje:

- stabilní katalogové ID nezávislé na uživatelském textu,
- pevné katalogové pořadí,
- název a souhrn karty,
- obsah detailu „Co udělat“, „Proč to může pomoci“, „Jak na to“ a „Kdy se může
  hodit“,
- volitelnou poznámku nebo dostupnou alternativu,
- volitelné oficiální odkazy.

Aktuální texty a pořadí určuje Figma. `content.md` je pomocný podklad; při
rozporu má přednost Figma.

### Uživatelský stav katalogové strategie

Pro každou katalogovou položku musí být možné zjistit:

- zda je ve Vybraných,
- zda je skrytá.

Tyto stavy jsou nezávislé. Skrytí nesmí změnit stav Vybrané a obnovená položka
se musí vrátit do původní sekce.

### Vlastní strategie

Frontend potřebuje načíst a ukládat:

- stabilní ID,
- povinný název,
- volitelné pole „Kdy ji chci použít?“,
- volitelné pole „Jak začnu?“,
- nezávislý stav Vybrané,
- nezávislý stav Skryté,
- čas vytvoření a poslední změny.

Čas vytvoření slouží k řazení vlastních strategií od nejnovější.

## Operace zbývající k implementaci

- načíst jeden aktuální stav, ze kterého frontend sestaví Vybrané, Další a
  Skryté strategie,
- vrátit všech šest katalogových položek včetně úplného detailu,
- přidat nebo odebrat katalogovou i vlastní strategii z Vybraných,
- skrýt a obnovit katalogovou i vlastní strategii,
- vytvořit vlastní strategii se třemi podporovanými poli,
- upravit tři podporovaná pole vlastní strategie,
- trvale smazat vlastní strategii,
- vrátit rozlišitelné chyby načtení, validace a uložení.

Katalogovou strategii nelze upravit ani smazat. Datová vrstva musí neplatnou
operaci odmítnout nezávisle na klientské validaci.

## Funkční pravidla

- Nejvýše pět vlastních strategií; započítávají se i skryté a nevybrané.
- Nová vlastní strategie se automaticky zařadí do Vybraných.
- Duplicitní název katalogové nebo vlastní strategie není povolen. Porovnání
  ignoruje velikost písmen a mezery před a za názvem.
- Název vlastní strategie je povinný a má nejvýše 80 znaků.
- Volitelná pole mají každé nejvýše 240 znaků.
- V každé sekci se nejprve řadí vlastní strategie od nejnovější a potom
  katalogové strategie v pevném pořadí.
- Všechny úspěšné změny musí přežít reload PWA.

## Migrace existujících dat

Migrace musí zachovat současné vlastní strategie i stav `active` již uložených
strategií. Součástí návrhu musí být způsob, jak existující katalogové záznamy
spojit se stabilním katalogovým ID bez dlouhodobé závislosti na názvu.

Po migraci se stejná katalogová strategie nesmí objevit dvakrát a změna jejího
uživatelského textu nesmí ztratit uložený stav uživatele.

## Očekávaná integrační hranice

Backendový tým může navrhnout vhodné service/repository rozhraní. Frontend na
aplikační hranici potřebuje:

1. načtený stav celého katalogu a všech vlastních strategií,
2. úplné katalogové detaily,
3. asynchronní operace pro všechny výše uvedené změny,
4. rozlišení chyb načtení, validace a uložení,
5. aktuální uložený stav po úspěšné mutaci.

Props a callbacky `StrategySection` lze při finálním napojení upravit podle
výsledného kontraktu. Vizuální komponenty a produktové chování zůstávají
zachované.

## Akceptační kritéria

- Knihovna vždy zobrazí všech šest katalogových strategií právě jednou.
- Každá katalogová karta má souhrn a otevírá úplný detail z aktuálního zdroje
  obsahu.
- Vybrané, Další a Skryté se správně sestaví z uloženého stavu.
- Výběr a skrytí zůstanou nezávislé také po reloadu.
- Vytvoření, úprava a smazání vlastní strategie se projeví v uloženém stavu.
- Limit, délky polí a unikátnost názvu jsou chráněné v aplikační nebo datové
  vrstvě, nejen ve formuláři.
- Chyba uložení je rozlišitelná a frontend při ní může zachovat rozepsaný
  formulář.
- Existující data projdou migrací bez ztráty vlastních strategií nebo stavu
  Vybrané.

## Požadované testy

- načtení kompletního katalogu a spojení s uživatelským stavem,
- nezávislost stavů Vybrané a Skryté,
- vytvoření, úprava a smazání vlastní strategie,
- limit pěti strategií, délky polí a kontrola duplicit,
- migrace současného záznamu katalogové i vlastní strategie,
- ochrana katalogové strategie před editací a smazáním,
- integrační tok načtení → změna → reload → opětovné načtení.

## Rozhodnutí ponechaná backendovému týmu

- výsledný datový model a vztah k současnému `coping_strategy`,
- způsob distribuce a verzování katalogového obsahu,
- použitá lokální nebo vzdálená persistence,
- konkrétní migrační strategie,
- hranice repository/service vrstvy a transakční chování,
- strategie optimistic/pessimistic aktualizací po dohodě s frontendem.
