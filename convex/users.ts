import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { UserJSON } from "@clerk/backend";
import { v, Validator } from "convex/values";

const waitlistStatusValidator = v.union(
  v.literal("pending"),
  v.literal("invited"),
  v.literal("completed"),
  v.literal("rejected"),
);

const userValidator = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  externalId: v.optional(v.string()),
  firstName: v.string(),
  lastName: v.string(),
  email: v.string(),
  normalizedEmail: v.optional(v.string()),
  isAdmin: v.boolean(),
  isApprover: v.boolean(),
  isApproved: v.boolean(),
  waitlistEntryId: v.optional(v.string()),
  waitlistStatus: v.optional(waitlistStatusValidator),
  invitedAt: v.optional(v.number()),
  approvedAt: v.optional(v.number()),
  rejectedAt: v.optional(v.number()),
});

export const current = query({
  args: {},
  returns: v.union(userValidator, v.null()),
  handler: async (ctx) => {
    return await getCurrentUser(ctx);
  },
});

export const accessStatusByEmail = query({
  args: { email: v.string() },
  returns: v.object({
    canSignIn: v.boolean(),
    status: v.union(
      v.literal("not_found"),
      v.literal("pending"),
      v.literal("invited"),
      v.literal("completed"),
      v.literal("rejected"),
      v.literal("approved"),
    ),
  }),
  handler: async (ctx, { email }) => {
    const user = await userByNormalizedEmail(ctx, normalizeEmail(email));

    if (!user) {
      return { canSignIn: false, status: "not_found" as const };
    }

    if (user.isApproved) {
      const status =
        user.waitlistStatus === "invited" || user.waitlistStatus === "completed"
          ? user.waitlistStatus
          : ("approved" as const);

      return {
        canSignIn: true,
        status,
      };
    }

    return {
      canSignIn: false,
      status: user.waitlistStatus ?? ("pending" as const),
    };
  },
});

export const hasWaitlistInfoByEmail = query({
  args: { email: v.string() },
  returns: v.boolean(),
  handler: async (ctx, { email }) => {
    const user = await userByNormalizedEmail(ctx, normalizeEmail(email));

    return Boolean(user?.waitlistEntryId || user?.waitlistStatus);
  },
});

export const waitlistStatusByEmail = query({
  args: { email: v.string() },
  returns: v.union(
    v.literal("not_found"),
    v.literal("pending"),
    v.literal("invited"),
    v.literal("completed"),
    v.literal("rejected"),
    v.literal("approved"),
  ),
  handler: async (ctx, { email }) => {
    const user = await userByNormalizedEmail(ctx, normalizeEmail(email));

    if (!user?.waitlistEntryId && !user?.waitlistStatus) {
      return "not_found";
    }

    if (user.isApproved) {
      return user.waitlistStatus === "invited" ||
        user.waitlistStatus === "completed"
        ? user.waitlistStatus
        : "approved";
    }

    return user.waitlistStatus ?? "pending";
  },
});

export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> }, // no runtime validation, trust Clerk
  returns: v.id("users"),
  async handler(ctx, { data }) {
    const email = getPrimaryEmail(data);
    const normalizedEmail = normalizeEmail(email);

    const userAttributes = {
      firstName: data.first_name || "",
      lastName: data.last_name || "",
      email,
      normalizedEmail,
      externalId: data.id,
    };

    const user =
      (await userByExternalId(ctx, data.id)) ??
      (await userByNormalizedEmail(ctx, normalizedEmail));

    if (user === null) {
      return await ctx.db.insert("users", {
        ...userAttributes,
        isAdmin: false,
        isApprover: false,
        isApproved: false,
      });
    }

    await ctx.db.patch(user._id, userAttributes);
    return user._id;
  },
});

export const upsertFromWaitlist = internalMutation({
  args: {
    waitlistEntryId: v.string(),
    email: v.string(),
    status: waitlistStatusValidator,
  },
  returns: v.id("users"),
  async handler(ctx, { waitlistEntryId, email, status }) {
    return await upsertWaitlistUser(ctx, {
      waitlistEntryId,
      email,
      status,
    });
  },
});

