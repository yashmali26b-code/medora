import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import {
  createCatalogueItem,
  listCatalogueForAdmin,
  searchApprovedCatalogue,
  updateCatalogueStatus,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";

const medicineInput = z.object({
  genericName: z.string().trim().min(2).max(160),
  brandNames: z.string().trim().max(2000).default(""),
  searchTerms: z.string().trim().min(2).max(2000),
  activeIngredient: z.string().trim().min(2).max(2000),
  medicineClass: z.string().trim().min(2).max(160),
  informationSummary: z.string().trim().min(12).max(4000),
  safetyNote: z.string().trim().min(12).max(4000),
  jurisdiction: z.string().trim().min(2).max(80).default("US"),
  sourceUrl: z.string().url().max(500),
  reviewerName: z.string().trim().min(2).max(160),
  reviewedAt: z.coerce.date(),
  status: z.enum(["draft", "approved"]).default("draft"),
});

function requireDatabase<T>(value: T | null): T {
  if (value === null) {
    throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Medicine catalogue storage is temporarily unavailable." });
  }
  return value;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  catalogue: router({
    search: publicProcedure
      .input(z.object({ query: z.string().trim().min(1).max(120) }))
      .query(async ({ input }) => requireDatabase(await searchApprovedCatalogue(input.query))),
    listForAdmin: adminProcedure.query(async () => requireDatabase(await listCatalogueForAdmin())),
    create: adminProcedure.input(medicineInput).mutation(async ({ input, ctx }) => {
      requireDatabase(await createCatalogueItem({
        ...input,
        createdByUserId: ctx.user.id,
      }));
      return { success: true } as const;
    }),
    setStatus: adminProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(["draft", "approved", "archived"]) }))
      .mutation(async ({ input }) => {
        requireDatabase(await updateCatalogueStatus(input.id, input.status));
        return { success: true } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;
