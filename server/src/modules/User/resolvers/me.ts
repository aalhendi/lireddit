import { PrismaClient } from "@prisma/client";
import { builder } from "../../../builder";

const prisma = new PrismaClient({});

builder.queryField("me", (t) => {
  return t.prismaField({
    type: "User",
    nullable: true,
    resolve: async (_query, _root, _args, ctx, _info) => {
      if (!ctx.req.session.userId) {
        return null;
      }
      const authenticatedUser = await prisma.user.findUnique({
        where: { id: ctx.req.session.userId },
      });
      if (authenticatedUser) {
        return authenticatedUser;
      } else {
        return null;
      }
    },
  });
});
