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
import type * as lib_events_discord from "../lib/events/discord.js";
import type * as lib_events_scheduling from "../lib/events/scheduling.js";
import type * as lib_events_types from "../lib/events/types.js";
import type * as lib_events_validators from "../lib/events/validators.js";
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
  "lib/events/discord": typeof lib_events_discord;
  "lib/events/scheduling": typeof lib_events_scheduling;
  "lib/events/types": typeof lib_events_types;
  "lib/events/validators": typeof lib_events_validators;
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
