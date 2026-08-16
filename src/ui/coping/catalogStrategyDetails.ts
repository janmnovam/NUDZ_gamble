import type { CopingStrategyDto, CopingSuggestionDto } from '@/app/dto/coping.ts'
import type { CatalogStrategyDetail } from '@ui/coping/CatalogStrategyDetailScreen.tsx'

type CatalogStrategyDetailContent = Omit<CatalogStrategyDetail, 'id'>

interface CatalogStrategyPresentation {
  title: string
  summary: string
}

const LEGACY_LABEL_BY_CODE: Readonly<Record<string, string>> = {
  change_environment: 'Na chvíli změním prostředí',
  reach_out: 'Ozvu se někomu, komu důvěřuji',
  let_urge_pass: 'Nechám nutkání chvíli projít',
  start_small_activity: 'Začnu jinou krátkou činnost',
  remember_why: 'Připomenu si, co chci chránit',
  reduce_access: 'Znesnadním si přístup ke hraní',
}

const CATALOG_STRATEGY_DETAIL_CONTENT: Readonly<Record<string, CatalogStrategyDetailContent>> = {
  change_environment: {
    title: 'Na chvíli odejdu od hraní',
    whatToDo: 'Vytvořte si krátký odstup od místa nebo zařízení, kde můžete hrát.',
    whyItCanHelp:
      'Změna prostředí může přerušit automatické pokračování a vytvořit čas před dalším rozhodnutím.',
    howTo:
      'Zavřete hru nebo sázkovou aplikaci. Odložte zařízení mimo dosah nebo se přesuňte jinam, pokud je to možné a bezpečné. Potom si vyberte, co uděláte během následujících několika minut.',
    whenUseful: 'Když vás ke hraní přitahuje konkrétní místo, obrazovka nebo situace.',
    noteLabel: 'DOSTUPNÁ ALTERNATIVA',
    note: 'Pokud se nemůžete přesunout, změňte alespoň to, co máte před sebou: zamkněte obrazovku, zavřete stránku nebo zařízení otočte displejem dolů.',
  },
  reach_out: {
    title: 'Ozvu se někomu, komu důvěřuji',
    whatToDo: 'Ozvěte se člověku, se kterým se cítíte bezpečně.',
    whyItCanHelp:
      'Krátký kontakt může snížit pocit, že na situaci musíte být bez podpory, a vytvořit prostor před dalším hraním.',
    howTo:
      'Můžete napsat: „Mám teď nutkání hrát. Můžeme být chvíli v kontaktu?“ Nemusíte vysvětlovat víc, než chcete.',
    whenUseful:
      'Když je těžké přerušit hraní bez podpory nebo když nechcete zůstat se situací bez kontaktu.',
    noteLabel: 'DOSTUPNÁ ALTERNATIVA',
    note: 'Pokud teď nemáte komu napsat nebo volat, můžete využít některý z kontaktů na odbornou pomoc v aplikaci.',
  },
  let_urge_pass: {
    title: 'S rozhodnutím chvíli počkám',
    whatToDo: 'Na chvíli nic nerozhodujte a všimněte si, co právě prožíváte.',
    whyItCanHelp:
      'Nutkání se může v čase měnit. Krátké pozorování bez okamžité reakce může vytvořit odstup mezi nutkáním a jednáním.',
    howTo:
      'Opřete chodidla o podlahu nebo vnímejte oporu těla. Zaměřte se na několik klidných výdechů. Pojmenujte si, kde v těle nutkání vnímáte, aniž by bylo nutné ho odstranit.',
    whenUseful: 'Když cítíte tlak jednat okamžitě, ještě před zahájením hraní.',
    noteLabel: 'DOSTUPNÁ ALTERNATIVA',
    note: 'Pokud vám soustředění na dech není příjemné, zaměřte pozornost na zvuky kolem sebe nebo na kontakt těla s podložkou.',
  },
  start_small_activity: {
    title: 'Pustím se do něčeho jiného',
    whatToDo: 'Vyberte si činnost, se kterou můžete začít během několika minut.',
    whyItCanHelp:
      'Jiná konkrétní činnost může odvést pozornost od dostupného hraní a pomoci překlenout chvíli, kdy je nutkání silné.',
    howTo:
      'Zvolte jednu jednoduchou možnost: pusťte si hudbu, dejte si sprchu, připravte si nápoj, vezměte do ruky jednoduchou práci nebo se hýbejte způsobem, který je pro vás dostupný a bezpečný.',
    whenUseful: 'Když máte volnou chvíli, kterou by jinak snadno zaplnilo hraní.',
    note: 'Nejde o výkon ani o splnění úkolu. Důležité je začít něčím, co je právě proveditelné.',
  },
  remember_why: {
    title: 'Připomenu si, proč chci hrát méně',
    whatToDo: 'Připomeňte si jeden osobní důvod, proč chcete hraní omezit.',
    whyItCanHelp:
      'Osobně důležitý důvod může vyvážit pozornost, kterou v dané chvíli přitahuje krátkodobá možnost hrát.',
    howTo:
      'Pojmenujte jednu konkrétní věc, pro kterou chcete chránit svůj čas, peníze, vztahy, zdraví nebo klid. Vyberte jen to, co je důležité právě pro vás.',
    whenUseful: 'Když se hraní zdá v dané chvíli důležitější než jeho pozdější dopady.',
    note: 'Důvod nemá vyvolávat výčitky. Má připomenout, čemu chcete dát přednost.',
  },
  reduce_access: {
    title: 'Omezím si přístup ke hraní',
    whatToDo: 'Vyberte jeden krok, který vám přístup ke hraní ztíží.',
    whyItCanHelp:
      'Když hraní není okamžitě dostupné, vzniká více času a méně příležitostí pokračovat automaticky.',
    howTo:
      'Můžete se odhlásit, odebrat uloženou platební metodu, zapnout blokaci hazardních stránek nebo využít některý z nástrojů sebevyloučení. Vyberte krok, který je pro vás teď proveditelný.',
    whenUseful:
      'Když samotné odvedení pozornosti nestačí nebo chcete snížit dostupnost hraní i pro další situace.',
    note: 'Jde o ochranný krok, ne o test vůle. Jednotlivé možnosti mají různé podmínky a délku trvání.',
    restrictionOptions: {
      intro:
        'Pokud si chcete přístup ke hraní omezit více, existují také oficiální možnosti sebevyloučení. Liší se délkou a způsobem aktivace. Aplikace je sama nezapíná.',
      items: [
        {
          id: 'pause-48-hours',
          title: 'Přestávka na 48 hodin',
          description:
            'Krátkodobé vyloučení z hraní, které lze aktivovat u provozovatele hazardních her. Po 48 hodinách automaticky skončí.',
          linkLabel: 'Jak funguje přestávka na 48 hodin',
          href: 'https://mf.gov.cz/cs/kontrola-a-regulace/hazardni-hry/rejstrik-vyloucenych-osob-rvo/pro-verejnost/dulezite-informace-k-panic-button',
        },
        {
          id: 'voluntary-rvo',
          title: 'Dlouhodobější zápis do RVO',
          description:
            'Dobrovolný zápis do Rejstříku vyloučených osob je na dobu neurčitou. O výmaz lze požádat nejdříve po jednom roce.',
          linkLabel: 'Zjistit více o RVO',
          href: 'https://portal.gov.cz/sluzby-vs/rejstrik-vyloucenych-osob-z-ucasti-na-hazardni-hre-S12888',
        },
      ],
    },
  },
}

