# Produktová rozhodnutí — coping strategie

Tento dokument je interní decision log. Uchovává historii potvrzených i
otevřených produktových rozhodnutí, ale není součástí handoffu pro vývoj.
Samostatný handoff tvoří [assignment.md](assignment.md) a
[content.md](content.md); oba dokumenty lze použít bez tohoto logu.

Rozhodnutí D01–D04, D08–D15, D20–D21 a datový princip v D16 jsou potvrzené.
Ostatní doporučení nejsou považována za schválená, dokud je spolu výslovně
nepotvrdíme. Doporučené pořadí diskuze je D11 až D19; D05–D07 odpadla po D01 a
pozdější rozhodnutí často závisí na předchozích.

## Přehled

| ID | Rozhodnutí | Pracovní doporučení | Priorita | Závisí na |
| --- | --- | --- | --- | --- |
| D01 | Podoba coping intervence | **Schváleno:** samoobslužná edukační knihovna bez Hlídače a Rychlé pomoci | Kritická | — |
| D02 | Rozsah cílové skupiny | **Schváleno:** aplikaci dostává pouze intervenční skupina; bez větvení | Kritická | D01 |
| D03 | Název sekce a terminologie | **Schváleno:** navigace „Strategie“, sekce „Knihovna strategií“, preferovat „nutkání hrát“ | Vysoká | D01 |
| D04 | Rozsah nastavení v onboardingu | **Schváleno:** vlastní strategie jsou volitelné, nejvýše 5, v onboardingu pouze název | Vysoká | D01–D03, D16 |
| D05 | Aktivace intervence | **Odpadá po D01:** aplikace nic nespouští; sekci otevírá uživatel | Kritická | D01 |
| D06 | Délka a frekvence Hlídače | **Odpadá po D01:** neexistuje časovaná relace | Kritická | D01 |
| D07 | Role notifikací | **Odpadá po D01:** coping nepoužívá intervalové notifikace | Vysoká | D01 |
| D08 | Karta, detail a Vybrané | **Schváleno:** společný typ karty, rozdílný detail a prioritní sekce Vybrané | Vysoká | D01, D04 |
| D09 | Složení katalogu | **Schváleno:** plochý katalog šesti strategií, jedna za každý mechanismus | Vysoká | D04, D08 |
| D10 | Tón komunikace | **Schváleno:** vykání, genderově neutrální, přístupný a nehodnotící jazyk | Kritická | D03, D08, D09 |
| D11 | Zpětná vazba ke strategii | **Schváleno:** hodnocení jednotlivých strategií se nesbírá | Vysoká | D01, D10, D16 |
| D12 | Reakce na neplánované hraní | **Schváleno:** žádná zvláštní coping intervence; pouze neutrální monitoring a obecná edukace | Kritická | D01, D10 |
| D13 | Panic button a RVO | **Schváleno:** dvě informačně oddělené možnosti uvnitř relevantní strategie | Kritická | D12 |
| D14 | Vztah k limitům a check-inu | **Schváleno:** bez kontextové výzvy; knihovna pouze jako běžná část aplikace | Vysoká | D01, D12 |
| D15 | Odborná pomoc a kontakty | **Schváleno:** interní záložka Kontakty vedle Knihovny, zaměřená na dobrovolné poradenství | Kritická | D12 |
| D16 | Identita, data a soukromí | Potvrzeno: výzkumné ID, žádné přímé identifikátory, lokální data | Kritická | D04, D11 |
| D17 | Další volný text mimo vlastní strategie | Vlastní strategie schválené v D04; jiné volné vzkazy zatím nejsou součástí scope | Kritická | D04, D09, D16 |
| D18 | Lokální persistence | **Předáno backendu:** technologie a migrace nejsou předepsané | Vysoká | D16 |
| D19 | Model katalogu a jeho verzování | **Předáno backendu:** tato větev stanovuje jen požadované chování | Kritická | D04, D08, D09, D16 |
| D20 | Zdroj pravdy pro frontend | **Schváleno:** při rozporu ve vzhledu nebo uživatelském textu má přednost aktuální Figma | Vysoká | D03, D08–D10 |
| D21 | Nabídka akcí strategie v PWA | **Schváleno:** centrovaný overlay dialog otevřený ze třítečkového tlačítka | Vysoká | D08, D20 |

