import { PrismaClient } from "@prisma/client";
import { NotFoundError } from "../../Error/objects";
import { builder } from "../../../builder";

const prisma = new PrismaClient({});

builder.queryField("post", (t) => {
  return t.prismaField({
    type: "Post",
    errors: {
      types: [NotFoundError, Error],
      // directResult: true,
    },
    args: {
      id: t.arg({
        type: "Int",
        required: true,
        description: "ID",
      }),
    },
    resolve: async (_query, _root, args, _ctx, _info) => {
      const foundPost = await prisma.post.findUnique({
        // rejectOnNotFound: true,
        where: {
          id: args.id,
        },
      });
      if (foundPost) {
        return foundPost;
      } else {
        throw new NotFoundError("Post");
      }
    },
  });
});
