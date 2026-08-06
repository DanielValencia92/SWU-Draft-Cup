const meleeHeaders = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8'
};

export default async request => {
  const tournamentId = new URL(request.url).searchParams.get('tournamentId');
  if (!/^\d+$/.test(tournamentId || '')) return Response.json({ error: 'A valid numeric tournament ID is required.' }, { status: 400 });
  try {
    const tournamentResponse = await fetch(`https://melee.gg/Tournament/View/${tournamentId}`, { headers: meleeHeaders });
    if (!tournamentResponse.ok) throw new Error(`Melee.gg tournament request failed with HTTP ${tournamentResponse.status}`);
    const html = await tournamentResponse.text();
    const roundIds = [...html.matchAll(/<button(?=[^>]*\bround-selector\b)(?=[^>]*\bdata-id=["'](\d+)["'])[^>]*>/gi)].map(match => match[1]);
    if (!roundIds.length) throw new Error('Could not find the tournament round selector. The event may not have published standings yet.');
    const response = await fetch('https://melee.gg/Standing/GetRoundStandings', {
      method: 'POST',
      headers: { ...meleeHeaders, 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' },
      body: createStandingsForm(roundIds.at(-1)).toString()
    });
    if (!response.ok) throw new Error(`Melee.gg standings request failed with HTTP ${response.status}`);
    const standings = await response.json();
    return Response.json({ data: standings.data || [] });
  } catch (error) {
    console.error('Tournament parser error:', error);
    return Response.json({ error: error.message || 'Unable to load tournament standings.' }, { status: 502 });
  }
};

function createStandingsForm(roundId) {
  const form = new URLSearchParams({ draw: '1', start: '0', length: '1000', 'search[value]': '', 'search[regex]': 'false', 'order[0][column]': '0', 'order[0][dir]': 'asc', roundId });
  const columns = [['Rank', true, true], ['Player', false, false], ['MatchRecord', false, false], ['GameRecord', false, false], ['MatchWinPercentage', false, false], ['OpponentMatchWinPercentage', false, false], ['GameWinPercentage', false, false], ['OpponentGameWinPercentage', false, false]];
  columns.forEach(([data, searchable, orderable], index) => {
    form.set(`columns[${index}][data]`, data); form.set(`columns[${index}][name]`, data);
    form.set(`columns[${index}][searchable]`, String(searchable)); form.set(`columns[${index}][orderable]`, String(orderable));
    form.set(`columns[${index}][search][value]`, ''); form.set(`columns[${index}][search][regex]`, 'false');
  });
  return form;
}