## D01 — Podoba coping intervence

**Stav:** Schváleno.

**Rozhodnutí:** Coping nebude just-in-time intervence a aplikace se nebude
pokoušet rozpoznat okamžik nutkání nebo relapsu. Nebudou existovat dva aktivní
režimy „Hlídač“ a „Rychlá pomoc“, časované relace ani intervalové coping
notifikace.

Produkt má jednu samoobslužnou sekci coping strategií se dvěma funkcemi:

- **edukace:** každá strategie vysvětluje, co udělat, proč může fungovat, jak ji
  použít a kdy se může hodit,
- **připomenutí:** uživatel se do sekce může kdykoliv sám vrátit a strategii si
  znovu přečíst.

Samotné použití strategie typicky probíhá mimo aplikaci ve chvíli, kdy si
uživatel uvědomí nutkání a na strategii si vzpomene. Aplikace pouze vytváří
znalost, podporuje zapamatování a umožňuje dobrovolný návrat k obsahu. Neslibuje
zásah ve správný okamžik.

**Dopad na další rozhodnutí:** D05, D06 a D07 odpadají. D03, D08, D11, D12 a
D14 je potřeba posuzovat jako návrh statické edukační knihovny, nikoliv aktivní
intervence.

## D02 — Rozsah cílové skupiny

**Stav:** Schváleno.

**Rozhodnutí:** Aplikaci dostává pouze intervenční skupina. Kontrolní skupina ji
vůbec nepoužívá.

Produkt proto neobsahuje žádné větvení podle výzkumné skupiny, atribut
`study_arm`, přepínač skupin, skrývání funkcí pro kontrolní větev ani vlastní
randomizaci. Všichni uživatelé aplikace mají stejnou produktovou variantu;
odlišuje je pouze jejich pseudonymní výzkumné ID.

## D03 — Název sekce a jazyk situace

**Stav:** Schváleno.

**Rozhodnutí:**

- jednoslovný název ve spodní navigaci je **Strategie**,
- nadpis cílové sekce je **Knihovna strategií**,
- názvy „Hlídač“ a „Rychlá pomoc“ se nepoužívají,
- v uživatelských textech se používá srozumitelné „nutkání hrát“ místo odborného
  „bažení“,
- situace po neplánovaném hraní se popisuje neutrálně, například „Když hraní
  nešlo podle plánu“; pojem relaps lze vysvětlit v psychoedukaci, ale nepoužívá
  se jako nálepka uživatele.

## D04 — Nastavení při registraci

**Stav:** Schváleno.

**Rozhodnutí:**

- Vlastní strategie je volitelná; uživatel může mít nejvýše pět.
- V onboardingu u vlastní strategie zadává pouze krátký název formulovaný jako
  konkrétní akce. Pozdější detail umožní název změnit a volitelně doplnit „Kdy ji
  chci použít?“ a „Jak začnu?“.
- Uživatel pořadí ručně nemění. Viditelné vlastní strategie jsou vždy před
  katalogovými v rámci stejné sekce a mezi sebou se řadí od nejnovější.
- Nová vlastní strategie se automaticky přidá do Vybraných. Uživatel ji může z
  Vybraných odebrat stejně jako katalogovou strategii; tím ji neskrývá ani
  nemaže.
- Katalogovou i vlastní strategii lze skrýt a později obnovit v samostatném
  přehledu skrytých strategií.
- Pouze vlastní strategii lze po potvrzení definitivně smazat. Smazání odstraní
  její uživatelský text; katalogové strategie smazat nelze.
- Limit pěti zahrnuje i skryté vlastní strategie. Odebrání z Vybraných ani
  skrytí místo neuvolní; kapacitu uvolní pouze smazání vlastní strategie.
- Při pokusu o přidání šesté strategie se nezobrazí další formulář, ale dialog s
  vysvětlením limitu a akcemi **Zobrazit moje strategie** a **Zavřít**.
- Onboarding dále umožní vybrat alespoň jednu strategii pro osobní plán a ukáže,
  kde uživatel později najde Knihovnu strategií.
