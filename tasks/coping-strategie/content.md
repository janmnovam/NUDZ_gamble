# Knihovna strategií — obsah

:::Stav: TODO

Tento dokument obsahuje uživatelské texty pro implementaci
[Knihovny strategií](assignment.md).

## Redakční pravidla

- Vykáme a používáme genderově neutrální formulace.
- Píšeme krátce, konkrétně a nehodnotícím tónem.
- Používáme „může pomoci“, ne příslib výsledku.
- Strategie nejsou test vůle a jejich nevyužití ani neúčinnost nejsou selhání.
- Nepředpokládáme možnost pohybu, blízkou osobu ani konkrétní finanční situaci.
- Pokud činnost nemusí být dostupná každému, uvedeme rovnocennou alternativu.
- Nežádáme jména, telefonní čísla ani jiné osobní údaje.
- Pojem **nutkání hrát** má přednost před odborným pojmem „bažení“.



## Společné texty rozhraní



### Navigace a nadpisy


| Umístění        | Text               |
| --------------- | ------------------ |
| Spodní navigace | Strategie          |
| Hlavní nadpis   | Knihovna strategií |
| První záložka   | Knihovna           |
| Druhá záložka   | Kontakty           |
| Prioritní sekce | Vybrané            |
| Ostatní obsah   | Další strategie    |
| Správa skrytých | Skryté strategie   |




### Úvod knihovny

> Vyberte si kroky, které chcete mít po ruce. Můžete si je v klidné chvíli
> projít a později použít i bez otevření aplikace.



### Akce


| Situace                | Text akce                |
| ---------------------- | ------------------------ |
| Strategie není vybraná | Přidat do Vybraných      |
| Strategie je vybraná   | Odebrat z Vybraných      |
| Viditelná strategie    | Skrýt                    |
| Skrytá strategie       | Obnovit                  |
| Vlastní strategie      | Smazat                   |
| Nová vlastní strategie | Přidat vlastní strategii |
| Detail                 | Zpět do knihovny         |


Přístupný název třítečkového tlačítka:

> Další možnosti pro strategii „{název strategie}“



### Prázdné stavy

**Vybrané**

> Zatím tu nic nemáte. U další strategie otevřete nabídku a zvolte Přidat do
> Vybraných.

**Další strategie**

> Všechny viditelné strategie už máte ve Vybraných.

**Skryté strategie**

> Nemáte žádné skryté strategie.



### Chyby

**Uložení strategie**

> Strategii se nepodařilo uložit. Zkuste to prosím znovu.

**Načtení knihovny**

> Knihovnu se nepodařilo načíst. Zkuste to prosím znovu.

**Duplicitní název vlastní strategie**

> Strategie s tímto názvem už existuje. Zvolte prosím jiný název.



## Onboarding



### Úvod

**Nadpis**

> Co můžete udělat při nutkání hrát

**Text**

> Připravte si alespoň jeden konkrétní krok. Doporučujeme vybrat dvě až tři
> různé možnosti, abyste si později mohli zvolit podle situace.

**Validace bez výběru**

> Vyberte alespoň jednu strategii.



### Vlastní strategie

**Úvod**

> Můžete přidat až pět vlastních kroků. V onboardingu stačí krátký název; další
> podrobnosti lze doplnit později v knihovně.

**Pole**


| Pole                | Povinnost                  | Limit     | Nápověda                                        |
| ------------------- | -------------------------- | --------- | ----------------------------------------------- |
| Název               | Povinné                    | 80 znaků  | Např. „Zavolám někomu blízkému“                 |
| Kdy ji chci použít? | Volitelné, mimo onboarding | 240 znaků | Popište situaci, ve které se vám může hodit.    |
| Jak začnu?          | Volitelné, mimo onboarding | 240 znaků | Napište první malý krok, který lze udělat hned. |


**Upozornění u volného textu**

> Neuvádějte jména, telefonní čísla ani jiné osobní údaje.

**Ukazatel kapacity**

> {počet} z 5 vlastních strategií

**Dialog při pokusu o přidání šesté strategie**

Nadpis:

> Máte maximální počet vlastních strategií

Text:

> Můžete mít nejvýše pět vlastních strategií. Pokud chcete přidat další,
> nejprve některou ze svých strategií smažte.

