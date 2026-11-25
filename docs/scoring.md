# Scoring

This document gives the rules that score pick submissions for an event and turn event results into season standings points.

## Pick submissions

A player picks a set of categories and a set of teams for an event. The player does not pick a team to win a category. The categories and teams together make the player's point pool.

Every submission also gets the event's global categories. Players never choose them. See [Global categories](#global-categories).

Random submissions are scored with the same rules as manual submissions.

## Definitions

All counts include all submissions for the event, random submissions included.

| Term | Meaning |
|---|---|
| `picks(c)` | The number of submissions that picked category `c`. Only chosen (not global) categories have picks |
| `picks(t)` | The number of submissions that picked team `t` |
| `baseValue(c)` | `picks(c) + 1` |
| `topCatValue` | The highest `baseValue(c)` of the chosen categories at the event. 0 when the event has no chosen categories |
| `topCats` | All chosen categories where `baseValue(c) = topCatValue`. If categories tie, all of them are in `topCats` |
| `value(c)` | The points category `c` gives. See [Category value](#category-value) |
| `topTeamValue` | The highest `picks(t)` at the event |
| `winners(c)` | The teams that won category `c`. A category has one or more winners |
| `uniqueness(p)` | The sum of `picks(t)` for all teams in submission `p`. A higher value means the picks are less unique |

The `+1` applies only to category values. It does not apply to team counts or to any value calculated from teams.

## Category winners

Each category finds one or more teams that won it. A win is not always the best or highest result. Each category has its own rule, given in its scoring description.

Category winners come from one of four sources:

- **Automatic:** a config finds the winners from The Blue Alliance, FRC Events or Statbotics data.
- **Script:** an AI-written script finds the winners. See [Scoring scripts](#scoring-scripts).
- **Least unique submission:** global categories only. The least unique submissions win, not teams. See [Least unique categories](#least-unique-categories).
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
| `value` | One measure, or a formula of measures and numbers. See [Formulas](#formulas) |
| `select` | The rule that picks the winners from the values |

A filter can name another source. The measure then keeps only teams that have at least one row in that source that matches the filter. For example, a `tba.matches` count with the filter `tba.alliances` `role = captain` counts matches only for alliance captains. All filters on the same other source must match one row of that source. For example, `outcome = loss`, `compLevel = sf` and `setNumber` in 1 to 4 on `tba.matches` find a team that lost a round 1 playoff match. A team that fails such a filter gets 0 from `count` and `sum`, and no value from the other operations.

Sources: `tba.matches`, `tba.rankings`, `tba.alliances`, `tba.awards`, `statbotics.teamEvents` and `statbotics.matches`.

`statbotics.matches` has one row for each team in each match. Each row has the team's EPA before (`preEpa`) and after (`epa`) the match, and its alliance's `result` and `pred` (prediction) without the `red_`/`blue_` prefix. It also has `opponentResult`. Statbotics has no other per-team match data. The `matches` setting applies to both match sources. The adapters in `convex/lib/scoring/sources/` check all source data with Zod schemas.

Each season with a breakdown schema has strongly typed fields. When you save a config, each field path is checked against the season's schema. A season with no breakdown schema accepts any path under `breakdown` (TBA) or `epa.breakdown` (Statbotics). Schemas exist for 2025 (REEFSCAPE) and 2026 (REBUILT). To support a new game, add its breakdown schemas to `tbaBreakdownSchemas` and `statboticsBreakdownSchemas`, and its match schemas to `seasonSchemas` in `statbotics_matches.ts`.

In `tba.matches`, each row is one team in one match. A `{n}` in a field path changes to the team's robot position in its alliance, for example `breakdown.endGameRobot{n}`.

Select rules:

| Rule | Winners |
|---|---|
| `nth` | All teams with the nth distinct value. For the values 10, 9, 9, 8, the 3rd highest is 8. `nth` with `n: 1` gives the highest or lowest |
| `top` | The first `n` teams in order. Teams tied at the cutoff also win |
| `threshold` | All teams with a value `gt`, `gte`, `lt` or `lte` a number |
| `equals` | All teams with a value equal to a number |

A team can't win when it is outside `teams`, when a measure has no data for it, or when its value divides by zero. The preview shows each team's measures, value and reason.

#### Formulas

In the builder, a formula is text, for example `(auto - teleop) / matches * 100`. It can use measure names, numbers, `+ - * /` (or `× ÷ −`), `//`, `%`, `round()`, `ceil()`, `floor()` and parentheses. `* / // %` come before `+` and `-`. The parser is in `convex/lib/scoring/formula.ts`.

| Part | Meaning |
|---|---|
| `a // b` | Integer division. Divides, then rounds down: `7 // 2` is 3 and `-7 // 2` is -4 |
| `a % b` | Mod. The remainder of `a // b`, with the sign of `b`: `7 % 3` is 1 and `-7 % 3` is 2. So `a = b * (a // b) + a % b` |
| `round(x)` | Rounds to the nearest whole number. A half rounds up: `round(2.5)` is 3 and `round(-2.5)` is -2 |
| `ceil(x)` | Rounds up: `ceil(2.1)` is 3 |
| `floor(x)` | Rounds down: `floor(-2.1)` is -3 |

`//` and `%` by zero give no value, the same as `/` by zero.

A formula is stored as a tree of operations. Each operation has `op` (`add`, `subtract`, `multiply`, `divide`, `intDivide` or `mod`), `left` and `right`. A rounding has `fn` (`round`, `ceil` or `floor`) and `arg`. Each side or `arg` is a measure name, a number, an operation or a rounding. A config from before formulas, with one operation on 2 measures or numbers, is a short formula and still works.

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

Some rules will not fit a config. These use a script. See [Scoring scripts](#scoring-scripts).

### Scoring scripts

A script is JavaScript that AI writes from a plain-language rule. It runs in a [Vercel Sandbox](https://vercel.com/docs/vercel-sandbox) each time an admin selects Calculate winners. Use it for rules that need data from more than one place, or pick data, that a config can't read.

A script can set a category's winners, a global category's points, or both. The category's Scoring page sets this:

- "How winners are found": Script.
- "Where the points come from" (global categories only): Script.

The script is an ES module with `export default async function score(ctx)`. It returns `{ winners?, points?, explanation, teams? }`:

| Part | Meaning |
|---|---|
| `winners` | Team numbers. Required when the winners come from the script. `[]` when no team won |
| `points` | Points for each winning team. Required when the points come from the script. `null` when there are none at this event. Rounded down |
| `explanation` | 1 to 3 plain sentences for the admin about what the script found |
| `teams` | Optional detail for each team: `value` and `note`. Max 100 |

`ctx` is read-only. It has the event, its teams, every submission (name, teams, chosen categories), every category with its picks and current winners, the event values of [Global categories](#global-categories) and the TBA awards. `ctx.api.tba`, `ctx.api.statbotics` and `ctx.api.frcEvents` read those APIs. The full shape is `SCRIPT_CONTEXT_TYPE` in `convex/lib/scoring/script/contract.ts`, and the page shows it under "What the script gets and returns".

Rules the sandbox applies:

- It can reach only TBA, Statbotics (or the `STATBOTICS_BASE_URL` mirror) and FRC Events. All other hosts are blocked.
- The API keys never go into the sandbox. The sandbox firewall adds them to each request on the way out (`convex/lib/sandbox/network_policy.ts`).
- `Math.random` throws, so the same input gives the same result.
- A run stops after 60 seconds.

On the Scoring page, "Write script" sends the rule to the AI. The AI reads the API data, then writes and runs the script on the example event (an event of the category's season in the app, with its picks) until it works. The page shows the result: winners, points, explanation, team detail, API calls and logs. An admin can edit the script and run it again. Save is refused until the current script passed a run.

Calculate winners runs the configs first and saves the awards, then runs every script in one sandbox. A script sees the new winners and awards. Script winners are saved in `categoryWinners` (type `script`), and script points in `categoryPoints`. A script that throws, or returns a result that is not valid, saves an error that the Scores page shows.

Convex needs `VERCEL_TEAM_ID`, `VERCEL_PROJECT_ID` and `VERCEL_TOKEN` for the sandbox, and `AI_GATEWAY_API_KEY` for the AI. The model is `SCORING_GENERATION_MODEL`, the same as for configs. The code is in `convex/scoringScripts.ts`, `convex/scoringScriptData.ts`, `convex/lib/scoring/script/` and `convex/lib/sandbox/`.

## Event score

A player's event score is the sum of these line items.

| Line item | Amount | Applies |
|---|---|---|
| Category win | `+value(c)` | One time for each pair of a picked category `c` and a picked team in `winners(c)` |
| Global category win | `+value(g)` | One time for each pair of a global category `g` and a picked team in `winners(g)`. Every submission gets every global category |
| Award | `-topCatValue` | One time for each picked team that won the season's deduction award |
| Least unique | `+value(g)` | One time for each least unique category `g`, only to the least unique submissions. See [Least unique categories](#least-unique-categories) |

All line items are cumulative. For example, a player picks 2 teams that both won the same picked category. The player gets `+value(c)` two times.

### Category value

| Case | `value(c)` |
|---|---|
| `c` is not in `topCats` | `baseValue(c)` |
| `c` is the only category in `topCats` | `0` |
| `c` is in `topCats` and 2 or more categories tie | `floor(baseValue(c) / n)`, where `n` is the number of categories in `topCats` |

A player who picked the only top category and its winning teams gets 0 points from that category. The player can still get points from other categories.

### Global categories

A global category applies to every submission at the event. Players never choose it, so:

- it has no `picks(c)` and is never in `topCats`;
- it does not change `topCatValue`, so it does not change the award deduction;
- the top category rule does not reduce it.

Picks store the event's global category IDs with the chosen ones. Scoring ignores the stored global IDs and gives every submission every global category.

Each global category gets its points in one of 3 ways, set in step 2 of the category's Scoring page:

- **Formula:** the same points for each winning team, calculated at each event. See below.
- **AI script:** the script returns the points. See [Scoring scripts](#scoring-scripts).
- **Admin sets per team:** only when an admin selects the winners. On the event's Scores page, the admin enters whole-number points for each winning team, next to the winners. Each player who picked a team gets that team's points. Finalize is refused while a winning team has no points. The points are saved with the manual winners (`teamPoints`).

Chosen (not global) categories always use [Category value](#category-value). The formula is set in "Points per winning team", for automatic, script and manual categories, and is saved with Save scoring. It is not the same as a config's Value, which only ranks teams to find the winners.

The formula is calculated at each event, so the points can be different at each event. A value with a fraction is rounded down. Each winning team in a submission gives the points, the same as a chosen category. Winners are found as for any other category: a config or an admin.

A formula uses the same operations and rounding functions as a config formula (see [Formulas](#formulas)), with these event values and these functions of the submissions:

| Name | Meaning |
|---|---|
| `maxCategoryValue` | The highest `baseValue(c)` of the chosen categories. Same as `topCatValue` |
| `minCategoryValue` | The lowest `baseValue(c)` of the chosen categories |
| `topTeamValue` | The highest `picks(t)` |
| `submissions` | The number of submissions |
| `categoryValue(n)` | The `baseValue(c)` of the nth most picked chosen category. `categoryValue(1)` is `maxCategoryValue` |
| `teamPicks(n)` | The `picks(t)` of the nth most picked team. Only teams with picks count |

`n` starts at 1, the highest. Tied items each take a position, so with team picks 3, 3, 2, `teamPicks(2)` is 3 and `teamPicks(3)` is 2. A position past the end of its list gives no value.

Examples:

- "Lose a rematch": `maxCategoryValue - minCategoryValue`. With base values 5, 3 and 1, the points are 4.
- The picks of the 6th most chosen team: `teamPicks(6)`.

A global category can have no winners. It then gives no points and does not block Finalize.

A global category with no formula, or a formula that divides by zero or reads past the end of a list, has no value. It gives 0 in draft scores. Finalize is refused only when the category has winners. The code is in `convex/lib/scoring/global_value.ts`. To add an event value, add it to `GLOBAL_VALUE_VARIABLES` (or `GLOBAL_VALUE_FUNCTIONS`) and `getGlobalValueInputs`.

### Deduction award

Each season sets one award as the deduction award, on the Season settings page. It is stored as a TBA award type number in `seasons.deductionAwardType`. Admins can change it during the season. A change applies only to events that are not final.

The award can have more than one winner at an event. Each winner counts as a separate deduction.

### Least unique categories

A global category can use the least unique rule: set "How winners are found" to "Least unique submission" on its Scoring page. Its winners are submissions, not teams. Use it to discourage picks of very common or well known teams.

The least unique submissions are found from the picks each time scores are calculated. Nothing is saved until Finalize.

1. The submission with the highest `uniqueness(p)` wins.
2. If submissions tie, sort the `picks(t)` values of each tied submission from highest to lowest. Compare the first values. The submission with the higher value wins.
3. If the first values are the same, compare the second values, then the third, and so on.
4. If all values are the same, all tied submissions win.

Each winning submission gets `value(g)` one time, not one time for each team. The value comes from the category's points formula or script, the same as other global categories. For a deduction, use a negative formula. The usual one is `-topTeamValue`, and the page fills it in when you choose the rule.

There is no fixed least unique deduction. A season with no least unique category gives none. Scores saved by Finalize before this change keep their `leastUnique` line items.

### Results status

Event results are **draft** until an admin finalizes them on the event's Scores page (`convex/results.ts`).

- While draft, scores are calculated live from the current picks, winners and awards (`convex/lib/scoring/event_scores.ts`).
- **Calculate winners** also saves all of the event's TBA awards. The award deduction uses the winners of the season's deduction award from these.
- **Finalize** saves each submission's score, line items and chosen categories in `eventScores`, and the values used in `eventResults.final`. Winners are then locked: manual winners and Calculate winners are refused.
- Finalize is refused until the event is COMPLETE, the season has a deduction award, the awards are loaded, every chosen (not global) category has winners and every global category that has winners has a points formula that gives a value.
- **Reopen** deletes the saved scores and makes the results draft again.

A change to the deduction award does not change a final event, because its scores are saved.

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

