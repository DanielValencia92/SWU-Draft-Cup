import React, { Component, useEffect, useMemo, useState } from 'react';
import { championsCsvUrl, defaultSet, sets } from './config.js';
import { getHeaderIndex, getOptionalHeaderIndex, normalizeHeader, parseCSV } from './csv.js';

const routes = {
  standings: 'standings',
  champions: 'champions',
  rules: 'rules'
};

function routeFromLocation() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  const legacySet = sets.find(set => set.legacyPath === path);

  if (legacySet) {
    return { page: routes.standings, setSlug: legacySet.slug };
  }

  if (path === '/' || path === '/index.html') {
    return { page: routes.standings, setSlug: defaultSet.slug };
  }

  if (path === '/winners.html' || path === '/champions') {
    return { page: routes.champions };
  }

  if (path === '/rules.html' || path === '/rules') {
    return { page: routes.rules };
  }

  const standingsMatch = path.match(/^\/standings\/([^/]+)$/);
  if (standingsMatch) {
    const set = sets.find(item => item.slug === standingsMatch[1]);
    return { page: routes.standings, setSlug: set ? set.slug : defaultSet.slug };
  }

  return { page: routes.standings, setSlug: defaultSet.slug };
}

function pathFor(route) {
  if (route.page === routes.champions) {
    return '/champions';
  }
  if (route.page === routes.rules) {
    return '/rules';
  }
  return `/standings/${route.setSlug || defaultSet.slug}`;
}

