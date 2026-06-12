/**
 * mergeDatasets — concatenates any number of pre-normalized UnifiedRow arrays.
 *
 * Each platform cleaner is responsible for outputting the full UnifiedRow schema
 * before data reaches this function. This function does no re-normalization.
 *
 * UnifiedRow schema (guaranteed by every cleaner):
 *   platform     {string}  — top-level platform family  ("Google" | "Meta" | ...)
 *   sub_platform {string}  — specific channel           ("Google Ads" | "Facebook" | "Instagram" | ...)
 *   campaign     {string}  — campaign name
 *   spend        {number}
 *   revenue      {number}
 *   clicks       {number}
 *   impressions  {number}
 *   conversions  {number}
 *   ctr          {number}  — raw CTR from source CSV (0 if absent)
 *   region       {string}
 *   date         {string|null}
 *
 * @param  {...Array} datasets  - One array per platform, each containing UnifiedRows
 * @returns {Array}             - Single flat array of all rows
 */
const mergeDatasets = (...datasets) => datasets.flat();

module.exports = { mergeDatasets };
