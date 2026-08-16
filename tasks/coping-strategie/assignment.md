# Knihovna strategií — vývojové zadání

:::Stav: Frontend knihovny DONE; datové napojení TODO

Tento dokument je samostatné zadání pro vývoj. Uživatelské texty a obsah
katalogu jsou v [content.md](content.md).

## Stav implementace na této větvi

Hotová je prezentační a interakční vrstva samotné Knihovny strategií:

- knihovna, kontakty a přepínání záložek,
- karty a jejich centrované akční dialogy,
- stavy Vybrané, Další a Skryté,
- detail katalogové strategie,
- vytvoření, úprava a smazání vlastní strategie,
- limit pěti vlastních strategií a související validace,
- komponentové testy.

Frontend přijímá katalog, kontakty i uživatelský stav přes props a změny předává
callbacky. Tato větev záměrně neobsahuje dočasná preview data ani nemění výchozí
start aplikace. Onboarding zůstává beze změny.

Načítání, ukládání, migrace a napojení na existující aplikační služby nejsou
součástí hotové frontendové vrstvy. Samostatné předání pro backend je v
[backend-assignment.md](backend-assignment.md).

## Cíl

Vytvořit mobilní, samoobslužnou **Knihovnu strategií**, ve které si uživatel:

- během onboardingu zvolí alespoň jednu strategii,
- může volitelně přidat nejvýše pět vlastních strategií,
- spravuje prioritní seznam **Vybrané**,
- může strategie skrýt a později obnovit,
- může kdykoliv otevřít detail strategie,
- může upravit nebo smazat pouze vlastní strategie,
- najde oddělený seznam kontaktů na odbornou pomoc.

Knihovnu otevírá uživatel sám. Aplikace nerozpoznává nutkání a nespouští
strategie podle check-inu, limitu ani záznamu hraní.

## Rozsah

### Součást zadání

- výběr strategií v onboardingu,
- Knihovna strategií a detaily strategií,
- vytváření a úprava vlastních strategií,
- stavy Vybrané a Skryté,
- záložka Kontakty,
- lokální zachování uživatelských změn pod pseudonymním výzkumným ID,
- mobile-first a přístupné rozhraní.

## Navigace

- Položka ve spodní navigaci: **Strategie**.
- Nadpis obrazovky: **Knihovna strategií**.
- Uvnitř sekce Strategie jsou záložky **Knihovna** a **Kontakty**.
- Jediný vstup do sekce vede přes spodní navigaci Strategie.

## Uživatelské flow

### 1. Onboarding

1. Uživatel vidí krátké vysvětlení a šest katalogových strategií. Žádná není
  vybraná předem.
2. Uživatel sám vybere alespoň jednu strategii. Rozhraní vyžaduje minimum jedné.
3. Volitelně přidá vlastní strategii. V onboardingu vyplňuje pouze její název.
4. Vlastních strategií lze vytvořit nejvýše pět.
5. Nová vlastní strategie je automaticky ve Vybraných.
6. Onboarding se uloží až při společném potvrzení. Opuštění rozpracovaného kroku
  nesmí vytvořit neúplný plán.

Při zadávání nebo úpravě názvu vlastní strategie aplikace průběžně kontroluje,
zda stejný název už nemá katalogová nebo jiná vlastní strategie. Pokud název
existuje, zobrazí ihned inline upozornění a nedovolí strategii uložit, dokud
uživatel nezvolí jiný název. Kontrola ignoruje velikost písmen a mezery před a za
názvem.

Limit pěti zahrnuje také skryté vlastní strategie. Odebrání z Vybraných ani
skrytí místo neuvolní; kapacitu uvolní pouze smazání vlastní strategie.

Při dosažení limitu zůstává akce **Přidat vlastní strategii** dostupná. Po jejím zvolení aplikace nevytvoří další formulář, ale zobrazí informační dialog s vysvětlením, že pro přidání další strategie je nutné některou vlastní strategii nejprve smazat. Dialog nabízí akce **Zobrazit strategie** a **Zavřít**. První akce zavře dialog a přesune uživatele ke strategiím v knihovně.

U akce pro přidání může rozhraní zobrazovat aktuální kapacitu ve tvaru
**{počet} z 5 vlastních strategií**. Doporučení vybrat dvě až tři strategie se
nemění; pět je pouze maximální povolený počet vlastních položek.

### 2. Knihovna

Knihovna má dvě hlavní sekce:

1. **Vybrané** — strategie, které chce mít uživatel nahoře a snadno po ruce.
2. **Další strategie** — ostatní viditelné strategie.

Nadpis konkrétní sekce se vykreslí pouze tehdy, pokud daná sekce obsahuje
alespoň jednu strategii.

V obou sekcích se nejprve zobrazují vlastní strategie od nejnovější a potom
katalogové strategie v pevném pořadí uvedeném v [content.md](content.md).
Uživatel pořadí ručně nemění.

Odebrání z Vybraných strategii přesune mezi Další strategie; neskrývá ji a
nemaže. Skryté strategie se v běžném seznamu nezobrazují. Jsou v samostatném
přehledu **Skryté strategie**, odkud je lze obnovit.

Stavy Vybrané a Skryté jsou nezávislé. Skrytí zachová stav Vybrané a po obnovení
se strategie vrátí do odpovídající sekce.

### 3. Karta strategie

Katalogová i vlastní strategie používají stejný základní typ kompaktní karty.

Katalogová karta obsahuje:

