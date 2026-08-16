import { type CopingStrategyDefaultEntity } from '@data/model.ts'

// Catalog ("default") coping strategies, in the order and wording from Figma.
// `code` is a stable id (renaming = migration). PROVISIONAL — confirm with NUDZ.
// Detail fields (title..restriction_options) back the catalog strategy detail
// screen (`src/ui/coping/CatalogStrategyDetailScreen.tsx`) — copy transcribed
// verbatim from `tasks/coping-strategie/content.md`.
export const COPING_STRATEGY_DEFAULTS: readonly CopingStrategyDefaultEntity[] = [
  {
    code: 'change_environment',
    label: 'Na chvíli odejdu od hraní',
    priority: 1,
    reminder_text: 'Zavřu stránku nebo aplikaci, odložím zařízení nebo se přesunu jinam.',
    title: 'Na chvíli odejdu od hraní',
    what_to_do: 'Vytvořte si krátký odstup od místa nebo zařízení, kde můžete hrát.',
    why_it_can_help:
      'Změna prostředí může přerušit automatické pokračování a vytvořit čas před dalším rozhodnutím.',
    how_to:
      'Zavřete hru nebo sázkovou aplikaci. Odložte zařízení mimo dosah nebo se přesuňte jinam, pokud je to možné a bezpečné. Potom si vyberte, co uděláte během následujících několika minut.',
    when_useful: 'Když vás ke hraní přitahuje konkrétní místo, obrazovka nebo situace.',
    note_label: 'DOSTUPNÁ ALTERNATIVA',
    note: 'Pokud se nemůžete přesunout, změňte alespoň to, co máte před sebou: zamkněte obrazovku, zavřete stránku nebo zařízení otočte displejem dolů.',
  },
  {
    code: 'reach_out',
    label: 'Ozvu se někomu, komu důvěřuji',
    priority: 2,
    reminder_text: 'Ozvu se člověku, se kterým se cítím bezpečně a nemusím mu všechno vysvětlovat.',
    title: 'Ozvu se někomu, komu důvěřuji',
    what_to_do: 'Ozvěte se člověku, se kterým se cítíte bezpečně.',
    why_it_can_help:
      'Krátký kontakt může snížit pocit, že na situaci musíte být bez podpory, a vytvořit prostor před dalším hraním.',
    how_to:
      'Můžete napsat: „Mám teď nutkání hrát. Můžeme být chvíli v kontaktu?“ Nemusíte vysvětlovat víc, než chcete.',
    when_useful:
      'Když je těžké přerušit hraní bez podpory nebo když nechcete zůstat se situací bez kontaktu.',
    note_label: 'DOSTUPNÁ ALTERNATIVA',
    note: 'Pokud teď nemáte komu napsat nebo volat, můžete využít některý z kontaktů na odbornou pomoc v aplikaci.',
  },
  {
    code: 'let_urge_pass',
    label: 'S rozhodnutím chvíli počkám',
    priority: 3,
    reminder_text: 'Dám si deset minut, během kterých nemusím nic rozhodovat.',
    title: 'S rozhodnutím chvíli počkám',
    what_to_do: 'Na chvíli nic nerozhodujte a všimněte si, co právě prožíváte.',
    why_it_can_help:
      'Nutkání se může v čase měnit. Krátké pozorování bez okamžité reakce může vytvořit odstup mezi nutkáním a jednáním.',
    how_to:
      'Opřete chodidla o podlahu nebo vnímejte oporu těla. Zaměřte se na několik klidných výdechů. Pojmenujte si, kde v těle nutkání vnímáte, aniž by bylo nutné ho odstranit.',
    when_useful: 'Když cítíte tlak jednat okamžitě, ještě před zahájením hraní.',
    note_label: 'DOSTUPNÁ ALTERNATIVA',
    note: 'Pokud vám soustředění na dech není příjemné, zaměřte pozornost na zvuky kolem sebe nebo na kontakt těla s podložkou.',
  },
  {
    code: 'start_small_activity',
    label: 'Pustím se do něčeho jiného',
    priority: 4,
    reminder_text: 'Vrátím pozornost k tomu, co je pro mě důležité a proč chci hraní omezit.',
    title: 'Pustím se do něčeho jiného',
    what_to_do: 'Vyberte si činnost, se kterou můžete začít během několika minut.',
    why_it_can_help:
      'Jiná konkrétní činnost může odvést pozornost od dostupného hraní a pomoci překlenout chvíli, kdy je nutkání silné.',
    how_to:
      'Zvolte jednu jednoduchou možnost: pusťte si hudbu, dejte si sprchu, připravte si nápoj, vezměte do ruky jednoduchou práci nebo se hýbejte způsobem, který je pro vás dostupný a bezpečný.',
    when_useful: 'Když máte volnou chvíli, kterou by jinak snadno zaplnilo hraní.',
    note: 'Nejde o výkon ani o splnění úkolu. Důležité je začít něčím, co je právě proveditelné.',
  },
  {
    code: 'remember_why',
    label: 'Připomenu si, proč chci hrát méně',
    priority: 5,
    reminder_text: 'Vrátím pozornost k tomu, co je pro mě důležité a proč chci hraní omezit.',
    title: 'Připomenu si, proč chci hrát méně',
    what_to_do: 'Připomeňte si jeden osobní důvod, proč chcete hraní omezit.',
    why_it_can_help:
      'Osobně důležitý důvod může vyvážit pozornost, kterou v dané chvíli přitahuje krátkodobá možnost hrát.',
    how_to:
      'Pojmenujte jednu konkrétní věc, pro kterou chcete chránit svůj čas, peníze, vztahy, zdraví nebo klid. Vyberte jen to, co je důležité právě pro vás.',
    when_useful: 'Když se hraní zdá v dané chvíli důležitější než jeho pozdější dopady.',
    note: 'Důvod nemá vyvolávat výčitky. Má připomenout, čemu chcete dát přednost.',
  },
  {
    code: 'reduce_access',
    label: 'Omezím si přístup ke hraní',
    priority: 6,
    reminder_text: 'Odhlásím se, odstraním uloženou platbu nebo využiju blokaci či sebevyloučení.',
    title: 'Omezím si přístup ke hraní',
    what_to_do: 'Vyberte jeden krok, který vám přístup ke hraní ztíží.',
    why_it_can_help:
      'Když hraní není okamžitě dostupné, vzniká více času a méně příležitostí pokračovat automaticky.',
    how_to:
      'Můžete se odhlásit, odebrat uloženou platební metodu, zapnout blokaci hazardních stránek nebo využít některý z nástrojů sebevyloučení. Vyberte krok, který je pro vás teď proveditelný.',
    when_useful:
      'Když samotné odvedení pozornosti nestačí nebo chcete snížit dostupnost hraní i pro další situace.',
    note: 'Jde o ochranný krok, ne o test vůle. Jednotlivé možnosti mají různé podmínky a délku trvání.',
    restriction_options: {
      intro:
        'Pokud si chcete přístup ke hraní omezit více, existují také oficiální možnosti sebevyloučení. Liší se délkou a způsobem aktivace. Aplikace je sama nezapíná.',
      items: [
        {
          id: 'pause-48-hours',
          title: 'Přestávka na 48 hodin',
          description:
            'Krátkodobé vyloučení z hraní, které lze aktivovat u provozovatele hazardních her. Po 48 hodinách automaticky skončí.',
          link_label: 'Jak funguje přestávka na 48 hodin',
          href: 'https://mf.gov.cz/cs/kontrola-a-regulace/hazardni-hry/rejstrik-vyloucenych-osob-rvo/pro-verejnost/dulezite-informace-k-panic-button',
        },
        {
          id: 'voluntary-rvo',
          title: 'Dlouhodobější zápis do RVO',
          description:
            'Dobrovolný zápis do Rejstříku vyloučených osob je na dobu neurčitou. O výmaz lze požádat nejdříve po jednom roce.',
          link_label: 'Zjistit více o RVO',
          href: 'https://portal.gov.cz/sluzby-vs/rejstrik-vyloucenych-osob-z-ucasti-na-hazardni-hre-S12888',
        },
      ],
    },
  },
]
