import { type ContactEntity } from '@data/model.ts'

// Built-in help contacts for the "Kontakty" tab, from content.md § Kontakty (in
// display order). PROVISIONAL — services, numbers and links to be confirmed by NUDZ.
export const CONTACTS: readonly ContactEntity[] = [
  {
    contact_id: 'naberte_kurz',
    name: 'Centrum Naberte kurz',
    purpose: 'Poradenství pro lidi, kteří chtějí své hraní omezit nebo o něm mluvit s odborníkem.',
    phone: '+420777477877',
    url: 'https://www.nabertekurz.cz/',
    availability: null,
    category: 'counselling',
    priority: 1,
  },
  {
    contact_id: 'narodni_linka',
    name: 'Národní linka pro odvykání',
    purpose: 'Telefonická podpora při omezování hazardního hraní.',
    phone: '800350000',
    url: null,
    availability: 'pondělí až pátek, 10:00–18:00',
    category: 'counselling',
    priority: 2,
  },
  {
    contact_id: 'mapa_pomoci',
    name: 'Mapa pomoci',
    purpose: 'Přehled odborných služeb podle místa a typu podpory.',
    phone: null,
    url: 'https://www.drogy-info.cz/mapa-pomoci/',
    availability: null,
    category: 'counselling',
    priority: 3,
  },
  {
    contact_id: 'emergency_112',
    name: 'Tísňové volání',
    purpose: 'Bezprostřední ohrožení života nebo zdraví.',
    phone: '112',
    url: null,
    availability: null,
    category: 'emergency',
    priority: 4,
  },
  {
    contact_id: 'emergency_155',
    name: 'Zdravotnická záchranná služba',
    purpose: 'Bezprostřední ohrožení života nebo zdraví.',
    phone: '155',
    url: null,
    availability: null,
    category: 'emergency',
    priority: 5,
  },
]
