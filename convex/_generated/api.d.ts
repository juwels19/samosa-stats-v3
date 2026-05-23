/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as categories from "../categories.js";
import type * as events from "../events.js";
import type * as http from "../http.js";
import type * as lib_events_constants from "../lib/events/constants.js";
import type * as lib_events_data from "../lib/events/data.js";
import type * as lib_events_discord from "../lib/events/discord.js";
import type * as lib_events_normalize_event_code from "../lib/events/normalize_event_code.js";
import type * as lib_events_scheduling from "../lib/events/scheduling.js";
import type * as lib_events_sort from "../lib/events/sort.js";
import type * as lib_events_team_sync from "../lib/events/team_sync.js";
import type * as lib_events_types from "../lib/events/types.js";
import type * as lib_events_validators from "../lib/events/validators.js";
import type * as lib_picks_constants from "../lib/picks/constants.js";
import type * as lib_picks_get_event_submission_data from "../lib/picks/get_event_submission_data.js";
import type * as lib_picks_replace_pick_selections from "../lib/picks/replace_pick_selections.js";
import type * as lib_picks_split_event_categories from "../lib/picks/split_event_categories.js";
import type * as lib_picks_validate_pick_submission from "../lib/picks/validate_pick_submission.js";
import type * as lib_picks_validators from "../lib/picks/validators.js";
import type * as picks from "../picks.js";
import type * as seasons from "../seasons.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  categories: typeof categories;
  events: typeof events;
  http: typeof http;
  "lib/events/constants": typeof lib_events_constants;
  "lib/events/data": typeof lib_events_data;
  "lib/events/discord": typeof lib_events_discord;
  "lib/events/normalize_event_code": typeof lib_events_normalize_event_code;
  "lib/events/scheduling": typeof lib_events_scheduling;
  "lib/events/sort": typeof lib_events_sort;
  "lib/events/team_sync": typeof lib_events_team_sync;
  "lib/events/types": typeof lib_events_types;
  "lib/events/validators": typeof lib_events_validators;
  "lib/picks/constants": typeof lib_picks_constants;
  "lib/picks/get_event_submission_data": typeof lib_picks_get_event_submission_data;
  "lib/picks/replace_pick_selections": typeof lib_picks_replace_pick_selections;
  "lib/picks/split_event_categories": typeof lib_picks_split_event_categories;
  "lib/picks/validate_pick_submission": typeof lib_picks_validate_pick_submission;
  "lib/picks/validators": typeof lib_picks_validators;
  picks: typeof picks;
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
