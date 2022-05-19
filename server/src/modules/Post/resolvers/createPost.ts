import { PrismaClient } from "@prisma/client";
import { builder } from "../../../builder";
import { NotFoundError } from "../../Error/objects";

const prisma = new PrismaClient({});

builder.mutationField("createPost", (t) => {
  return t.prismaField({
    type: "Post",
    authScopes: {
      isLoggedIn: true,
    },
    errors: {
      types: [Error, NotFoundError],
    },
    args: {
      title: t.arg({
        type: "String",
        required: true,
        description: "Title",
      }),
      content: t.arg({
        type: "String",
        required: false,
        description: "Content",
      }),
    },
    resolve: async (_query, _root, args, ctx, _info) => {
      const foundUser = await prisma.user.findUnique({
        where: {
          id: ctx.req.session.userId,
        },
      });
      if (!foundUser) {
        throw new NotFoundError("user");
      }
      return await prisma.post.create({
        data: {
          title: args.title,
          content: args.content,
          authorId: foundUser.id,
        },
      });
    },
  });
});