Akce:

- Zobrazit moje strategie
- Zavřít



### Potvrzení smazání

**Nadpis**

> Smazat vlastní strategii?

**Text**

> Strategie „{název strategie}“ bude trvale smazána. Tuto akci nelze vrátit.

**Akce**

- Zrušit
- Smazat strategii



## Katalog strategií

Katalog obsahuje právě šest položek v uvedeném pořadí.

### 1. Na chvíli změním prostředí

- **Souhrn:** Vytvořím si krátký odstup od místa nebo zařízení spojeného s
hraním.
- **Co udělat:** Vytvořte si krátký odstup od místa nebo zařízení, kde můžete
hrát.
- **Proč to může pomoci:** Změna prostředí může přerušit automatické
pokračování a vytvořit čas před dalším rozhodnutím.
- **Jak na to:** Zavřete hru nebo sázkovou aplikaci. Odložte zařízení mimo dosah
nebo se přesuňte jinam, pokud je to možné a bezpečné. Potom si vyberte, co
uděláte během následujících několika minut.
- **Kdy se může hodit:** Když vás ke hraní přitahuje konkrétní místo, obrazovka
nebo situace.
- **Dostupná alternativa:** Pokud se nemůžete přesunout, změňte alespoň to, co
máte před sebou: zamkněte obrazovku, zavřete stránku nebo zařízení otočte
displejem dolů.



### 2. Ozvu se někomu, komu důvěřuji

- **Souhrn:** Navážu krátký kontakt a nezůstanu s nutkáním bez podpory.
- **Co udělat:** Ozvěte se člověku, se kterým se cítíte bezpečně.
- **Proč to může pomoci:** Krátký kontakt může snížit pocit, že na situaci
musíte být bez podpory, a vytvořit prostor před dalším hraním.
- **Jak na to:** Můžete napsat: „Mám teď nutkání hrát. Můžeme být chvíli v
kontaktu?“ Nemusíte vysvětlovat víc, než chcete.
- **Kdy se může hodit:** Když je těžké přerušit hraní bez podpory nebo když
nechcete zůstat se situací bez kontaktu.
- **Dostupná alternativa:** Pokud teď nemáte komu napsat nebo volat, můžete
využít některý z kontaktů na odbornou pomoc v aplikaci.



### 3. Nechám nutkání chvíli projít

- **Souhrn:** Všimnu si nutkání, ale nemusím podle něj hned jednat.
- **Co udělat:** Na chvíli nic nerozhodujte a všimněte si, co právě prožíváte.
- **Proč to může pomoci:** Nutkání se může v čase měnit. Krátké pozorování bez
okamžité reakce může vytvořit odstup mezi nutkáním a jednáním.
- **Jak na to:** Opřete chodidla o podlahu nebo vnímejte oporu těla. Zaměřte se
na několik klidných výdechů. Pojmenujte si, kde v těle nutkání vnímáte, aniž
by bylo nutné ho odstranit.
- **Kdy se může hodit:** Když cítíte tlak jednat okamžitě, ještě před zahájením
hraní.
- **Dostupná alternativa:** Pokud vám soustředění na dech není příjemné,
zaměřte pozornost na zvuky kolem sebe nebo na kontakt těla s podložkou.



### 4. Začnu jinou krátkou činnost

- **Souhrn:** Zaměřím pozornost na malý krok, se kterým lze začít hned.
- **Co udělat:** Vyberte si činnost, se kterou můžete začít během několika
minut.
- **Proč to může pomoci:** Jiná konkrétní činnost může odvést pozornost od
dostupného hraní a pomoci překlenout chvíli, kdy je nutkání silné.
- **Jak na to:** Zvolte jednu jednoduchou možnost: pusťte si hudbu, dejte si
sprchu, připravte si nápoj, vezměte do ruky jednoduchou práci nebo se hýbejte
způsobem, který je pro vás dostupný a bezpečný.
- **Kdy se může hodit:** Když máte volnou chvíli, kterou by jinak snadno
zaplnilo hraní.
- **Poznámka:** Nejde o výkon ani o splnění úkolu. Důležité je začít něčím, co
je právě proveditelné.



### 5. Připomenu si, co chci chránit

