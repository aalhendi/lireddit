import SchemaBuilder from "@giraphql/core";
import { PrismaClient } from "@prisma/client";
import PrismaPlugin from "@giraphql/plugin-prisma";
// This is the default location for the generator, but this can be customized as described above
import PrismaTypes from "@giraphql/plugin-prisma/generated";

const prisma = new PrismaClient({});

// TODO: Refactor

class User {
  userId: string;
  firstName: string;
  username: string;
  constructor(id: string, firstName: string, username: string) {
    this.userId = id;
    this.firstName = firstName;
    this.username = username;
  }
}

const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes;
  Context: {
    currentUser: User;
  };
}>({
  plugins: [PrismaPlugin],
  prisma: {
    client: prisma,
  },
});

builder.prismaObject("User", {
  // Optional name for the object, defaults to the name of the prisma model
  name: "PostAuthor",
  findUnique: null,
  fields: (t) => ({
    id: t.exposeID("id"),
    email: t.exposeString("email"),
  }),
});
builder.prismaObject("Post", {
  findUnique: null,
  fields: (t) => ({
    id: t.exposeID("id"),
    title: t.exposeString("title"),
    content: t.exposeString("content", { nullable: true }),
  }),
});

builder.queryType({
  fields: (t) => ({
    // me: t.prismaField({
    //   type: "User",
    //   resolve: async (query, root, args, ctx, info) =>
    //     prisma.user.findUnique({
    //       ...query,
    //       rejectOnNotFound: true,
    //       where: { id: ctx.currentUser.userId as any },
    //     }),
    // }),
    posts: t.prismaField({
      type: ["Post"],
      resolve: async () => await prisma.post.findMany({}),
    }),
    post: t.prismaField({
      type: "Post",
      args: {
        id: t.arg({
          type: "Int",
          required: true,
          description: "ID",
        }),
      },
      resolve: async (_query, _root, args, _ctx, _info) =>
        await prisma.post.findUnique({
          rejectOnNotFound: true,
          where: {
            id: args.id,
          },
        }),
    }),
  }),
});

builder.mutationType({
  fields: (t) => ({
    createPost: t.prismaField({
      type: "Post",
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
        authorId: t.arg({
          type: "Int",
          required: true,
          description: "Author ID",
        }),
      },
      resolve: async (_query, _root, args, _ctx, _info) =>
        await prisma.post.create({
          data: {
            title: args.title,
            content: args.content,
            authorId: args.authorId,
          },
        }),
    }),
    updatePost: t.prismaField({
      type: "Post",
      args: {
        id: t.arg({
          type: "Int",
          required: true,
          description: "ID",
        }),
        title: t.arg({
          type: "String",
          required: false,
          description: "Title",
        }),
        content: t.arg({
          type: "String",
          required: false,
          description: "Content",
        }),
        authorId: t.arg({
          type: "Int",
          required: false,
          description: "Author ID",
        }),
      },
      resolve: async (_query, _root, args, _ctx, _info) =>
        await prisma.post.update({
          where: {
            id: args.id,
          },
          data: {
            ...args,
            title: args.title ?? undefined,
            authorId: args.authorId ?? undefined,
          },
        }),
    }),
    deletePost: t.prismaField({
      type: "Post",
      args: {
        id: t.arg({
          type: "Int",
          required: true,
          description: "ID",
        }),
      },
      resolve: async (_query, _root, args, _ctx, _info) =>
        await prisma.post.delete({
          where: {
            id: args.id,
          },
        }),
    }),
  }),
});

export const schema = builder.toSchema({});