- akční název,
- vždy jednořádkový souhrn definovaný v obsahovém dokumentu,
- tlačítko se třemi tečkami,
- klikací plochu pro otevření detailu.

Vlastní karta obsahuje:

- název zadaný uživatelem,
- štítek **Vlastní**,
- první krok z pole **Jak začnu?**, pouze pokud ho uživatel vyplnil,
- tlačítko se třemi tečkami,
- klikací plochu pro otevření detailu.

Pokud vlastní strategie nemá vyplněný první krok, karta pod názvem nezobrazuje
žádný zástupný text ani prázdný druhý řádek.

Karty nemají dekorativní ikony. Uživatel při vytváření vlastní strategie žádnou
ikonu nevybírá. Mechanismy nejsou viditelné kategorie ani další úroveň
navigace.

Tlačítko se třemi tečkami otevře centrovaný modalní overlay dialog:


| Typ strategie | Dostupné akce                                            |
| ------------- | -------------------------------------------------------- |
| Katalogová    | Přidat do Vybraných / Odebrat z Vybraných, Skrýt         |
| Vlastní       | Přidat do Vybraných / Odebrat z Vybraných, Skrýt, Smazat |


Akce **Smazat** otevře samostatné potvrzení s informací, že jde o trvalou akci.
Katalogová strategie smazání nikdy nenabízí.

### 4. Detail katalogové strategie

Detail zobrazuje schválený, needitovatelný obsah:

- Co udělat,
- Proč to může pomoci,
- Jak na to,
- Kdy se může hodit,
- dostupnou alternativu nebo realistickou poznámku, pokud je relevantní.

Strategie **Znesnadním si přístup ke hraní** obsahuje navíc nenátlakový
edukační blok o přestávce na 48 hodin a dlouhodobějším zápisu do RVO. Aplikace
tyto možnosti sama neaktivuje.

Z detailu lze změnit stav Vybrané nebo strategii skrýt. Obsah katalogové
strategie nelze upravit ani kopírovat do vlastní varianty.

### 5. Detail vlastní strategie

Uživatel může upravit pouze:

- **Název** — povinný, nejvýše 80 znaků,
- **Kdy ji chci použít?** — volitelné, nejvýše 240 znaků,
- **Jak začnu?** — volitelné, nejvýše 240 znaků.

Detail neobsahuje systémové vysvětlení účinku. Uživatel zde může také změnit
stav Vybrané, strategii skrýt nebo ji po potvrzení smazat.

Při chybě uložení zůstane rozepsaný obsah ve formuláři a zobrazí se inline
zpráva podle [content.md](content.md).

### 6. Kontakty

- Kontakty slouží pro dobrovolnou konzultaci, ne jako automaticky spuštěná
krizová intervence.
- Každá karta obsahuje název služby, stručný účel, kanál, případnou provozní
dobu a odpovídající akci **Zavolat** nebo **Otevřít web**.
- Aplikace nezaznamenává, zda uživatel některou službu skutečně kontaktoval.
- Technická podpora aplikace není součástí této záložky.
- Konkrétní služby a údaje před pilotem schválí NUDZ.
- Informace pro bezprostřední ohrožení je nenápadná, vizuálně oddělená a
umístěná až pod běžnými poradenskými kontakty.

## Data a soukromí

- Jediným identifikátorem uživatele v této funkci je pseudonymní výzkumné ID.
- Funkce nesbírá jméno, e-mail, telefon ani jiné přímé identifikátory.
- Vlastní texty a uživatelské změny zůstávají lokálně na daném zařízení.
- Jména ani kontaktní údaje blízkých osob se neukládají.
- Smazání vlastní strategie odstraní její uživatelský obsah.

## Akceptační kritéria

- Při otevření onboardingového kroku není vybraná žádná strategie.
- Onboarding nelze dokončit bez alespoň jedné uživatelem vybrané strategie.
- Vlastní strategii lze v onboardingu přeskočit; šestou vlastní strategii nelze
vytvořit.
- Limit zahrnuje i skryté vlastní strategie a uvolní se pouze jejich smazáním.
- Pokus o přidání šesté strategie zobrazí informační dialog a umožní přejít k
vlastním strategiím nebo dialog zavřít.
- Duplicitní název katalogové nebo jiné vlastní strategie vyvolá okamžité inline
upozornění a nelze jej uložit.
- Nová vlastní strategie se automaticky objeví ve Vybraných.
- Knihovna správně odděluje Vybrané, Další strategie a Skryté strategie.
- Změna stavu Vybrané strategii neskrývá ani nemaže.
- Skrytí je vratné a zachová stav Vybrané.
- Vlastní strategie jsou v každé sekci před katalogovými a nelze je ručně
řadit.
- Katalogová karta zobrazuje souhrn; vlastní karta zobrazuje první krok jen po
jeho vyplnění.
- Třítečkové menu nabízí akce podle původu strategie.
- Smazání je dostupné pouze pro vlastní strategii a vždy vyžaduje potvrzení.
- Katalogový detail nelze upravit; vlastní detail dovolí upravit pouze tři
určená pole.
- Po obnovení aplikace zůstávají lokální změny zachované pod výzkumným ID.
- Knihovna je dostupná pouze přes spodní navigaci Strategie a neotevírá se
automaticky podle uživatelských záznamů.
- Kontakty a oficiální odkazy se otevírají odpovídající nativní nebo externí
akcí.
- Informace pro bezprostřední ohrožení je až pod poradenskými kontakty a je od
  nich vizuálně oddělená.
