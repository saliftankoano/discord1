import { authenticatedQuery } from "./helpers";
import { QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export const listPending = authenticatedQuery({
  handler: async (ctx) => {
    const friends = await ctx.db
      .query("friends")
      .withIndex("by_user2_status", (q) =>
        q.eq("user2", ctx.user._id).eq("status", "pending")
      )
      .collect();
    return await mapWithUsers(ctx, friends, "user1");
  },
});

export const listAccepted = authenticatedQuery({
  handler: async (ctx) => {
    const friend1 = await ctx.db
      .query("friends")
      .withIndex("by_user1_status", (q) =>
        q.eq("user1", ctx.user._id).eq("status", "accepted")
      )
      .collect();
    const friend2 = await ctx.db
      .query("friends")
      .withIndex("by_user2_status", (q) =>
        q.eq("user2", ctx.user._id).eq("status", "accepted")
      )
      .collect();
  },
});

const mapWithUsers = async <
  K extends string,
  T extends { [key in K]: Id<"users"> },
>(
  ctx: QueryCtx,
  items: T[],
  key: K
) => {
  const result = await Promise.allSettled(
    items.map(async (item) => {
      const user = await ctx.db.get(item[key]);
      if (!user) {
        throw new Error("User not found");
      }
      return [...item, user];
    })
  );
  return result.filter((r) => r.status === "fulfilled").map((r) => r.value);
};
