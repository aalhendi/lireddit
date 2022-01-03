import { PrismaClient } from "@prisma/client";
import { builder } from "../../../builder";
import { NotFoundError } from "../../Error/objects";

const prisma = new PrismaClient({});

builder.mutationField("vote", (t) => {
  /* Votes */
  // TODO: Add isVoted <true | false | null> to return thing... then use that in Front End to color the chevron icons
  return t.boolean({
    args: {
      postId: t.arg({
        type: "Int",
        required: true,
        description: "Post ID",
      }),
      value: t.arg({
        type: "Boolean",
        required: true,
        description: "Upvote(True) or Downvote(False)",
      }),
    },
    authScopes: {
      isLoggedIn: true,
    },
    errors: {
      types: [Error, NotFoundError],
    },
    resolve: async (_parent, args, ctx) => {
      const foundUser = await prisma.user.findUnique({
        where: {
          id: ctx.req.session.userId,
        },
      });
      if (!foundUser) {
        throw new NotFoundError("user");
      }

      /* Check if user already voted on specific post */
      const foundVote = await prisma.usersOnPosts.findUnique({
        where: {
          postId_userId: { postId: args.postId, userId: foundUser.id },
        },
      });
      /* User hasnt voted */
      if (!foundVote) {
        await prisma.$transaction([
          prisma.usersOnPosts.create({
            data: {
              postId: args.postId,
              userId: foundUser.id,
              value: args.value,
            },
          }),
          prisma.post.update({
            where: {
              id: args.postId,
            },
            data: {
              points: { increment: args.value ? 1 : -1 },
            },
          }),
        ]);
        /* User changing vote */
      } else if (foundVote && foundVote.value !== args.value) {
        await prisma.$transaction([
          prisma.usersOnPosts.update({
            where: {
              postId_userId: { userId: foundUser.id, postId: args.postId },
            },
            data: {
              value: args.value,
            },
          }),
          prisma.post.update({
            where: {
              id: args.postId,
            },
            data: {
              /* double increment to undo prev vote and assign new one */
              points: { increment: args.value ? 2 : -2 },
            },
          }),
        ]);
        /* User not changing vote marked as "undo" */
      } else {
        await prisma.$transaction([
          prisma.usersOnPosts.delete({
            where: {
              postId_userId: {
                postId: args.postId,
                userId: foundUser.id,
              },
            },
          }),
          prisma.post.update({
            where: {
              id: args.postId,
            },
            data: {
              /* Inverse increment to undo current vote */
              points: { increment: args.value ? -1 : 1 },
            },
          }),
        ]);
      }
      return true;
    },
  });
});
