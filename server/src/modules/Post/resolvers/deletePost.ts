import { PrismaClient } from "@prisma/client";
import { builder } from "../../../builder";
import { NotFoundError, UnauthorizedError } from "../../Error/objects";

const prisma = new PrismaClient({});

builder.mutationField("deletePost", (t) => {
  return t.boolean({
    errors: {
      types: [Error, NotFoundError, UnauthorizedError],
    },
    args: {
      id: t.arg({
        type: "Int",
        required: true,
        description: "ID",
      }),
    },
    authScopes: {
      isLoggedIn: true,
    },
    resolve: async (_parent, args, ctx, _info) => {
      const foundPost = await prisma.post.findUnique({
        where: {
          id: args.id,
        },
      });
      if (!foundPost) {
        throw new NotFoundError("post");
      } else if (foundPost.authorId === ctx.req.session.userId) {
        await prisma.post.delete({
          where: {
            id: args.id,
          },
        });
        return true;
      } else {
        throw new UnauthorizedError();
      }
    },
  });
});