export const setWaitlistApproval = mutation({
  args: {
    waitlistEntryId: v.string(),
    email: v.string(),
    status: v.union(v.literal("invited"), v.literal("rejected")),
  },
  returns: v.id("users"),
  async handler(ctx, { waitlistEntryId, email, status }) {
    const currentUser = await getCurrentUser(ctx);

    if (!currentUser?.isAdmin) {
      throw new Error("Only admins can update waitlist approvals.");
    }

    return await upsertWaitlistUser(ctx, {
      waitlistEntryId,
      email,
      status,
    });
  },
});

export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  returns: v.null(),
  async handler(ctx, { clerkUserId }) {
    const user = await userByExternalId(ctx, clerkUserId);

    if (user !== null) {
      await ctx.db.patch(user._id, { externalId: undefined });
    } else {
      console.warn(
        `Can't delete user, there is none for Clerk user ID: ${clerkUserId}`,
      );
    }

    return null;
  },
});

export async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const userRecord = await getCurrentUser(ctx);
  if (!userRecord) throw new Error("Can't get current user");
  return userRecord;
}

export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    return null;
  }
  return await userByExternalId(ctx, identity.subject);
}

async function upsertWaitlistUser(
  ctx: MutationCtx,
  {
    waitlistEntryId,
    email,
    status,
  }: { waitlistEntryId: string; email: string; status: WaitlistStatus },
) {
  const normalizedEmail = normalizeEmail(email);
  const existingUser =
    (await userByWaitlistEntryId(ctx, waitlistEntryId)) ??
    (await userByNormalizedEmail(ctx, normalizedEmail));
  const approvalPatch = getWaitlistApprovalPatch(status);

  if (!existingUser) {
    return await ctx.db.insert("users", {
      firstName: "",
      lastName: "",
      email,
      normalizedEmail,
      isAdmin: false,
      isApprover: false,
      isApproved: approvalPatch.isApproved,
      waitlistEntryId,
      waitlistStatus: status,
      ...approvalPatch.timestamps,
    });
  }

  await ctx.db.patch(existingUser._id, {
    email,
    normalizedEmail,
    waitlistEntryId,
    waitlistStatus: status,
    isApproved: approvalPatch.isApproved,
    ...approvalPatch.timestamps,
  });

  return existingUser._id;
}

function getWaitlistApprovalPatch(status: WaitlistStatus) {
  if (status === "invited" || status === "completed") {
    const approvedAt = Date.now();
    return {
      isApproved: true,
      timestamps: {
        invitedAt: approvedAt,
        approvedAt,
        rejectedAt: undefined,
      },
    };
  }

  if (status === "rejected") {
    return {
      isApproved: false,
      timestamps: {
        rejectedAt: Date.now(),
      },
    };
  }

  return {
    isApproved: false,
    timestamps: {},
  };
}

function getPrimaryEmail(data: UserJSON) {
  return (
    data.email_addresses.find(
      (email) => email.id === data.primary_email_address_id,
    )?.email_address ??
    data.email_addresses[0]?.email_address ??
    ""
  );
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function userByExternalId(
  ctx: QueryCtx | MutationCtx,
  externalId: string,
) {
  return await ctx.db
    .query("users")
    .withIndex("byExternalId", (q) => q.eq("externalId", externalId))
    .unique();
}

async function userByNormalizedEmail(
  ctx: QueryCtx | MutationCtx,
  normalizedEmail: string,
) {
  return await ctx.db
    .query("users")
    .withIndex("byNormalizedEmail", (q) =>
      q.eq("normalizedEmail", normalizedEmail),
    )
    .unique();
}

async function userByWaitlistEntryId(
  ctx: QueryCtx | MutationCtx,
  waitlistEntryId: string,
) {
  return await ctx.db
    .query("users")
    .withIndex("byWaitlistEntryId", (q) =>
      q.eq("waitlistEntryId", waitlistEntryId),
    )
    .unique();
}

type WaitlistStatus = "pending" | "invited" | "completed" | "rejected";