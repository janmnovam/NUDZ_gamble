**`DigiWELL Hackathon 2026`**

**`Cíl hackathonu:`** `Vyprodukovat funkční prototyp aplikace pro sebekontrolu nad hazardním hraním. (Doporučeně ve formátu progresivní webové aplikace, PWA)`

`Za dva dny má vzniknout funkční jádro aplikace, nikoliv mock up. Stačí jeden uživatel, lokální data a jedna kompletní smyčka: onboarding a nastavení limitů; denní check-in; automatická zpětná vazba; dashboard; další den (cyklus se opakuje); týdenní review. Logika digitální aplikace je popsána níže a nevymýšlíte ji znovu; prostor pro vlastní invence je především v architektuře a technickém provedení.`

`Aplikace je určena lidem mezi 18 a 34 lety, kteří chtějí získat lepší kontrolu nad svým hazardním hraním. Nenahrazuje odbornou léčbu ani krizovou pomoc.`

**`Priorita:`** `užší, spolehlivé a přímo rozšiřitelné řešení má přednost před větším množstvím funkcí, které nejsou dokončené nebo se budou obtížně upravovat.`

**`Logika & prvky`**

**`Referenční týden.`** `Uživatel zadá, kolik času (hodiny a minuty) obvykle věnuje hazardnímu hraní během jednoho týdne a jakou celkovou částku (Kč) za tento týden obvykle vsadí. Tyto údaje představují výchozí stav, s nímž aplikace porovnává údaje zaznamenávané prostřednictvím denních check-inů.`

**`Limity.`** `Aplikace automaticky navrhne 80 % reference pro čas i pro sázky. Uživatel může každý limit snížit nebo zvýšit, nejvýše však na 90 % příslušné referenční hodnoty. Výchozí hodnota 80 % a maximální hodnota 90 % budou definovány jako centrálně spravované konstanty. (Je-li reference nula, limit je nula, procenta se pak nezobrazují a jakákoli kladná hodnota znamená překročení.)`

**`Limit se váže na sázky, ne na výhry.`** `Finanční limit se vztahuje výhradně k celkové částce vsazené uživatelem, nikoli k výhrám ani k čisté finanční ztrátě. Důvod: výši sázek může uživatel přímo ovlivnit, zatímco výsledek hry nikoli. Výhry se zaznamenávají pouze pro výpočet čisté ztráty a nemají vliv na plnění finančního limitu.`

**`Denní check-in za předchozí den.`** `Výchozí otázka zní, jestli uživatel včera hrál. Pokud ne, uloží se nuly a záznam je platný. Pokud ano, zadá čas, sázky a výhry. Celé by to mělo trvat řádově 45 sekund.`

`(Uživatel tedy při běžném denním check-inu zadává údaje za předchozí kalendářní den. U každého záznamu se ukládá: behavior_date – datum dne, ke kterému se údaje vztahují; played – zda uživatel daný den hrál; submitted_at – skutečné datum a čas odeslání; případně updated_at – datum a čas poslední úpravy uživatelem.)`

`Za řádně a včas vyplněný se považuje check-in za předchozí kalendářní den, standardně odeslaný během následujícího dne. Pozdější odeslání se eviduje jako backfill.`

**`Chybějící den není den bez hraní.`** `Chybějící check-in neznamená den bez hraní (den bez hraní je platně vyplněný záznam s odpovědí „ne“ a nulovými hodnotami). Chybějící den je evidován jako nevyplněný údaj (NA). Aplikace proto uživatele na chybějící check-in upozorní: na dashboardu, kde zobrazí chybějící dny a nabídne jejich doplnění; prostřednictvím notifikace s výzvou ke zpětnému vyplnění.`

`Uživatel může zpětně doplnit check-in za kterýkoli dosud chybějící den aktuálního týdne. Check-iny za uzavřený týden již ale nelze doplňovat ani upravovat. Informace o tom, zda šlo o backfill, se uživateli nezobrazuje a nijak nemění způsob vyplňování.`

