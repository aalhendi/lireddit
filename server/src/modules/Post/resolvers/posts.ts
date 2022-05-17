import { InputFieldRef, InputShapeFromFields } from "@pothos/core";
import { PrismaClient } from "@prisma/client";
import { builder } from "../../../builder";
import { PaginatedPosts } from "../objects";

const prisma = new PrismaClient({});

export const posts = builder.queryField("posts", (t) => {
  return t.field({
    type: PaginatedPosts,
    args: {
      cursor: t.arg({
        type: "ID",
        description: "Pointer to start from",
        required: false,
      }),
      limit: t.arg({
        type: "Int",
        description: "Number of posts to fetch",
        required: true,
      }),
    },
    resolve: async (_root, args, _ctx, _info) => {
      return await fetchPosts(args);
    },
  });
});

export const fetchPosts = async (
  args: InputShapeFromFields<{
    cursor: InputFieldRef<string | number | null | undefined, "Arg">;
    limit: InputFieldRef<number, "Arg">;
  }>
) => {
  args.limit = Math.min(50, args.limit); // Pull user limit or 50 as hard-cap
  if (args.cursor) {
    const secondQuery = await prisma.post.findMany({
      orderBy: { createdAt: "asc" },
      take: args.limit + 1, // Take one extra to check if more exist
      skip: 1, // Skip the cursor
      cursor: {
        id:
          typeof args.cursor === "string" ? parseInt(args.cursor) : args.cursor,
      },
    });
    return {
      hasMore: secondQuery.length === args.limit + 1,
      data: secondQuery.slice(0, args.limit),
    };
  }
  const firstQuery = await prisma.post.findMany({
    orderBy: { createdAt: "asc" },
    take: args.limit + 1,
  });
  return {
    hasMore: firstQuery.length === args.limit + 1,
    data: firstQuery.slice(0, args.limit),
  };
};
