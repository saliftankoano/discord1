import { v } from "convex/values";
import { authenticatedMutation, authenticatedQuery } from "./helpers";
import { Doc, Id } from "../_generated/dataModel";
import { QueryCtx } from "../_generated/server";

export const list = authenticatedQuery({
  handler: async (ctx) => {
    const directMessages = await ctx.db
      .query("directMessageMembers")
      .withIndex("by_user", (q) => q.eq("user", ctx.user._id))
      .collect();
    return await Promise.all(
      directMessages.map((dm) => getDirectMessage(ctx, dm.directMessage))
    );
  },
});
export const create = authenticatedMutation({
  args: {
    username: v.string(),
  },
  handler: async (ctx, { username }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first();
    if (!user) {
      throw new Error("User does not exit.");
    }
    const currentUserDM = await ctx.db
      .query("directMessageMembers")
      .withIndex("by_user", (q) => q.eq("user", ctx.user._id))
      .collect();
    const otherUserDM = await ctx.db
      .query("directMessageMembers")
      .withIndex("by_user", (q) => q.eq("user", user._id))
      .collect();
    const directMessage = currentUserDM.find((dm) =>
      otherUserDM.find((dm2) => dm.directMessage === dm2.directMessage)
    );
    if (directMessage) {
      return directMessage.directMessage;
    }
    const newDM = await ctx.db.insert("directMessages", {});
    await Promise.all([
      ctx.db.insert("directMessageMembers", {
        user: ctx.user._id,
        directMessage: newDM,
      }),
      ctx.db.insert("directMessageMembers", {
        user: user._id,
        directMessage: newDM,
      }),
    ]);
    return newDM;
  },
});
export const get = authenticatedQuery({
  args: {
    id: v.id("directMessages"),
  },
  handler: async (ctx, { id }) => {
    const member = await ctx.db
      .query("directMessageMembers")
      .withIndex("by_direct_message_user", (q) =>
        q.eq("directMessage", id).eq("user", ctx.user._id)
      )
      .first();
    if (!member) {
      throw new Error("You are not a member of direct message.");
    }
    return await getDirectMessage(ctx, id);
  },
});

const getDirectMessage = async (
  ctx: QueryCtx & { user: Doc<"users"> },
  id: Id<"directMessages">
) => {
  const dm = ctx.db.get(id);
  if (!dm) {
    throw new Error("Direct message does not exit.");
  }
  const otherMember = await ctx.db
    .query("directMessageMembers")
    .withIndex("by_direct_message", (q) => q.eq("directMessage", id))
    .filter((q) => q.neq(q.field("user"), ctx.user._id))
    .first();
  if (!otherMember) {
    throw new Error("This direct message has no other user linked.");
  }
  const user = await ctx.db.get(otherMember.user);
  if (!user) {
    throw new Error("Other member does not exist.");
  }
  return {
    ...dm,
    user,
  };
};