**`Stavy.`** `OK ≤ 80 %, POZOR > 80 % až ≤ 100 %, PŘEKROČENO > 100 %. Počítá se zvlášť pro čas a pro sázky, celkový stav odpovídá horšímu z obou, ale rozhraní vždy ukazuje obě hodnoty a kolik konkrétně zbývá. Chybí-li v týdnu záznam, dashboard to musí uvést. Procenta stavů se počítají z týdenního limitu, nikoli z reference.`

**`Copingová strategie.`** `V onboardingu si uživatel vybere alespoň jednu, například odejít na patnáct minut ven nebo někomu zavolat. Při stavu POZOR a PŘEKROČENO ji zpětná vazba připomene.`

**`Individuální týdny a review.`** `Osmadvacetidenní sebesledování se počítá individuálně. Dnem 1 je první celý kalendářní den následující po dokončení onboardingu; jeho datum se uloží jako intervention_start_date. Nejde o kalendářní týdny ani o klouzavých posledních sedm dní. Týden 1 tvoří dny 1–7, týden 2 dny 8–14, týden 3 dny 15–21 a týden 4 dny 22–28. Uživatelé nemusejí zahájit sebesledování ve stejný den ani v pondělí.`

**`Review po dnech 7, 14 a 21.`** `Po uplynutí dne 7, 14 a 21 aplikace nabídne review právě ukončeného týdne a nastavení obou limitů pro následující týden, opět nejvýše na 90 % původních referencí. Proto se například review prvního týdne standardně zpřístupní během dne 8, a to i tehdy, pokud check-in za 7. den chybí. Předchozí limity se nepřepisují; každý týden má vlastní historický záznam.`

`Pokud v ukončovaném týdnu chybějí check-iny, aplikace nejprve nabídne jejich doplnění. Uživatel může review dokončit i bez nich; review se pak uloží jako neúplné a týden se uzavře. Po uplynutí dne 28 se během dne 29 zpřístupní závěrečný souhrn bez nastavování limitů pro další týden; i zde musí být možné pokračovat při chybějících check-inech.`

**`Data a architektura`**

`Oddělte vrstvy: A) rozhraní, B) intervenční logika, C) data. Lokální úložiště stačí, musí však obsahovat možnost pro export a zaslání dat. V budoucnu by mělo jít vyměnit za server bez přepisování logiky.`

| `Vrstva` | `Minimální zdrojová pole` | `Poznámka` |
| :---- | :---- | :---- |
| `profil` | `user_id, onboarding_completed_at, intervention_start_date, reference_time_min, reference_stakes_czk, coping_strategy` | `Jeden demonstrační uživatel.` |
| `limit` | `week_no 1–4, weekly_limit_time_min, weekly_limit_stakes_czk, limit_set_at` | `Jeden historický záznam na týden.` |
| `check-in` | `behavior_date, played, submitted_at, updated_at, time_min, stakes_czk, winnings_czk` | `Backfill lze odvodit z behavior_date a submitted_at.` |
| `review` | `review_week_no, review_completed_at, limit_changed, incomplete` | `Uzavírá příslušný týden.` |

`Průběžné čerpání, čistá ztráta, týdenní součty a celkový stav se neukládají, počítají se ze zdrojových záznamů a historie limitů.` 

**`Co musí fungovat`**

`Porota to musí proklikat na telefonu bez zásahu do kódu.`

`– onboarding: referenční týden, návrh limitů, úprava v povoleném rozsahu, výběr copingové strategie`

`– denní check-in včetně zpětného doplnění dnů aktuálního týdne`

`– kumulativní vyhodnocení týdne vůči oběma limitům a okamžitá zpětná vazba se zbytkem času a částky`

`– dashboard: limity, průběh týdne, procento využití, chybějící data`

`– review po dnech 7, 14 a 21 se změnou limitu a závěrečný souhrn po dni 28`

`– jeden funkční scénář připomenutí s proklikem do check-inu; trigger může být zjednodušený, ale uveďte to v README`

`– aplikace běžící na mobilu (doporučeně PWA), data přežijí refresh`

`– export dat (alespoň v .CSV) na úrovni osobo-dnů`

