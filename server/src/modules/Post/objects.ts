import { PrismaClient } from "@prisma/client";
import { builder } from "../../builder";
import { fetchPosts } from "./resolvers/posts";

const prisma = new PrismaClient({});

export const PostObject = builder.prismaObject("Post", {
  findUnique: (p) => ({ id: p.id }),
  fields: (t) => ({
    id: t.exposeID("id"),
    title: t.exposeString("title"),
    content: t.exposeString("content", { nullable: true }),
    snippet: t.string({
      nullable: true,
      resolve: (root, _args, _ctx, _info) => {
        return root.content?.slice(0, 50);
      },
    }),
    points: t.exposeInt("points"),
    author: t.relation("author", {
      resolve: async (_query, post) => {
        return await prisma.user.findUnique({
          where: { id: post.authorId },
          rejectOnNotFound: true,
        });
      },
    }),
  }),
});

export const PaginatedPosts = builder.simpleObject("PaginatedPosts", {
  fields: (t) => ({
    hasMore: t.boolean({
      nullable: false,
    }),
    data: t.prismaField({
      type: ["Post"],
      errors: {
        types: [Error],
      },
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
      resolve: async (_query, _root, args, _ctx, _info) => {
        const result = await fetchPosts(args);
        return result.data;
      },
    }),
  }),
});
