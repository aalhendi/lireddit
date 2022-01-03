import { PrismaClient } from "@prisma/client";
import { builder } from "../../../builder";
import { NotFoundError, UnauthorizedError } from "../../Error/objects";

const prisma = new PrismaClient({});

builder.mutationField("updatePost", (t) => {
  return t.prismaField({
    type: "Post",
    authScopes: {
      isLoggedIn: true,
    },
    errors: {
      types: [Error, NotFoundError, UnauthorizedError],
    },
    args: {
      postId: t.arg({
        type: "Int",
        required: true,
        description: "ID",
      }),
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
      } else {
        const foundPost = await prisma.post.findUnique({
          where: {
            id: args.postId,
          },
        });
        if (!foundPost) {
          throw new NotFoundError("post");
        } else if (foundPost.authorId !== foundUser.id) {
          throw new UnauthorizedError();
        } else {
          return await prisma.post.update({
            where: {
              id: args.postId,
            },
            data: {
              title: args.title,
              content: args.content ?? undefined,
            },
          });
        }
      }
    },
  });
});