- Žádná strategie není v onboardingu vybraná předem. Uživatel musí sám vybrat
  alespoň jednu, aby mohl pokračovat.

Onboarding neřeší časování, notifikační oprávnění ani krizové nastavení a
neobsahuje jméno, e-mail, telefon, účet ani kontaktní údaj blízké osoby. Vlastní
text je uložen pouze lokálně pod pseudonymním výzkumným ID a formulář upozorní,
aby do něj uživatel nevkládal jména, kontakty ani jiné osobní údaje.

**Datový dopad:** Vlastní strategie potřebuje stabilní lokální ID, výzkumné ID,
název, volitelnou situaci použití, volitelný první krok, časy vytvoření a změny a
stav skrytí. Katalogová strategie ukládá pouze vazbu na stabilní katalogové ID a
uživatelský stav výběru nebo skrytí. `is_selected` určuje zařazení do Vybraných a
`hidden_at` skrytí; tyto stavy se neslučují. Ruční `sort_order` není součástí
cílového chování, protože pořadí se odvozuje z typu strategie, času vytvoření a
pevného pořadí katalogu.

## D05 — Aktivace intervence

**Stav:** Odpadá na základě D01.

Sekci coping strategií otevírá uživatel sám. Aplikace nerozpoznává nutkání,
nespouští coping flow a neoznačuje limitní stav jako psychologický spouštěč.

## D06 — Délka a frekvence relace

**Stav:** Odpadá na základě D01. Neexistuje časovaná coping relace.

## D07 — Notifikace

**Stav:** Odpadá na základě D01. Coping strategie neposílají intervalové
notifikace.

## D08 — Karta, detail a sekce Vybrané

**Stav:** Schváleno.

**Rozhodnutí o knihovně:**

- Nahoře je sekce **Vybrané**. Obsahuje vlastní i katalogové strategie označené
  uživatelem jako vybrané.
- Pod ní je sekce **Další strategie** se všemi ostatními viditelnými položkami.
- Nová vlastní strategie se automaticky přidá do Vybraných. Každou vlastní i
  katalogovou strategii lze do Vybraných přidat nebo ji z nich odebrat.
- Odebrání z Vybraných strategii nemaže ani neskrývá; přesune ji mezi Další
  strategie.
- Původ a priorita jsou dva různé atributy: **Vlastní** označuje uživatelský
  obsah, **Vybrané** rychlou dostupnost.

**Společná karta:** Katalogová i vlastní strategie používají stejný základní
layout. Katalogová karta vždy ukazuje krátký akční název a jednořádkový souhrn.
Vlastní karta ukazuje název, štítek **Vlastní** a první krok z pole „Jak začnu?“,
jen pokud ho uživatel vyplnil. Bez prvního kroku nezobrazuje zástupný text ani
prázdný druhý řádek. Celá karta otevírá detail. Na pravé straně je tlačítko se
třemi tečkami, které otevře mobilní panel s organizačními akcemi. Dlouhý postup,
vysvětlení mechanismu, hodnocení, situační štítky ani datum vytvoření na kartu
nepatří.

Strategie nepoužívají dekorativní ani uživatelsky volitelné ikonky. Katalogové a
vlastní strategie tak mají stejnou vizuální strukturu a vytvoření vlastní
strategie nevyžaduje další volbu bez funkčního významu.

**Panel akcí:** U katalogové strategie obsahuje podle aktuálního stavu
**Přidat do Vybraných** nebo **Odebrat z Vybraných** a dále **Skrýt**. U vlastní
strategie přidává také **Smazat**. Volba Smazat vždy otevře druhé potvrzovací
okno s jasným upozorněním, že smazání je trvalé; teprve následné potvrzení
strategii odstraní. Katalogová strategie možnost Smazat nikdy nezobrazuje.

**Detail katalogové strategie:** Obsahuje „Co udělat“, „Proč to může pomoci“,
„Jak na to“, „Kdy se může hodit“ a realistickou poznámku, že strategie nemusí
pomoci pokaždé. Uživatel odborně připravený obsah neupravuje. Může pouze změnit
stav Vybrané, strategii skrýt nebo obnovit.