function App() {
  const [route, setRoute] = useState(routeFromLocation);

  const currentSet = useMemo(
    () => sets.find(set => set.slug === route.setSlug) || defaultSet,
    [route.setSlug]
  );

  const pageClass = route.page === routes.standings
    ? currentSet.pageClass
    : route.page === routes.champions
      ? 'page-champions'
      : 'page-rules';

  useEffect(() => {
    document.body.className = pageClass;
  }, [pageClass]);

  useEffect(() => {
    const onPopState = () => setRoute(routeFromLocation());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const title = route.page === routes.champions
      ? 'SWU Draft Cup - Hall of Champions'
      : route.page === routes.rules
        ? 'SWU Draft Cup - Rules'
        : `SWU Draft Cup Standings - ${currentSet.name}`;
    document.title = title;
  }, [currentSet.name, route.page]);

  const navigate = nextRoute => {
    const nextPath = pathFor(nextRoute);
    window.history.pushState({}, '', nextPath);
    setRoute(nextRoute);
  };

  return (
    <ErrorBoundary>
      <div className="site-shell">
        <SiteHeader activePage={route.page} navigate={navigate} />
        <main>
          {route.page === routes.champions && <ChampionsPage />}
          {route.page === routes.rules && <RulesPage />}
          {route.page === routes.standings && (
            <StandingsPage currentSet={currentSet} navigate={navigate} />
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error('App render error:', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="site-shell">
          <section className="surface app-error">
            <h1>Something went wrong</h1>
            <p>{this.state.error.message}</p>
          </section>
        </div>
      );
    }

    return this.props.children;
  }
}

function SiteHeader({ activePage, navigate }) {
  return (
    <header className="site-header">
      <a
        className="brand"
        href={pathFor({ page: routes.standings, setSlug: defaultSet.slug })}
        onClick={event => {
          event.preventDefault();
          navigate({ page: routes.standings, setSlug: defaultSet.slug });
        }}
      >
        <span className="brand-mark">SWU</span>
        <span>Draft Cup</span>
      </a>
      <nav className="primary-nav" aria-label="Primary navigation">
        <NavLink
          active={activePage === routes.standings}
          href={pathFor({ page: routes.standings, setSlug: defaultSet.slug })}
          onClick={() => navigate({ page: routes.standings, setSlug: defaultSet.slug })}
        >
          Standings
        </NavLink>
        <NavLink
          active={activePage === routes.champions}
          href={pathFor({ page: routes.champions })}
          onClick={() => navigate({ page: routes.champions })}
        >
          Champions
        </NavLink>
        <NavLink
          active={activePage === routes.rules}
          href={pathFor({ page: routes.rules })}
          onClick={() => navigate({ page: routes.rules })}
        >
          Rules
        </NavLink>
      </nav>
    </header>
  );
}

function NavLink({ active, children, href, onClick }) {
  return (
    <a
      className={active ? 'nav-link active' : 'nav-link'}
      href={href}
      onClick={event => {
        event.preventDefault();
        onClick();
      }}
    >
      {children}
    </a>
  );
}

function StandingsPage({ currentSet, navigate }) {
  const rosterPending = currentSet.roster === 'TBD';
  const { rows, headers, loading, error } = useCsvData(currentSet.csvUrl, 30000, !rosterPending);
  const normalizedHeaders = useMemo(() => headers.map(normalizeHeader), [headers]);

  const sortedRows = useMemo(() => {
    if (!headers.length) {
      return [];
    }

    const pointsIndex = normalizedHeaders.findIndex(header => header === 'points');
    const mmwrIndex = normalizedHeaders.findIndex(header => header === 'mmwr');
    const oppAvgMmwrIndex = normalizedHeaders.findIndex(header => header === 'oppavermmwr');
    const sorted = [...rows];

    sorted.sort((a, b) => {
      const pointsA = parseInt(a[pointsIndex] || 0, 10);
      const pointsB = parseInt(b[pointsIndex] || 0, 10);

      if (pointsB !== pointsA || currentSet.standingsMode === 'points') {
        return pointsB - pointsA;
      }

      const mmwrA = parseFloat(a[mmwrIndex] || 0);
      const mmwrB = parseFloat(b[mmwrIndex] || 0);
      if (mmwrB !== mmwrA) {
        return mmwrB - mmwrA;
      }

      const oppAvgA = parseFloat(a[oppAvgMmwrIndex] || 0);
      const oppAvgB = parseFloat(b[oppAvgMmwrIndex] || 0);
      return oppAvgB - oppAvgA;
    });

    return sorted;
  }, [currentSet.standingsMode, headers.length, normalizedHeaders, rows]);

  return (
    <>
      <section className="hero">
        <p className="eyebrow">{currentSet.eyebrow}</p>
        <h1>{currentSet.name} Standings</h1>
      </section>

      <section className="surface toolbar" aria-label="Standings controls">
        <div className="season-picker">
          <label htmlFor="standings-season-select">Set</label>
          <select
            id="standings-season-select"
            className="season-select"
            value={currentSet.slug}
            onChange={event => navigate({ page: routes.standings, setSlug: event.target.value })}
          >
            {sets.map(set => (
              <option key={set.slug} value={set.slug}>{set.name}</option>
            ))}
          </select>
        </div>
      </section>

      {rosterPending && <p className="status">Roster TBD. Standings will appear here once the season roster is ready.</p>}
      {loading && <p className="status">Loading standings...</p>}
      {error && <p className="status error">Error loading standings: {error}</p>}

      <section className="surface table-scroll">
        <table id="standings">
          <StandingsHead showTiebreakers={currentSet.standingsMode !== 'points'} />
          <tbody>
            {sortedRows.map((row, index) => (
              <StandingsRow
                key={`${row[0] || 'row'}-${index}`}
                row={row}
                rank={index + 1}
                normalizedHeaders={normalizedHeaders}
                showTiebreakers={currentSet.standingsMode !== 'points'}
              />
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

function StandingsHead({ showTiebreakers }) {
  return (
    <thead>
      <tr>
        <th rowSpan="2">Rank</th>
        <th rowSpan="2">Player</th>
        {[1, 2, 3, 4].map(draft => (
          <th key={draft} colSpan="3" className="group-header">Draft {draft}</th>
        ))}
        <th rowSpan="2">Points</th>
        {showTiebreakers && (
          <>
            <th rowSpan="2">MMWR</th>
            <th rowSpan="2">Opp. Aver. MMWR</th>
          </>
        )}
      </tr>
      <tr>
        {[1, 2, 3, 4].flatMap(draft => (
          ['Wins', 'Losses', 'Draws'].map(label => (
            <th key={`${draft}-${label}`}>{label}</th>
          ))
        ))}
      </tr>
    </thead>
  );
}

function StandingsRow({ row, rank, normalizedHeaders, showTiebreakers }) {
  const pointsIndex = normalizedHeaders.findIndex(header => header === 'points');
  const mmwrIndex = normalizedHeaders.findIndex(header => header === 'mmwr');
  const oppAvgMmwrIndex = normalizedHeaders.findIndex(header => header === 'oppavermmwr');
  const totalPoints = parseInt(row[pointsIndex] || 0, 10);
  const cells = showTiebreakers ? row : row.filter((_, index) => index !== mmwrIndex && index !== oppAvgMmwrIndex);

  return (
    <tr className={totalPoints > 0 && rank <= 4 ? 'top4' : undefined}>
      <td>{rank}</td>
      {cells.map((cell, index) => {
        const sourceIndex = showTiebreakers ? index : remapPointsOnlyIndex(index, mmwrIndex, oppAvgMmwrIndex);
        const formatted = sourceIndex === mmwrIndex || sourceIndex === oppAvgMmwrIndex
          ? formatDecimal(cell)
          : cell;
        return <td key={index}>{formatted}</td>;
      })}
    </tr>
  );
}

function remapPointsOnlyIndex(index, mmwrIndex, oppAvgMmwrIndex) {
  let sourceIndex = index;
  if (mmwrIndex !== -1 && sourceIndex >= mmwrIndex) {
    sourceIndex += 1;
  }
  if (oppAvgMmwrIndex !== -1 && sourceIndex >= oppAvgMmwrIndex) {
    sourceIndex += 1;
  }
  return sourceIndex;
}

function formatDecimal(value) {
  const numValue = parseFloat(value);
  return Number.isNaN(numValue) ? value : numValue.toFixed(3);
}

function ChampionsPage() {
  const { rows, headers, loading, error } = useCsvData(championsCsvUrl, 300000);
  const normalizedHeaders = useMemo(() => headers.map(normalizeHeader), [headers]);

  const championRows = useMemo(() => {
    if (!headers.length) {
      return [];
    }

    const setIndex = getHeaderIndex(normalizedHeaders, 'set', 'Set');
    const bracketLinkIndex = getOptionalHeaderIndex(normalizedHeaders, 'topcutbracket', 'bracketlinks', 'bracketlink', 'bracket');
    const winnerIndex = getHeaderIndex(normalizedHeaders, 'winner', 'Winner');
    const winnerDeckIndex = getHeaderIndex(normalizedHeaders, 'winnerdecks', 'Winner Deck(s)');
    const runnerUpIndex = getHeaderIndex(normalizedHeaders, 'runnerup', 'Runner-Up');
    const runnerUpDeckIndex = getHeaderIndex(normalizedHeaders, 'runnerupdecks', 'Runner-Up Deck(s)');
    const deckLinkHeaderIndexes = normalizedHeaders
      .map((header, index) => ({ header, index }))
      .filter(item => item.header === 'decklinks' || item.header === 'decklink')
      .map(item => item.index);
    const winnerDeckLinkIndex = deckLinkHeaderIndexes.find(index => index > winnerDeckIndex && index < runnerUpIndex);
    const runnerUpDeckLinkIndex = deckLinkHeaderIndexes.find(index => index > runnerUpDeckIndex);

    return rows.map(row => ({
      set: row[setIndex] || '',
      topCutBracket: bracketLinkIndex !== undefined ? row[bracketLinkIndex] || '' : '',
      winner: row[winnerIndex] || '',
      winnerDecks: row[winnerDeckIndex] || '',
      winnerDeckLinks: winnerDeckLinkIndex !== undefined ? row[winnerDeckLinkIndex] || '' : '',
      runnerUp: row[runnerUpIndex] || '',
      runnerUpDecks: row[runnerUpDeckIndex] || '',
      runnerUpDeckLinks: runnerUpDeckLinkIndex !== undefined ? row[runnerUpDeckLinkIndex] || '' : ''
    }));
  }, [headers.length, normalizedHeaders, rows]);

  return (
    <>
      <section className="hero">
        <p className="eyebrow">Season Archive</p>
        <h1>Hall of Champions</h1>
      </section>

      {loading && <p className="status">Loading champion history...</p>}
      {error && <p className="status error">Error loading champion history: {error}</p>}

      <section className="surface table-scroll champions-surface">
        <table id="champions">
          <thead>
            <tr>
              <th>Set</th>
              <th>Top Cut Bracket</th>
              <th className="champion-col">Winner</th>
              <th className="champion-col">Winner Deck(s)</th>
              <th className="champion-col">Deck Link(s)</th>
              <th>Runner-Up</th>
              <th>Runner-Up Deck(s)</th>
              <th>Deck Link(s)</th>
            </tr>
          </thead>
          <tbody>
            {championRows.map((row, index) => (
              <tr key={`${row.set}-${index}`}>
                <td>{row.set}</td>
                <td><LinkList value={row.topCutBracket} /></td>
                <td className="champion-col">{row.winner}</td>
                <td className="champion-col"><DeckList value={row.winnerDecks} /></td>
                <td className="champion-col"><LinkList value={row.winnerDeckLinks} /></td>
                <td>{row.runnerUp}</td>
                <td><DeckList value={row.runnerUpDecks} /></td>
                <td><LinkList value={row.runnerUpDeckLinks} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

function DeckList({ value }) {
  if (!value || !value.includes(';')) {
    return value || '';
  }

  return value
    .split(';')
    .map(deck => deck.trim())
    .filter(Boolean)
    .map((deck, index) => (
      <span key={`${deck}-${index}`}>
        {index > 0 && <br />}
        {deck}
      </span>
    ));
}

function LinkList({ value }) {
  const links = extractLinks(value);

  if (!links.length) {
    return <span className="muted-cell">-</span>;
  }

  return (
    <span className="deck-links">
      {links.map((link, index) => {
        const normalizedUrl = /^https?:\/\//i.test(link) ? link : 'https://' + link;
        return (
          <a key={`${link}-${index}`} href={normalizedUrl} target="_blank" rel="noopener noreferrer">
            {links.length > 1 ? `View ${index + 1}` : 'View'}
          </a>
        );
      })}
    </span>
  );
}

function extractLinks(value) {
  if (!value) {
    return [];
  }

  return value
    .split(/[\n,|]/)
    .map(token => token.trim())
    .filter(Boolean);
}

function RulesPage() {
  return (
    <>
      <section className="hero">
        <p className="eyebrow">Format Guide</p>
        <h1>SWU Draft Cup Rules</h1>
      </section>

      <section className="rules-panel">
        <h2>🌟 SWU Draft Cup — Format & Rules</h2>

        <h2>🧾 Overview</h2>
        <p>The SWU Draft Cup is a multi-event draft league culminating in a final tournament. Players will compete in 3 or more draft pods and earn points based on match performance. After the draft phase is completed, a single-elimination finals top 8 tournament will determine the season champion.</p>

        <h2>🌀 Draft Phase</h2>
        <h3>✳️ Participation Rules</h3>
        <ul>
          <li>Each player must participate in a minimum of 3 drafts.</li>
          <li>You may play up to three extra drafts if you would like more chances of a better draft deck.</li>
          <li>Draft pods do not need to consist exclusively of Draft Cup members.</li>
          <li>Each pod must include at least two other Draft Cup members.</li>
          <li>Each pod must have a minimum of 6 players.</li>
          <li>You must track and preserve your drafted card pool separately for each draft, including sideboards.</li>
          <li>Please post pictures of your draft pools in the current season's forum thread to document them.</li>
          <li>You must report your draft using the forum posts before you begin the draft.</li>
        </ul>

        <h3>Guidelines for Reporting</h3>
        <ul>
          <li>Before you physically start drafting, post a single message stating that you are reporting and who else is in your pod.</li>
          <li>You have until the end of the following day to post a single message that contains your drafted pool and the melee link.</li>
        </ul>

        <h3>Pod Types</h3>
        <p>When you report a draft pod, you must declare if it is for:</p>
        <ul>
          <li><strong>Points + Pool</strong> if you want it to count towards one of your 6 max decks and have it be scored for standings.</li>
          <li><strong>Pool Only</strong> if you want it to count towards one of your 6 max drafts but not have it be scored for standings.</li>
        </ul>

        <h2>🏅 Match Scoring (Draft Phase)</h2>
        <ul>
          <li>3 points per match win or match bye.</li>
          <li>1 point per draw.</li>
          <li>+1 bonus point for going 3-0 in a draft.</li>
          <li>The +1 bonus point is only awarded for winning 3 matches; a 3-0 with a bye will not award the bonus point.</li>
          <li>These points contribute to your ladder standings and will be used for seeding in the finals.</li>
          <li>Only the first four Point Pods you report will count for the standings.</li>
          <li>A draft must be played in best-of-three format for it to qualify.</li>
        </ul>

        <h2>🏆 Final Tournament (Top 8)</h2>
        <p>The Draft Cup has a cut to Top 8. Ties are resolved by comparing player's member match win rate (MMWR), and further ties are resolved by opponents average MMWR.</p>
        <p>For detailed information on the format of the final tournament, please see top-cut-format.</p>

        <h2>Top Cut Format - Draft 'Trilogy'</h2>
        <h3>Deck Eligibility</h3>
        <ul>
          <li>Each player brings exactly three (3) draft decks from the draft phase.</li>
          <li>Each deck must also include its associated draft pool/sideboard, which may only be used with that deck.</li>
          <li>Your three decks are locked for the duration of top cut.</li>
          <li>Cards cannot be shared between decks; sideboard A can only be used for deck A.</li>
        </ul>

        <h3>Match Structure</h3>
        <ul>
          <li><strong>Quarter and Semi-Finals:</strong> Best-of-three Trilogy.</li>
          <li>A player must win two (2) games, each with a different deck, to win the match.</li>
          <li><strong>Finals:</strong> Extended trilogy.</li>
          <li>A player must win three (3) games, each with a different deck, to win the match.</li>
          <li>All games are Best-of-One (Bo1).</li>
        </ul>

        <h3>Pre-Match Procedure</h3>
        <ul>
          <li>At the start of the match, both players reveal the leader and bases of all three decks to their opponent.</li>
          <li>Keep deck/pool contents hidden.</li>
          <li className="rule-note">Players are encouraged to study their opponent's pools via the Discord prior to the match.</li>
          <li>Players assign each deck a number: 1, 2, 3.</li>
          <li>Each player makes a secret deck selection for Game 1 using a die, written down on paper, or any agreed hidden method.</li>
          <li>Both players reveal their chosen deck simultaneously.</li>
          <li>Players are allowed to sideboard based on their opponent's deck selection, if desired.</li>
        </ul>

        <h3>Deck Selection Between Games</h3>
        <p>After each game, follow these steps:</p>
        <ul>
          <li><strong>Deck Locking:</strong> A deck that wins a game may not be used again for the remainder of the match. Losing decks are not locked.</li>
          <li><strong>Deck Selection:</strong> The winner must select a different deck from their remaining decks.</li>
          <li>The loser may choose to continue with the same deck, or switch to another available deck.</li>
          <li><strong>Secret selection:</strong> Both players again select their next deck in secret.</li>
          <li>Reveal selections simultaneously before starting the next game, with side-boarding if desired.</li>
        </ul>

        <h3>Winning the Match</h3>
        <ul>
          <li><strong>Quarter and Semi-Finals:</strong> The first player to achieve two wins with two different decks wins the match.</li>
          <li><strong>Finals:</strong> The first player to achieve three wins with three different decks wins the match.</li>
          <li>Once a player has achieved the required number of unique deck wins, the match ends.</li>
        </ul>

        <h3>Sportsmanship</h3>
        <p>A player may not concede a game with the intent to preserve a deck for later use.</p>
      </section>
    </>
  );
}

function useCsvData(csvUrl, refreshMs, enabled = true) {
  const [state, setState] = useState({ headers: [], rows: [], loading: false, error: '' });

  useEffect(() => {
    if (!enabled) {
      setState({ headers: [], rows: [], loading: false, error: '' });
      return undefined;
    }

    let cancelled = false;

    const load = () => {
      setState(previous => ({
        ...previous,
        loading: previous.rows.length === 0,
        error: ''
      }));

      fetch(csvUrl)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          return res.text();
        })
        .then(data => {
          const parsedRows = parseCSV(data);
          if (!parsedRows.length) {
            throw new Error('No rows found in CSV.');
          }

          if (!cancelled) {
            setState({
              headers: parsedRows[0],
              rows: parsedRows.slice(1).filter(row => row.some(value => value && value.trim() !== '')),
              loading: false,
              error: ''
            });
          }
        })
        .catch(err => {
          if (!cancelled) {
            setState(previous => ({ ...previous, loading: false, error: err.message }));
          }
        });
    };

    load();
    const interval = window.setInterval(load, refreshMs);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [csvUrl, refreshMs, enabled]);

  return state;
}

export default App;
