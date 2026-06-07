import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { getReceiptData, generateReceiptHTML } from "./receipt";
import { TRPCError } from "@trpc/server";

export const receiptsRouter = router({
  generate: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input, ctx }) => {
      const receipt = await getReceiptData(input.orderId, ctx.user.id);
      if (!receipt) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Receipt not found" });
      }
      const html = generateReceiptHTML(receipt);
      return { html, receipt };
    }),
});