**Detail vlastní strategie:** Obsahuje povinný editovatelný název a volitelná
editovatelná pole „Kdy ji chci použít?“ a „Jak začnu?“. Neobsahuje systémové
vysvětlení „Proč to může pomoci“, protože aplikace nemůže odborně interpretovat
libovolný uživatelský obsah. Uživatel může změnit stav Vybrané, strategii skrýt,
obnovit nebo po potvrzení definitivně smazat.

Katalogovou strategii nelze zkopírovat do editovatelné varianty. Obsah nemá
vyžadovat, aby uživatel během nutkání procházel dlouhý text; klíčový první krok
musí být pochopitelný už při dřívějším přečtení.

**Automatické řazení:** V každé sekci jsou nejprve vlastní strategie od
nejnovější, potom katalogové strategie v pevném katalogovém pořadí. Ruční změna
pořadí není dostupná. Skryté strategie jsou pouze v samostatném přehledu.

## D09 — Složení katalogu

**Stav:** Schváleno.

**Rozhodnutí:** Katalog je plochý seznam šesti strategií. Každá představuje jeden
odlišný primární mechanismus:

| Mechanismus — interní | Strategie — uživatelský název |
| --- | --- |
| změna prostředí a oddálení | Na chvíli změním prostředí |
| sociální opora | Ozvu se někomu, komu důvěřuji |
| práce s nutkáním | Nechám nutkání chvíli projít |
| behaviorální substituce | Začnu jinou krátkou činnost |
| práce s osobním motivem | Připomenu si, co chci chránit |
| omezení dostupnosti hraní | Znesnadním si přístup ke hraní |

Mechanismy nejsou samostatná uživatelská úroveň, kategorie ani obrazovka. Slouží
pouze jako interní metadata pro odbornou revizi a kontrolu pokrytí. Konkrétní
varianty, například chůze, sprcha nebo jednoduchá činnost, jsou příklady uvnitř
detailu jedné strategie, nikoliv další katalogové karty.

Každá strategie má jeden primární mechanismus a může mít více situačních štítků,
například „Při nutkání“, „Když chci přestat“ a „Po hraní“. Díky tomu se může
zobrazit ve více tematických pohledech bez vytvoření obsahových kopií.

Vlastní strategie jsou součástí scope podle D04. Samostatné vlastní vzkazy mimo
strategii součástí katalogu nejsou a případně se řeší v D17.

## D10 — Tón a bezpečnost textů

**Stav:** Schváleno.

**Rozhodnutí:** Ve všech uživatelských textech se vyká. Text se vyhýbá rodově
určeným minulým tvarům s lomítkem, oslovení podle genderu a předpokladům o
partnerství, rodině, fyzických možnostech, financích nebo dostupnosti blízké
osoby. Preferuje krátké věty, konkrétní slovesa, jednu akci v jednom kroku a
volitelné alternativy pro různé situace a možnosti.

Zachovat význam podkladů, ale přepracovat hodnotící a zahanbující texty.
Nepoužívat například „neblbni“, „víc štěstí než rozumu“, „zmatený mozek“,
„výčitky z prohry“, „příště budete chytřejší“, „špatné rozhodnutí“ nebo tvrzení,
že uživatel vyhrál či prohrál souboj se závislostí.

Preferovaný vzorec:

- faktická situace bez diagnózy,
- jeden konkrétní krok,
- autonomie uživatele,
- možnost další podpory,
- žádný slib, že nutkání určitě odezní v konkrétním čase.

Instrukce nenutí k pohybu, kontaktování rodiny ani jiné jediné cestě. Pokud
strategie nemusí být pro někoho dostupná nebo bezpečná, nabídne rovnocennou
variantu. Ikona, barva nebo odborný termín nikdy nejsou jediným nositelem
významu.

## D11 — Zpětná vazba ke strategii

**Stav:** Schváleno.

**Rozhodnutí:** Aplikace nesbírá zpětnou vazbu ani hodnocení k jednotlivým
strategiím. Neptá se, zda strategie pomohla, jak byla užitečná ani zda ji
uživatel skutečně použil.

Aplikace bez aktivní relace neví, zda a kdy uživatel strategii mimo aplikaci
použil. Otevření knihovny nebo detailu proto nelze interpretovat jako použití
strategie, zvládnutí nutkání ani její účinek. Výzkumný protokol hodnocení
jednotlivých strategií nevyžaduje.

