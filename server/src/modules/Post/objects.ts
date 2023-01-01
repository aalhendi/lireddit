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
    voteStatus: t.boolean({
      nullable: true,
      resolve: async (root, _args, ctx, _info) => {
        if (ctx.req.session.userId) {
          const foundVote = await prisma.usersOnPosts.findUnique({
            where: {
              postId_userId: {
                postId: root.id,
                userId: ctx.req.session.userId,
              },
            },
          });
          return foundVote?.value;
        } else {
          return null;
        }
      },
    }),
    author: t.relation("author", {
      resolve: async (_query, post) => {
        return await prisma.user.findUniqueOrThrow({
          where: { id: post.authorId },
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