`– automatické testy: návrh finančních a časových limitů 80 % referenčního týdne, strop finančních a časových limitů 90 % referenčního týdne, tři stavy a alespoň jeden případ s chybějícím záznamem`

`Referenční scénář, který budeme chtít vidět na vašich seed datech: reference 600 minut (10 hodin) a 10 000 Kč, návrh 480 minut (8 hodin) a 8 000 Kč, strop úprav 540 minut (9 hodin) a 9 000. Při průběžných 350 minutách (5 hodin 50 minut) a 6 500 Kč vychází čas 73 % (OK), sázky 81 % (POZOR) a celkově POZOR.`

**`Volitelné a mimo zadání`**

`Pokud bude jádro aplikace stabilní a plně funkční, můžete doplnit například: graf zobrazující údaje za posledních sedm odehraných dní; možnost načíst rozhraní aplikace offline; strukturované zadávání, správu a sledování hraní podle typu hry a/nebo poskytovatele služeb („sázkové společnosti“). Tyto funkce jsou pouze bonusové a nejsou podmínkou splnění zadání. Prioritou je menší, spolehlivé a plně funkční řešení. Bonusové funkce nemohou kompenzovat nefunkční nebo nedokončené jádro aplikace.`

**`Licence a cizí kód`**

`Výstup plánujeme zveřejnit jako open source pod licencí MIT. Pravidlo je jediné: cokoli do projektu vložíte, musí jít pod MIT legálně vydat.`

* **`Váš kód odevzdáváte pod MIT`** `(řeší účastnická smlouva), v kořeni repozitáře je soubor LICENSE.`  
* **`Knihovny jen s permisivní licencí:`** `MIT, BSD, ISC, Apache 2.0, zlib, CC0. Nepoužívejte GPL, AGPL ani LGPL a nic se share-alike nebo non-commercial doložkou (například CC BY-SA nebo CC BY-NC).`  
* **`Kód z internetu:`** `útržky ze Stack Overflow jsou pod CC BY-SA, tedy share-alike. Nekopírujte je doslova, přepište je vlastními slovy.`  
* **`AI asistenti jsou povoleni.`** `Za vygenerovaný kód ručíte dle nejlepšího vědomí a svědomí a při odevzdání uvedete, které nástroje jste použili.`  
* **`Vlastní starší kód`** `jen tehdy, je-li permisivně licencovaný. Firemní a proprietární kód do projektu nevnášejte.`  
* **`Grafika, fonty, ikony a zvuky:`** `CC0, volně licencované nebo vlastní. U CC BY dodržte atribuci.`  
* **`Původní licenční hlavičky`** `v převzatém kódu zachovejte a přehled závislostí s jejich licencemi uveďte v README.`  
* **`Do repozitáře nepatří`** `neveřejné klíče, osobní údaje ani produkční přístupové údaje.`

*`Když si licencí nejste jistí, zeptejte se nás dřív, než komponentu nasadíte.`*

**`Odevzdání a hodnocení`**

`Odevzdáváte repozitář se čitelnou historií; běžící aplikaci nebo reprodukovatelný build podle README; popis architektury a datového modelu, testy; přehled toho, co je hotové a co jste vědomě vynechali; známá omezení a technický dluh; návrh toho, co dodělat před pilotem; seed data pro referenční scénář a krátké živé demo.`

`Aplikace musí obsahovat seed data, reset nebo demonstrační režim, který porotě umožní bez zásahu do kódu ověřit chybějící den, backfill, týdenní review a závěrečný souhrn, aniž by bylo nutné čekat na skutečné uplynutí 28 dnů.`

**`Přílohy`**

`Příloha 1:	Průběžný program`   
`Příloha 2:	Minimální specifikace exportu dat`

`Národní ústav duševního zdraví, projekt DigiWELL, CZ.02.01.01/00/22_008/0004583, OP Jan Amos Komenský`

**`Příloha 1:	Průběžný program`**

**`První den – funkční základ`**

`8:30–9:00 	registrace`

`9:00–9:30 	představení zadání: povinná uživatelská smyčka, referenční scénář, způsob odevzdání a hodnocení`