Karty ani detail strategie neobsahují hodnocení, škálu, palec nahoru či dolů,
otázku při zavření ani historii domnělé úspěšnosti. Případné obecné hodnocení
aplikace jako celku je mimo scope tohoto rozhodnutí.

## D12 — Reakce na neplánované hraní

**Stav:** Schváleno.

**Rozhodnutí:** Neplánované hraní nespouští žádnou konkrétní coping intervenci,
nápravnou sekvenci ani zvláštní edukační flow. Produkt zůstává primárně
monitorovacím a obecně edukačním nástrojem.

Záznam o hraní je přijat neutrálně bez penalizace, odměny, moralizování nebo
vyvolávání pocitu selhání. Aplikace po něm automaticky nenabízí „Rychlou pomoc“,
nevyžaduje reflexi spouštěče, změnu plánu ani použití konkrétní strategie.

Obecné strategie v Knihovně strategií zůstávají kdykoliv dostupné z iniciativy
uživatele. Některé z nich mohou být relevantní také během hraní nebo po něm,
ale aplikace je neváže na konkrétní záznam a neprezentuje je jako povinnou
reakci na nežádoucí výsledek.

## D13 — Panic button a dlouhodobé sebevyloučení

**Stav:** Schváleno.

**Rozhodnutí:** Aplikace pouze vysvětlí dvě odlišné oficiální možnosti omezení
hraní a odkáže na aktuální informace. Nevytváří vlastní panic button, žádnou z
možností sama neaktivuje a neprovádí uživatele rozhodovacím flow.

Obsah je umístěný v detailu katalogové strategie **„Znesnadním si přístup ke
hraní“** pod klidným edukačním nadpisem **„Možnosti omezení hraní“**. Není z něj
samostatná funkce, hlavní navigační položka, krizový režim ani automatická
reakce na záznam nebo stav limitu.

Obsah rozlišuje:

- **Přestávku na 48 hodin:** krátkodobé omezení dostupné prostřednictvím
  provozovatele hazardních her; platí u provozovatelů v České republice a po 48
  hodinách automaticky skončí.
- **Dlouhodobější zápis do RVO:** zápis na dobu neurčitou; o výmaz lze požádat
  nejdříve po jednom roce a výmaz není automatický.

Úvodní wording:

> Pokud si chcete přístup ke hraní omezit více, existují také oficiální možnosti
> sebevyloučení. Liší se délkou a způsobem aktivace. Aplikace je sama nezapíná.

Odkazy mají neutrální informační popisky **„Jak funguje přestávka na 48 hodin“**
a **„Zjistit více o RVO“**. Nepoužívá se červené nebo alarmující tlačítko, výzva
„Aktivovat panic button“ ani sdělení, že uživatel některou možnost potřebuje.
Text nesmí tvrdit, že 48hodinovou přestávku lze jedním krokem prodloužit na rok.

Odkazy vedou na oficiální informace Ministerstva financí nebo Portálu veřejné
správy a před pilotem i v průběhu provozu se pravidelně kontroluje jejich obsah
a platnost.

## D14 — Vztah ke check-inu a limitům

**Stav:** Schváleno.

**Rozhodnutí:** Check-in, výsledek záznamu ani stav limitu nezobrazují
kontextovou výzvu ke coping strategiím. Nespouštějí coping intervenci, prompt,
notifikaci ani sekundární odkaz typu „Připomenout strategie“.

Aplikace nedokáže rozpoznat nutkání ani potřebu pomoci a neodvozuje je ze
záznamu hraní nebo čerpání limitu. Neplánované hraní ani vyšší čerpání proto
nevede k nápravné coping sekvenci a není označeno jako signál selhání.

Knihovna strategií je dostupná pouze jako běžná část aplikace přes spodní
navigaci **Strategie**. Dashboard, check-in ani výsledek záznamu neobsahují
další vstup do knihovny.

## D15 — Odborná pomoc a kontakty

**Stav:** Schváleno.

