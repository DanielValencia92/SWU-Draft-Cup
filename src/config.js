export const sets = [
  {
    slug: 'homeworlds',
    legacyPath: '/season09.html',
    name: 'Homeworlds',
    eyebrow: 'Current Season',
    pageClass: 'page-homeworlds',
    csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTPIYIqo6sZY59Lel6CIwP_EDuyLgF3zDznSVJKrYUr1HMRO5AMBXgsUOnI-N3wES-L9B_An0QlXTK2/pub?gid=0&single=true&output=csv',
    roster: 'csv',
    standingsMode: 'tiebreakers',
    maxDrafts: 5,
    countedDrafts: 4,
    tiebreakers: [
      { header: 'omw', label: 'OMW' },
      { header: 'tgw', label: 'TGW' },
      { header: 'reportedpods', label: 'Reported Pods' }
    ]
  },
  {
    slug: 'ashes-of-the-empire',
    legacyPath: '/index.html',
    name: 'Ashes of the Empire',
    eyebrow: 'Set Archive',
    pageClass: 'page-ashes',
    csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ00F_tYNwL63C2CjGX__uxtcVmDUZTf4HNTrJbz2lNTW86rT5ORKY82JhZyqvlNpR7o-DNWIzHNyTT/pub?gid=0&single=true&output=csv',
    roster: 'csv',
    standingsMode: 'tiebreakers',
    maxDrafts: 5
  },
  {
    slug: 'a-lawless-time',
    legacyPath: '/season07.html',
    name: 'A Lawless Time',
    eyebrow: 'Set Archive',
    pageClass: 'page-lawless',
    csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQh3w7D7JKnRMov5jy3JcsJbPq0gJmtMRxctqLbqIWT86_lfvrq8BRltANuoUEMuP3KIEDd1l7eb-_j/pub?gid=0&single=true&output=csv',
    roster: 'csv',
    standingsMode: 'tiebreakers'
  },
  {
    slug: 'secrets-of-power',
    legacyPath: '/season06.html',
    name: 'Secrets of Power',
    eyebrow: 'Set Archive',
    pageClass: 'page-secrets',
    csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQZ3Fpi9B2mItZ_g7WsPcrRC5nctqpSw9-qwtfOLfNWQvxUC6ZeQJ_wGEzfJkTuGvroYoPrLQffjOrH/pub?gid=0&single=true&output=csv',
    roster: 'csv',
    standingsMode: 'tiebreakers'
  },
  {
    slug: 'legends-of-the-force',
    legacyPath: '/season05.html',
    name: 'Legends of the Force',
    eyebrow: 'Set Archive',
    pageClass: 'page-legends',
    csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT_9Ez1bXXGojktQXJKTba0LF4We51_kJvgicaErQWSP1uDcez7OkzaeebN8UWxuhhT3bbzyKxwUVrC/pub?gid=0&single=true&output=csv',
    roster: 'csv',
    standingsMode: 'points'
  }
];

export const championsCsvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRJQGgLOqHF_hQOb1FERoz3y8BICFgd7dtax5WNOP1CU48lW9ICm9OEgsK_kcrWllFxCtZY-Cfw1AJy/pub?gid=0&single=true&output=csv';

export const defaultSet = sets.find(set => set.slug === 'homeworlds') || sets[0];
