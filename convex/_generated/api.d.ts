/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiSettings from "../aiSettings.js";
import type * as award_audit from "../award_audit.js";
import type * as categories from "../categories.js";
import type * as events from "../events.js";
import type * as http from "../http.js";
import type * as lib_ai_settings from "../lib/ai_settings.js";
import type * as lib_events_constants from "../lib/events/constants.js";
import type * as lib_events_data from "../lib/events/data.js";
import type * as lib_events_discord from "../lib/events/discord.js";
import type * as lib_events_normalize_event_code from "../lib/events/normalize_event_code.js";
import type * as lib_events_scheduling from "../lib/events/scheduling.js";
import type * as lib_events_sort from "../lib/events/sort.js";
import type * as lib_events_team_sync from "../lib/events/team_sync.js";
import type * as lib_events_types from "../lib/events/types.js";
import type * as lib_events_validators from "../lib/events/validators.js";
import type * as lib_mocks_mock_events from "../lib/mocks/mock_events.js";
import type * as lib_mocks_validators from "../lib/mocks/validators.js";
import type * as lib_picks_constants from "../lib/picks/constants.js";
import type * as lib_picks_display_name from "../lib/picks/display_name.js";
import type * as lib_picks_get_event_submission_data from "../lib/picks/get_event_submission_data.js";
import type * as lib_picks_randomize_pick_selections from "../lib/picks/randomize_pick_selections.js";
import type * as lib_picks_replace_pick_selections from "../lib/picks/replace_pick_selections.js";
import type * as lib_picks_split_event_categories from "../lib/picks/split_event_categories.js";
import type * as lib_picks_validate_pick_submission from "../lib/picks/validate_pick_submission.js";
import type * as lib_picks_validators from "../lib/picks/validators.js";
import type * as lib_scoring_category_values from "../lib/scoring/category_values.js";
import type * as lib_scoring_event_db from "../lib/scoring/event_db.js";
import type * as lib_scoring_event_scores from "../lib/scoring/event_scores.js";
import type * as lib_scoring_event_winners from "../lib/scoring/event_winners.js";
import type * as lib_scoring_field_paths from "../lib/scoring/field_paths.js";
import type * as lib_scoring_find_category_winners from "../lib/scoring/find_category_winners.js";
import type * as lib_scoring_formula from "../lib/scoring/formula.js";
import type * as lib_scoring_generate_generate from "../lib/scoring/generate/generate.js";
import type * as lib_scoring_generate_output from "../lib/scoring/generate/output.js";
import type * as lib_scoring_generate_prompt from "../lib/scoring/generate/prompt.js";
import type * as lib_scoring_generate_tools from "../lib/scoring/generate/tools.js";
import type * as lib_scoring_run_config from "../lib/scoring/run_config.js";
import type * as lib_scoring_sources_api_source from "../lib/scoring/sources/api_source.js";
import type * as lib_scoring_sources_event_data from "../lib/scoring/sources/event_data.js";
import type * as lib_scoring_sources_statbotics from "../lib/scoring/sources/statbotics.js";
import type * as lib_scoring_sources_statbotics_matches from "../lib/scoring/sources/statbotics_matches.js";
import type * as lib_scoring_sources_tba from "../lib/scoring/sources/tba.js";
import type * as lib_scoring_sources_tba_award_types from "../lib/scoring/sources/tba_award_types.js";
import type * as lib_scoring_validators from "../lib/scoring/validators.js";
import type * as lib_scoring_winner_config from "../lib/scoring/winner_config.js";
import type * as mocks from "../mocks.js";
import type * as picks from "../picks.js";
import type * as results from "../results.js";
import type * as scoring from "../scoring.js";
import type * as seasons from "../seasons.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiSettings: typeof aiSettings;
  award_audit: typeof award_audit;
  categories: typeof categories;
  events: typeof events;
  http: typeof http;
  "lib/ai_settings": typeof lib_ai_settings;
  "lib/events/constants": typeof lib_events_constants;
  "lib/events/data": typeof lib_events_data;
  "lib/events/discord": typeof lib_events_discord;
  "lib/events/normalize_event_code": typeof lib_events_normalize_event_code;
  "lib/events/scheduling": typeof lib_events_scheduling;
  "lib/events/sort": typeof lib_events_sort;
  "lib/events/team_sync": typeof lib_events_team_sync;
  "lib/events/types": typeof lib_events_types;
  "lib/events/validators": typeof lib_events_validators;
  "lib/mocks/mock_events": typeof lib_mocks_mock_events;
  "lib/mocks/validators": typeof lib_mocks_validators;
  "lib/picks/constants": typeof lib_picks_constants;
  "lib/picks/display_name": typeof lib_picks_display_name;
  "lib/picks/get_event_submission_data": typeof lib_picks_get_event_submission_data;
  "lib/picks/randomize_pick_selections": typeof lib_picks_randomize_pick_selections;
  "lib/picks/replace_pick_selections": typeof lib_picks_replace_pick_selections;
  "lib/picks/split_event_categories": typeof lib_picks_split_event_categories;
  "lib/picks/validate_pick_submission": typeof lib_picks_validate_pick_submission;
  "lib/picks/validators": typeof lib_picks_validators;
  "lib/scoring/category_values": typeof lib_scoring_category_values;
  "lib/scoring/event_db": typeof lib_scoring_event_db;
  "lib/scoring/event_scores": typeof lib_scoring_event_scores;
  "lib/scoring/event_winners": typeof lib_scoring_event_winners;
  "lib/scoring/field_paths": typeof lib_scoring_field_paths;
  "lib/scoring/find_category_winners": typeof lib_scoring_find_category_winners;
  "lib/scoring/formula": typeof lib_scoring_formula;
  "lib/scoring/generate/generate": typeof lib_scoring_generate_generate;
  "lib/scoring/generate/output": typeof lib_scoring_generate_output;
  "lib/scoring/generate/prompt": typeof lib_scoring_generate_prompt;
  "lib/scoring/generate/tools": typeof lib_scoring_generate_tools;
  "lib/scoring/run_config": typeof lib_scoring_run_config;
  "lib/scoring/sources/api_source": typeof lib_scoring_sources_api_source;
  "lib/scoring/sources/event_data": typeof lib_scoring_sources_event_data;
  "lib/scoring/sources/statbotics": typeof lib_scoring_sources_statbotics;
  "lib/scoring/sources/statbotics_matches": typeof lib_scoring_sources_statbotics_matches;
  "lib/scoring/sources/tba": typeof lib_scoring_sources_tba;
  "lib/scoring/sources/tba_award_types": typeof lib_scoring_sources_tba_award_types;
  "lib/scoring/validators": typeof lib_scoring_validators;
  "lib/scoring/winner_config": typeof lib_scoring_winner_config;
  mocks: typeof mocks;
  picks: typeof picks;
  results: typeof results;
  scoring: typeof scoring;
  seasons: typeof seasons;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