**Rozhodnutí:** Součástí sekce **Strategie** jsou dvě interní záložky:
**Knihovna** a **Kontakty**. Kontakty jsou zaměřené primárně na dobrovolnou
odbornou konzultaci pro člověka, který chce svou situaci s někým probrat.
Sekce se nejmenuje „Krizová pomoc“ a není prezentována jako reakce na selhání
nebo rozpoznané riziko.

Každá kontaktní karta obsahuje název služby, stručné vysvětlení, s čím může
pomoci, způsob kontaktu, případnou provozní dobu a konkrétní akci **Zavolat**,
**Napsat** nebo **Otevřít web**. Kontakty se nezobrazují automaticky podle
záznamu, limitu nebo chování uživatele a aplikace nikoho netlačí k jejich
využití.

Konkrétní služby, wording, pořadí, kontaktní údaje a provozní doby před pilotem
schválí NUDZ. Odborné kontakty se nemíchají s technickou podporou aplikace.
Otevření záložky, externího odkazu ani telefonního protokolu se neukládá jako
kontaktování služby, adherence nebo výzkumný výsledek.

Informace pro bezprostřední ohrožení je uvedena jako nenápadná, vizuálně
oddělená bezpečnostní poznámka až pod běžnými poradenskými kontakty. Není hlavním
názvem ani charakterem celé sekce.

## D16 — Identita, data a soukromí

**Stav:** Základní princip potvrzen.

**Rozhodnutí:**

- Aplikace nesbírá jméno, e-mail, telefon, adresu, datum narození, přihlašovací
  údaje ani jiný přímý identifikátor účastníka.
- Jediným identifikátorem je pseudonymní výzkumné ID.
- Aplikace nezná mapování výzkumného ID na skutečnou osobu.
- Pod výzkumným ID se lokálně ukládají pouze záznamy potřebné pro program a RCT.
- Aplikace neukládá jméno ani kontakt blízké osoby.
- Bez samostatně definovaného exportu nebo přenosu data neopouštějí zařízení.

Mezi minimální záznamy potřebné pro funkci a RCT mohou patřit:

- strategie vybraná nebo deaktivovaná,
- knihovna otevřená,
- detail strategie zobrazený.

Otevření detailu ani výběr strategie se nesmí označovat za použití strategie,
zvládnuté bažení nebo klinický úspěch.

**Ještě potřebujeme potvrdit:** přesný RCT dataset, retenční dobu, způsob zadání
nebo provisioningu výzkumného ID a jak se evidují chybějící či nedostupná
lokální data.

## D17 — Další volný text mimo vlastní strategie

Vlastní strategie a jejich pole jsou schválené v D04 a ukládají se pouze
lokálně. D17 už neřeší jejich přípustnost.

**Otevřená otázka:** Má aplikace vedle vlastních strategií obsahovat ještě jiné
volné texty, například samostatné „vzkazy budoucímu já“?

**Doporučení:** Další typ volného textu bez samostatně potvrzené uživatelské a
výzkumné hodnoty nepřidávat. Každé další textové pole zvyšuje riziko vložení
osobních nebo citlivých údajů a vyžaduje vlastní pravidla úprav a mazání.

## D18 — localStorage nebo obecně lokální úložiště

**Otázka:** Znamená požadavek `localStorage` konkrétní Web Storage API, nebo
obecně to, že všechna data zůstávají lokálně v prohlížeči?

**Produktový požadavek:** Uživatelské změny musí po obnovení aplikace zůstat
lokálně zachované pod pseudonymním výzkumným ID.

**Předáno backendu:** Volba úložiště, migrací a konkrétní implementace datové
vrstvy není produktovým rozhodnutím této větve. Požadované chování a hranice jsou
v [backend-assignment.md](backend-assignment.md).

## D19 — Model katalogu a jeho verzování

**Otázka:** Jak oddělit klinicky schválený obsah, uživatelův plán a výzkumná data,
aby změna textu nezměnila zpětně význam starších záznamů?

**Požadovaný výsledek:** Frontend musí dostat úplný katalogový obsah a aktuální
uživatelský stav. Po obnovení aplikace musí být možné reprodukovat, které položky
uživatel vidí, má ve Vybraných nebo skryté a jaké vlastní strategie vytvořil.