- **Souhrn:** Vrátím pozornost k tomu, proč chci mít hraní více pod kontrolou.
- **Co udělat:** Připomeňte si jeden osobní důvod, proč chcete hraní omezit.
- **Proč to může pomoci:** Osobně důležitý důvod může vyvážit pozornost, kterou
v dané chvíli přitahuje krátkodobá možnost hrát.
- **Jak na to:** Pojmenujte jednu konkrétní věc, pro kterou chcete chránit svůj
čas, peníze, vztahy, zdraví nebo klid. Vyberte jen to, co je důležité právě pro
vás.
- **Kdy se může hodit:** Když se hraní zdá v dané chvíli důležitější než jeho
pozdější dopady.
- **Poznámka:** Důvod nemá vyvolávat výčitky. Má připomenout, čemu chcete dát
přednost.



### 6. Znesnadním si přístup ke hraní

- **Souhrn:** Vytvořím mezi nutkáním a hraním praktickou překážku.
- **Co udělat:** Vyberte jeden krok, který vám přístup ke hraní ztíží.
- **Proč to může pomoci:** Když hraní není okamžitě dostupné, vzniká více času
a méně příležitostí pokračovat automaticky.
- **Jak na to:** Můžete se odhlásit, odebrat uloženou platební metodu, zapnout
blokaci hazardních stránek nebo využít některý z nástrojů sebevyloučení.
Vyberte krok, který je pro vás teď proveditelný.
- **Kdy se může hodit:** Když samotné odvedení pozornosti nestačí nebo chcete
snížit dostupnost hraní i pro další situace.
- **Poznámka:** Jde o ochranný krok, ne o test vůle. Jednotlivé možnosti mají
různé podmínky a délku trvání.



#### Možnosti omezení hraní

**Úvod bloku**

> Pokud si chcete přístup ke hraní omezit více, existují také oficiální možnosti
> sebevyloučení. Liší se délkou a způsobem aktivace. Aplikace je sama nezapíná.

**Přestávka na 48 hodin**

> Krátkodobé vyloučení z hraní, které lze aktivovat u provozovatele hazardních
> her. Po 48 hodinách automaticky skončí.

- Akce: **Jak funguje přestávka na 48 hodin**
- Odkaz:
`https://mf.gov.cz/cs/kontrola-a-regulace/hazardni-hry/rejstrik-vyloucenych-osob-rvo/pro-verejnost/dulezite-informace-k-panic-button`

**Dlouhodobější zápis do RVO**

> Dobrovolný zápis do Rejstříku vyloučených osob je na dobu neurčitou. O výmaz
> lze požádat nejdříve po jednom roce.

- Akce: **Zjistit více o RVO**
- Odkaz:
`https://portal.gov.cz/sluzby-vs/rejstrik-vyloucenych-osob-z-ucasti-na-hazardni-hre-S12888`



## Kontakty



### Úvod

**Nadpis**

> Chcete svou situaci s někým probrat?

**Text**

> Můžete se nezávazně obrátit na odbornou službu. Je na vás, zda a kdy kontakt
> využijete.



### Návrh kontaktních karet

Konkrétní služby, údaje, pořadí a odkazy musí před pilotem potvrdit NUDZ.

#### Centrum Naberte kurz

- **Účel:** Poradenství pro lidi, kteří chtějí své hraní omezit nebo o něm
mluvit s odborníkem.
- **Telefon:** +420 777 477 877
- **Telefonní akce:** `tel:+420777477877`
- **Web:** `https://www.nabertekurz.cz/`
- **Akce:** Zavolat · Otevřít web



#### Národní linka pro odvykání

- **Účel:** Telefonická podpora při omezování hazardního hraní.
- **Telefon:** 800 350 000
- **Dostupnost:** pondělí až pátek, 10:00–18:00
- **Telefonní akce:** `tel:800350000`
- **Akce:** Zavolat



#### Mapa pomoci

- **Účel:** Přehled odborných služeb podle místa a typu podpory.
- **Web:** `https://www.drogy-info.cz/mapa-pomoci/`
- **Akce:** Otevřít mapu pomoci

### Informace pro bezprostřední ohrožení

Tento blok je vizuálně nenápadný, oddělený a umístěný až pod běžnými
poradenskými kontakty.

> Pokud jste v bezprostředním ohrožení života nebo zdraví, volejte 112 nebo 155.
