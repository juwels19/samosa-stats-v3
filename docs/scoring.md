# Scoring

This document gives the rules that score pick submissions for an event and turn event results into season standings points.

## Pick submissions

A player picks a set of categories and a set of teams for an event. The player does not pick a team to win a category. The categories and teams together make the player's point pool.

Random submissions are scored with the same rules as manual submissions.

## Definitions

All counts include all submissions for the event, random submissions included.

| Term | Meaning |
|---|---|
| `picks(c)` | The number of submissions that picked category `c` |
| `picks(t)` | The number of submissions that picked team `t` |
| `baseValue(c)` | `picks(c) + 1` |
| `topCatValue` | The highest `baseValue(c)` at the event |
| `topCats` | All categories where `baseValue(c) = topCatValue`. If categories tie, all of them are in `topCats` |
| `value(c)` | The points category `c` gives. See [Category value](#category-value) |
| `topTeamValue` | The highest `picks(t)` at the event |
| `winners(c)` | The teams that won category `c`. A category has one or more winners |
| `uniqueness(p)` | The sum of `picks(t)` for all teams in submission `p`. A higher value means the picks are less unique |

The `+1` applies only to category values. It does not apply to team counts or to any value calculated from teams.

## Category winners

Each category finds one or more teams that won it. A win is not always the best or highest result. Each category has its own rule, given in its scoring description.

Category winners come from one of two sources:

- **Automatic:** code finds the winners from The Blue Alliance, FRC Events or Statbotics data.
- **Manual:** an admin selects the winners. Use this for subjective categories and for categories that no data source reports.

An admin reviews all winners before the event results are final.

### Category winner configs

An automatic category has a winner config. The engine is in `convex/lib/scoring/find_category_winners.ts`, and the schema is in `convex/lib/scoring/winner_config.ts`.

A config has 4 parts:

| Part | Meaning |
|---|---|
| `teams` | The teams that can win: `all`, `inEliminations`, `notInEliminations` or `captains` |
| `matches` | The matches that `tba.matches` and `statbotics.matches` read: `qualification` (default), `playoffs` or `all`. Practice matches never count |
| `measures` | One or more named values for each team. Each measure reads one source, keeps the rows that match its `where` filters, then applies `value`, `sum`, `avg`, `max`, `min` or `count` to a field |
| `value` | One measure, or `add`, `subtract`, `multiply` or `divide` on 2 measures or numbers |
| `select` | The rule that picks the winners from the values |

A filter can name another source. The measure then keeps only teams that have at least one row in that source that matches the filter. For example, a `tba.matches` count with the filter `tba.alliances` `role = captain` counts matches only for alliance captains. All filters on the same other source must match one row of that source. For example, `outcome = loss`, `compLevel = sf` and `setNumber` in 1 to 4 on `tba.matches` find a team that lost a round 1 playoff match. A team that fails such a filter gets 0 from `count` and `sum`, and no value from the other operations.

Sources: `tba.matches`, `tba.rankings`, `tba.alliances`, `tba.awards`, `statbotics.teamEvents` and `statbotics.matches`.

`statbotics.matches` has one row for each team in each match. Each row has the team's EPA before (`preEpa`) and after (`epa`) the match, and its alliance's `result` and `pred` (prediction) without the `red_`/`blue_` prefix. It also has `opponentResult`. Statbotics has no other per-team match data. The `matches` setting applies to both match sources. The adapters in `convex/lib/scoring/sources/` check all source data with Zod schemas.

Each season with a breakdown schema has strongly typed fields. When you save a config, each field path is checked against the season's schema. A season with no breakdown schema accepts any path under `breakdown` (TBA) or `epa.breakdown` (Statbotics). To support a new game, add its breakdown schemas to `tbaBreakdownSchemas` and `statboticsBreakdownSchemas`.

In `tba.matches`, each row is one team in one match. A `{n}` in a field path changes to the team's robot position in its alliance, for example `breakdown.endGameRobot{n}`.

Select rules:

| Rule | Winners |
|---|---|
| `nth` | All teams with the nth distinct value. For the values 10, 9, 9, 8, the 3rd highest is 8. `nth` with `n: 1` gives the highest or lowest |
| `top` | The first `n` teams in order. Teams tied at the cutoff also win |
| `threshold` | All teams with a value `gt`, `gte`, `lt` or `lte` a number |
| `equals` | All teams with a value equal to a number |

A team can't win when it is outside `teams`, when a measure has no data for it, or when its value divides by zero. The preview shows each team's measures, value and reason.

Example, "3rd highest ratio of auto points to total points":

```json
{
  "measures": {
    "auto": { "source": "statbotics.teamEvents", "field": "epa.breakdown.auto_points" },
    "total": { "source": "statbotics.teamEvents", "field": "epa.breakdown.total_points" }
  },
  "value": { "op": "divide", "left": "auto", "right": "total" },
  "select": { "type": "nth", "n": 3, "order": "desc" }
}
```

### Custom sources

When no typed source has the data, a measure can read one event endpoint of TBA, Statbotics or FRC Events. Set `source` to `api` and give `api`:

| Part | Meaning |
|---|---|
| `service` | `tba`, `statbotics` or `frcEvents` |
| `path` | The endpoint, with `{eventKey}` (for example `2026onosh`), `{eventCode}` and `{year}`. TBA paths start with `/event/{eventKey}`. Statbotics paths include `{eventKey}`. FRC Events paths start with `/{year}/` and include `{eventCode}` |
| `rows` | A dot path to the list in the response. Empty when the response is the list |
| `team` | A dot path to the team in each row. A `*` makes one row for each match, for example `alliances.*.team_keys.*`. Teams can be `254`, `"254"` or `"frc254"` |

Each row also has `$context`, the object at the first `*` of `team`. For example, `$context.score` is the score of the team's alliance.

Some endpoints return an object keyed by team, for example `/event/{eventKey}/oprs` returns `{ "oprs": { "frc254": 41.2 } }`. Set `rows` to the path of that object and `team` to `$key`. Each entry becomes a row with `$key` (for example `frc254`). A number or other plain value is in the field `value`, and an object keeps its fields. For OPR: `rows` `oprs`, `team` `$key`, `field` `value`. Event-level data with no teams, such as `/event/{eventKey}/insights`, can't be a measure.

Rules for custom sources:

- Filters read the measure's own rows only. They can't name another source.
- The `matches` setting does not apply. Filter on the row's level field, for example `comp_level = qm`.
- Paths are checked when a config is saved. Custom sources have no schema, so the category page asks for a preview of the exact config before it saves. The preview shows the rows, teams and values each custom source read.
- The code is in `convex/lib/scoring/sources/api_source.ts`. When several categories use the same endpoint, add a typed adapter for it and change those configs to the typed source.

### AI-built configs

On the category scoring page, "Build config" asks an LLM to write a config from a plain-language rule. The model can list the fields of the typed sources, read event endpoints (the same rules as custom sources) and run configs on the example event. It returns a config, short notes on its choices, or a reason why no data source can find the winners.

The result is checked with the same schema as a save, then fills the form. The page marks each field the AI changed, runs the preview on the example event and has an Undo. Nothing is saved until an admin selects Save scoring.

The code is in `convex/lib/scoring/generate/`. The model comes from the Convex env var `SCORING_GENERATION_MODEL` (an AI Gateway model ID). The default is `anthropic/claude-sonnet-5.5`. Convex also needs `AI_GATEWAY_API_KEY`.

Some rules will not fit a config. These use a custom scorer, which is a TypeScript function in a registry.

## Event score

A player's event score is the sum of these line items.

| Line item | Amount | Applies |
|---|---|---|
| Category win | `+value(c)` | One time for each pair of a picked category `c` and a picked team in `winners(c)` |
| Award | `-topCatValue` | One time for each picked team that won the season's deduction award |
| Least unique | `-topTeamValue` | Only to the least unique submission. See [Least unique deduction](#least-unique-deduction) |

All line items are cumulative. For example, a player picks 2 teams that both won the same picked category. The player gets `+value(c)` two times.

### Category value

| Case | `value(c)` |
|---|---|
| `c` is not in `topCats` | `baseValue(c)` |
| `c` is the only category in `topCats` | `0` |
| `c` is in `topCats` and 2 or more categories tie | `floor(baseValue(c) / n)`, where `n` is the number of categories in `topCats` |

A player who picked the only top category and its winning teams gets 0 points from that category. The player can still get points from other categories.

### Deduction award

Each season sets one award as the deduction award, on the Season settings page. It is stored as a TBA award type number in `seasons.deductionAwardType`. Admins can change it during the season. A change applies only to events that are not final.

The award can have more than one winner at an event. Each winner counts as a separate deduction.

### Least unique deduction

This deduction discourages picks of very common or well known teams. It goes to one submission, not to a team.

1. The submission with the highest `uniqueness(p)` gets the deduction.
2. If submissions tie, sort the `picks(t)` values of each tied submission from highest to lowest. Compare the first values. The submission with the higher value gets the deduction.
3. If the first values are the same, compare the second values, then the third, and so on.
4. If all values are the same, all tied submissions get the deduction.

## Standings

### Event rank

Submissions are ranked by event score, highest first. Tied submissions share a rank, and the next rank skips the shared positions. For example, two submissions tied for first are both rank 1, and the next submission is rank 3.

### Standings points

| Event rank | Standings points |
|---|---|
| 1 | 3 |
| 2 | 2 |
| 3 | 1 |
| 4 or lower | 0 |

