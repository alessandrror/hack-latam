/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiInsightsCache from "../aiInsightsCache.js";
import type * as scans from "../scans.js";
import type * as verifiedDomains from "../verifiedDomains.js";
import type * as verifiedDomainsActions from "../verifiedDomainsActions.js";
import type * as verifiedDomainsInternal from "../verifiedDomainsInternal.js";
import type * as verifyCheckImpl from "../verifyCheckImpl.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiInsightsCache: typeof aiInsightsCache;
  scans: typeof scans;
  verifiedDomains: typeof verifiedDomains;
  verifiedDomainsActions: typeof verifiedDomainsActions;
  verifiedDomainsInternal: typeof verifiedDomainsInternal;
  verifyCheckImpl: typeof verifyCheckImpl;
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
