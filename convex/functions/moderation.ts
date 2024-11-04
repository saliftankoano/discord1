import Groq from "groq-sdk";
import { action, mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const run = action({
  args: { id: v.id("messages") },
  handler: async (ctx, { id }) => {
    // 1- Get the message
    const message = await ctx.runQuery(api.functions.moderation.getMessage, {
      id,
    });
    // 2- Send the message to the moderation endpoint in Groq
    if (!message) {
      return;
    }
    const result = await groq.chat.completions.create({
      model: "llama-guard-3-8b",
      messages: [
        {
          role: "user",
          content: message.content,
        },
      ],
    });
    const value = result.choices[0].message.content;
    console.log(value);
    // 3- If message flagged then delete
    if (value?.startsWith("unsafe")) {
      await ctx.runMutation(api.functions.moderation.deleteMessage, {
        id,
        reason: value.replace("unsafe", "").trim(),
      });
    }
  },
});
type ReasonKeys = keyof typeof reasons;

export const deleteMessage = mutation({
  args: {
    id: v.id("messages"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { id, reason }) => {
    const reasonKey = reason as ReasonKeys; // Cast `reason` to `ReasonKeys` type

    return await ctx.db.patch(id, {
      deleted: true,
      deletedReason: reason ? reasons[reasonKey] : undefined,
    });
  },
});

const reasons = {
  S1: "Violent Crimes",
  S2: "Non-Violent Crimes",
  S3: "Sex-Related Crimes",
  S4: "Child Sexual Exploitation",
  S5: "Defamation",
  S6: "Specialized Advice",
  S7: "Privacy",
  S8: "Intellectual Property",
  S9: "Indiscriminate Weapons",
  S10: "Hate",
  S11: "Suicide & Self-Harm",
  S12: "Sexual Content",
  S13: "Elections",
  S14: "Code Interpreter Abuse",
};

export const getMessage = query({
  args: {
    id: v.id("messages"),
  },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});