`9:30–10:00 	dotazy a potvrzení rozsahu řešení`

`10:00–12:00 	začátek vývoje (vývoj v pořadí onboarding → limity → check-in → zpětná vazba → dashboard, včetně lokálního ukládání)`

`12:00–12:45 	oběd`

`12:45–13:00 	checkpoint k rozsahu a architektuře (5-8 minut na tým): technologie, datový model, způsob simulace dnů/seed dat a hlavní rizika`

`13:00–17:30 	pokračování vývoje`

`17:30–18:00 	checkpoint k prvnímu funkčnímu průchodu aplikací (15 minut na tým): zadání reference → nastavení limitů → jeden denní check-in → zpětná vazba a dashboard`

**`Druhý den – dokončení a stabilizace`**

`9:00–11:30 	pokračování vývoje`

`11:30–12:00 	kontrola povinného funkčního jádra a ukončení vývoje nových funkcí; zbývající čas je určen pouze pro opravy, stabilizaci, dokumentaci a přípravu dema.`

`12:00–12:45 	oběd`

`12:45–13:30 	testování na telefonu, opravy, seed data, README, kontrola licencí a příprava dema`

`13:30–14:30 	uzavření kódu a odevzdání`

`14:30–15:00 	technická kontrola odevzdaných řešení porotou a příprava týmů na demo`

`15:00–15:50 	prezentace obou týmů: nejvýše 15 minut demo a 10 minut dotazy na tým`

`15:50–16:30 	hodnocení poroty`

`16:30–17:00 	výsledky, zpětná vazba a ukončení`

`Národní ústav duševního zdraví, projekt DigiWELL, CZ.02.01.01/00/22_008/0004583, OP Jan Amos Komenský`

**`Příloha 2:	Minimální specifikace exportu dat`** 

**`Export dat`**

`Export musí být uživatelsky spustitelný přímo z aplikace a vytvořit nejméně jeden CSV soubor se stabilními názvy sloupců. Data musí být v úrovni osobo-dnů: jeden řádek pro každý plánovaný den 1–28 demonstračního uživatele, včetně dní bez hraní a dní bez odeslaného check-inu.`

**`Minimální pole:`** `user_id, intervention_start_date, study_day, week_no, behavior_date, checkin_status, played, time_min, stakes_czk, winnings_czk, submitted_at, updated_at, is_backfill.`

`checkin_status nabývá hodnot completed a missing. U záznamu se stavem completed má pole is_backfill hodnotu true, pokud byl check-in doplněn později, a false, pokud byl odeslán včas. U záznamu se stavem missing zůstává is_backfill prázdné nebo je jednotně označeno jako NA.`  
`Pro platně vyplněný den bez hraní je checkin_status = completed, played = false a hodnoty time_min, stakes_czk a winnings_czk jsou nulové. Pro missing zůstávají played, time_min, stakes_czk, winnings_czk, submitted_at, updated_at a is_backfill prázdné nebo jednotně označené jako NA; nesmějí být nahrazeny nulami.` 

`Doporučené konvence: UTF-8; datum YYYY-MM-DD; časové okamžiky ISO 8601 včetně časové zóny; time_min jako celé minuty; částky v celých Kč; desetinný oddělovač a oddělovač CSV musí být popsány v README. Mechanismus stažení/uložení souboru je ponechán na platformě a týmu.`

`Příklad (výřez vybraných polí):`

| `user_id` | `study_day` | `week_no` | `behavior_date` | `checkin_status` | `is_backfill` | `played` | `time_min` | `stakes_czk` |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| `A001` | `1` | `1` | `2026-09-01` | `completed` | `false` | `false` | `0` | `0` |
| `A001` | `2` | `1` | `2026-09-02` | `missing` | `NA` |  |  |  |
| `A001` | `3` | `1` | `2026-09-03` | `completed` | `true` | `true` | `60` | `500` |

`Národní ústav duševního zdraví, projekt DigiWELL, CZ.02.01.01/00/22_008/0004583, OP Jan Amos Komenský`

