/**
 * Mock AI responses for demo mode.
 * Sports-oriented responses for the GameIntel NBA analytics platform.
 */
const MockAI = (() => {
  const responses = [
    {
      keywords: ['scoring', 'ppg', 'points', 'scorer'],
      source: 'power_bi',
      title: 'Top Scorers — 2025-26 Season',
      body: `Here are the top scorers in the NBA this season:

| Rank | Player | Team | PPG | FG% | 3P% |
|:---|:---|:---|---:|---:|---:|
| 1 | Luka Doncic | DAL | 33.2 | 48.7% | 37.1% |
| 2 | Shai Gilgeous-Alexander | OKC | 31.8 | 53.4% | 35.9% |
| 3 | Jayson Tatum | BOS | 28.4 | 47.2% | 38.6% |
| 4 | Kevin Durant | PHX | 27.9 | 52.1% | 40.3% |
| 5 | Anthony Edwards | MIN | 27.1 | 46.8% | 36.4% |

**Key Insight:** SGA leads the league in FG% among top-5 scorers. Durant is the most efficient from three.`,
      query: `EVALUATE
TOPN(
  10,
  SUMMARIZECOLUMNS(
    'Players'[Player],
    'Teams'[Team],
    "PPG", [Points Per Game],
    "FG%", [Field Goal Pct],
    "3P%", [Three Point Pct]
  ),
  [Points Per Game], DESC
)`,
      duration: 220
    },
    {
      keywords: ['team', 'standing', 'record', 'win', 'division'],
      source: 'power_bi',
      title: 'NBA Standings by Division',
      body: `Current standings by division:

| Division | Team | W | L | Win% | Status |
|:---|:---|---:|---:|---:|:---|
| Atlantic | Boston Celtics | 58 | 16 | .784 | 🏆 Leader |
| Atlantic | New York Knicks | 52 | 22 | .703 | ✅ Playoff |
| Central | Cleveland Cavaliers | 54 | 20 | .730 | 🏆 Leader |
| Central | Milwaukee Bucks | 49 | 25 | .662 | ✅ Playoff |
| Southeast | Orlando Magic | 47 | 27 | .635 | 🏆 Leader |
| Northwest | OKC Thunder | 60 | 14 | .811 | 🏆 #1 Overall |
| Pacific | Golden State Warriors | 44 | 30 | .595 | ✅ Playoff |
| Southwest | Dallas Mavericks | 50 | 24 | .676 | 🏆 Leader |

**Alert:** OKC Thunder on pace for a 66-win season — best in the league since 2015-16 Warriors.`,
      query: `EVALUATE
SUMMARIZECOLUMNS(
  'Teams'[Division],
  'Teams'[Team],
  "Wins", [Total Wins],
  "Losses", [Total Losses],
  "Win%", [Win Percentage]
)
ORDER BY [Win Percentage] DESC`,
      duration: 310
    },
    {
      keywords: ['matchup', 'head to head', 'versus', 'vs'],
      source: 'snowflake',
      title: 'Head-to-Head Matchup Analysis',
      body: `Celtics vs. Cavaliers — Season Series:

| Game | Date | Home | Score | Winner |
|:---|:---|:---|:---|:---|
| 1 | Nov 15 | CLE | 108-102 | CLE ✅ |
| 2 | Dec 27 | BOS | 121-113 | BOS ✅ |
| 3 | Feb 9 | CLE | 99-105 | BOS ✅ |
| 4 | Mar 18 | BOS | 116-110 | BOS ✅ |

| Stat | BOS | CLE |
|:---|---:|---:|
| Avg Points | 115.8 | 107.3 |
| Avg Rebounds | 46.2 | 43.8 |
| Avg Assists | 28.4 | 24.1 |

**Summary:** Boston leads the season series 3-1. They outperform Cleveland in all major categories.`,
      query: `SELECT
  g.game_date, g.home_team, g.away_team,
  g.home_score, g.away_score, g.winner
FROM analytics.fact_games g
WHERE (g.home_team = 'BOS' AND g.away_team = 'CLE')
   OR (g.home_team = 'CLE' AND g.away_team = 'BOS')
ORDER BY g.game_date`,
      duration: 480
    },
    {
      keywords: ['player', 'compare', 'stat', 'averag'],
      source: 'power_bi',
      title: 'Player Comparison',
      body: `Player stat comparison — 2025-26 season:

| Stat | Luka Doncic | Shai Gilgeous-Alexander |
|:---|---:|---:|
| PPG | 33.2 | 31.8 |
| RPG | 9.1 | 5.4 |
| APG | 9.8 | 6.2 |
| SPG | 1.4 | 2.1 |
| FG% | 48.7% | 53.4% |
| PER | 30.2 | 29.8 |
| +/- | +8.4 | +11.2 |

**Key Insight:** Doncic is the more complete stat-sheet stuffer (near triple-double avg). SGA leads in efficiency and +/-.`,
      query: `EVALUATE
SUMMARIZECOLUMNS(
  'Players'[Player],
  "PPG", [Points Per Game],
  "RPG", [Rebounds Per Game],
  "APG", [Assists Per Game],
  "FG%", [Field Goal Pct],
  "PER", [Player Efficiency Rating]
)`,
      duration: 190
    },
    {
      keywords: ['three', '3pt', '3-point', 'shooting', 'percentage'],
      source: 'snowflake',
      title: 'Three-Point Shooting Leaders',
      body: `Top 3-point shooters (min. 5 attempts/game):

| Rank | Player | Team | 3PM | 3PA | 3P% |
|:---|:---|:---|---:|---:|---:|
| 1 | Stephen Curry | GSW | 4.8 | 11.2 | 42.9% |
| 2 | Klay Thompson | DAL | 3.4 | 8.1 | 42.0% |
| 3 | Desmond Bane | MEM | 3.1 | 7.4 | 41.9% |
| 4 | Buddy Hield | GSW | 3.2 | 7.8 | 41.0% |
| 5 | Kevin Durant | PHX | 2.8 | 6.9 | 40.3% |

**Key Insight:** Curry remains the volume + efficiency king from deep. Golden State has two of the top 5.`,
      query: `SELECT
  p.player_name, t.team_abbr,
  ROUND(AVG(ps.three_pm), 1) AS threes_made,
  ROUND(AVG(ps.three_pa), 1) AS threes_attempted,
  ROUND(SUM(ps.three_pm)::FLOAT / NULLIF(SUM(ps.three_pa), 0) * 100, 1) AS three_pct
FROM analytics.fact_player_stats ps
JOIN analytics.dim_players p ON ps.player_key = p.player_key
JOIN analytics.dim_teams t ON ps.team_key = t.team_key
GROUP BY p.player_name, t.team_abbr
HAVING AVG(ps.three_pa) >= 5
ORDER BY three_pct DESC
LIMIT 10`,
      duration: 390
    }
  ];

  const fallback = {
    source: 'power_bi',
    title: 'NBA Query Result',
    body: `Here's what I found for your question:

| Metric | Value |
|:---|---:|
| Games Played | 1,162 |
| Season | 2025-26 |
| Teams | 30 |
| Players Tracked | 485 |

Would you like me to break this down by division, team, or player?`,
    query: `EVALUATE
SUMMARIZECOLUMNS(
  "Total Games", [Game Count],
  "Total Teams", DISTINCTCOUNT('Teams'[Team])
)`,
    duration: 120
  };

  function findResponse(text) {
    const lower = text.toLowerCase();
    for (const r of responses) {
      if (r.keywords.some(kw => lower.includes(kw))) {
        return r;
      }
    }
    return fallback;
  }

  function getResponse(userMessage) {
    const match = findResponse(userMessage);
    return {
      source: match.source,
      title: match.title,
      body: match.body,
      query: match.query,
      duration: match.duration,
      intent: match.keywords ? match.keywords[0] : 'general',
      validated: true,
      rows: Math.floor(Math.random() * 50) + 5
    };
  }

  return { getResponse };
})();