function labelsForSuggestion(suggestion: CopingSuggestionDto): string[] {
  const legacyLabel = LEGACY_LABEL_BY_CODE[suggestion.id]
  return legacyLabel === undefined || legacyLabel === suggestion.label
    ? [suggestion.label]
    : [suggestion.label, legacyLabel]
}

/** Current Figma copy, also keyed by legacy labels already persisted on devices. */
export function buildCatalogStrategyPresentation(
  suggestions: readonly CopingSuggestionDto[],
): ReadonlyMap<string, CatalogStrategyPresentation> {
  const presentationByLabel = new Map<string, CatalogStrategyPresentation>()

  for (const suggestion of suggestions) {
    const presentation = {
      title: suggestion.label,
      summary: suggestion.summary ?? '',
    }
    for (const label of labelsForSuggestion(suggestion)) {
      presentationByLabel.set(label, presentation)
    }
  }

  return presentationByLabel
}

/**
 * Joins stable catalogue codes from `getSuggestions` with the per-user ids
 * returned by `list`. The current persisted row keeps the catalogue label but
 * not its code, so the service-provided label is the join key at this boundary.
 */
export function buildCatalogStrategyDetails(
  strategies: readonly CopingStrategyDto[],
  suggestions: readonly CopingSuggestionDto[],
): CatalogStrategyDetail[] {
  const contentByLabel = new Map<string, CatalogStrategyDetailContent>()

  for (const suggestion of suggestions) {
    const content = CATALOG_STRATEGY_DETAIL_CONTENT[suggestion.id]
    if (content !== undefined) {
      for (const label of labelsForSuggestion(suggestion)) {
        contentByLabel.set(label, content)
      }
    }
  }

  return strategies.flatMap((strategy) => {
    if (strategy.type !== 'default') return []

    const content = contentByLabel.get(strategy.label)
    return content === undefined ? [] : [{ id: strategy.id, ...content }]
  })
}
