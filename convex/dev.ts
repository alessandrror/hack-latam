import { mutationGeneric } from "convex/server";
import { v } from "convex/values";

/**
 * Wipes `scans` and `aiInsightsCache` for local/dev resets.
 * Set `DEV_DATA_RESET_SECRET` in Convex env (same value as Next `.env.local` if you call from a script).
 */
export const clearAllTablesForDev = mutationGeneric({
  args: { secret: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const expected = process.env.DEV_DATA_RESET_SECRET;
    if (!expected || args.secret !== expected) {
      throw new Error("Forbidden");
    }

    // Batch deletes to avoid timing out when a dev workspace has lots of rows.
    const deleteTableInBatches = async (table: string) => {
      const batchSize = 250;
      const maxRounds = 200; // safety cap

      for (let round = 0; round < maxRounds; round++) {
        const docs = await ctx.db.query(table).take(batchSize);
        if (docs.length === 0) return;
        for (const doc of docs) {
          await ctx.db.delete(doc._id);
        }
      }
    };

    await deleteTableInBatches("scans");
    await deleteTableInBatches("aiInsightsCache");
    await deleteTableInBatches("chatSessions");

    return null;
  },
});
