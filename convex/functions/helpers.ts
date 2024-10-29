import { customCtx, customQuery } from "convex-helpers/server/customFunctions";
import { getCurrentUser } from "./user";
import { query } from "../_generated/server";
export const authenticatedQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }
  })
);

export const authenticatedMutation = customQuery(
  query,
  customCtx(async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }
    return { user };
  })
);