**Předáno backendu:** Konkrétní datový model, verzování obsahu, migrace a
rozhraní služeb navrhne backendový tým. Tato větev žádné řešení nepředepisuje.

## D20 — Zdroj pravdy pro frontend

**Stav:** Schváleno.

**Rozhodnutí:** Pro aktuální frontendový vývoj je Figma průběžně udržovaný zdroj
pravdy pro vizuální podobu i přesné uživatelské texty. Pokud se název, souhrn
nebo jiný text ve Figmě liší od [content.md](content.md), implementace použije
variantu z Figmy. Figma má v těchto rozporech přednost také před starším
vizuálním popisem v [assignment.md](assignment.md).

`assignment.md` nadále určuje funkční chování a omezení, která Figma sama
nepopisuje, například pravidla řazení, limity nebo zachování stavů. Rozpor ve
funkčním chování není důvod k tichému přepsání požadavku; je potřeba ho označit
k produktovému rozhodnutí.

## D21 — Nabídka akcí strategie v PWA

**Stav:** Schváleno.

**Rozhodnutí:** Tlačítko se třemi tečkami na `StrategyCard` zůstává samostatnou
akcí a neotevírá detail strategie. Nabídku organizačních akcí zobrazí přístupný
centrovaný overlay dialog se ztmaveným pozadím. Dialog není ukotvený ke kartě a
nepoužívá gesto tažení ani drag madlo.

Dialog musí mít jednoznačný způsob zavření, podporovat klávesu Escape, po
otevření správně převzít fokus a po zavření ho vrátit na třítečkové tlačítko.
Kliknutí na ztmavené pozadí dialog zavře. Název strategie uvnitř dialogu zachová
kontext akce. Výběr akce nesmí současně otevřít detail strategie.

## D22 — Skrytí a výběr strategie jsou nezávislé stavy

**Stav:** Schváleno.

**Rozhodnutí:** Skrytí strategie nemění informaci o tom, zda ji měl uživatel
vybranou. Skrytá strategie se nezobrazuje ani v sekci „Vybrané“, ani v sekci
„Další strategie“, ale její stav výběru se zachová. Pokud ji uživatel později
obnoví, vrátí se do sekce odpovídající jejímu předchozímu stavu výběru.

Frontend proto pracuje se samostatnými množinami vybraných a skrytých ID.
Budoucí perzistentní datový model musí umožnit oba stavy ukládat a měnit
nezávisle.

Ovládací prvek „Skryté strategie“ se nezobrazuje, pokud není skrytá žádná
strategie. Jakmile skrytá strategie existuje, ovládací prvek rozbalí její seznam
přímo pod knihovnou podle návrhu ve Figmě. Po obnovení poslední skryté strategie
se prvek i prázdná sekce opět skryjí.

## Navržený postup společného rozhodování

1. D01 je uzavřené: samoobslužná edukační knihovna.
2. D02 a D03 jsou uzavřené: aplikace je pouze pro intervenční skupinu a sekce se
   jmenuje Knihovna strategií.
3. D04 a D08–D10 jsou uzavřené: onboarding, karty, šest strategií a jazyk.
4. Rozhodnout edukaci po neplánovaném hraní a ochranné nástroje D11–D13.
5. Napojit knihovnu na zbytek aplikace a výzkumný protokol podle D14–D16.
6. Uzavřít volný text, technologii lokálního uložení a datový model podle
   D17–D19.
7. Po každém bloku propsat schválené rozhodnutí do
   [assignment.md](assignment.md) a odstranit vyřešenou otevřenou otázku.

## Ověřené externí skutečnosti

- Ministerstvo financí popisuje panic button jako vyloučení na 48 hodin a
  samostatně popisuje dlouhodobý zápis do RVO.
  [Ministerstvo financí — RVO](https://www.mfcr.cz/cs/soukromy-sektor/hazardni-hry/rejstrik-vyloucenych-osob-rvo/pro-verejnost)
- U dobrovolného zápisu do RVO lze o výmaz požádat nejdříve po jednom roce.
  [Portál veřejné správy — zápis do RVO](https://portal.gov.cz/sluzby-vs/rejstrik-vyloucenych-osob-z-ucasti-na-hazardni-hre-S12888)
