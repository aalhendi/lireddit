import { InputFieldRef, InputShapeFromFields } from "@giraphql/core";
import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";
import { v4 as uuidv4 } from "uuid";
import { ZodError } from "zod";
import { builder } from "./builder";
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from "./constants";
import {
  AlreadyExistsError,
  InvalidCredentialsError,
  NotFoundError,
  UnauthorizedError,
} from "./modules/Error/objects";
import { redis } from "./redis";
import { sendEmail } from "./utils/sendEmail";

const prisma = new PrismaClient({});

// TODO: Refactor and remove redundant code
// TODO: Backend permission conditional. Post owner can see own email but others shouldnt be able to

export const UserObject = builder.prismaObject("User", {
  name: "User", // Optional, default = prisma model
  findUnique: null,
  fields: (t) => ({
    id: t.exposeID("id"),
    email: t.exposeString("email"),
    name: t.exposeString("name", { nullable: true }),
  }),
});

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

const fetchPosts = async (
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

const PaginatedPosts = builder.simpleObject("PaginatedPosts", {
  fields: (t) => ({
    hasMore: t.boolean({
      nullable: false,
    }),
    data: t.prismaField({
      // TODO: Add Snippet field in return instead of showing all of the content
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

builder.queryField("posts", (t) => {
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

builder.queryType({
  fields: (t) => ({
    ping: t.string({
      resolve: () => "pong",
    }),
  }),
});

builder.mutationType({
  fields: (t) => ({
    /* Votes */
    // TODO: Add isVoted <true | false | null> to return thing... then use that in Front End to color the chevron icons
    vote: t.boolean({
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
    }),

    /* User Mutations */
    register: t.prismaField({
      type: "User",
      errors: {
        types: [ZodError, AlreadyExistsError],
      },
      args: {
        email: t.arg({
          type: "String",
          required: true,
          description: "E-mail Adress",
          validate: {
            email: [true, { message: "Must be a valid e-mail address." }],
          },
        }),
        password: t.arg({
          type: "String",
          required: true,
          description: "Password",
          validate: {
            type: "string",
            minLength: [6, { message: "Minimum password length is 6." }],
          },
          // TODO: Use a Zod schema or a regex for password validation
        }),
        name: t.arg({
          type: "String",
          required: false,
          description: "Name",
        }),
      },
      resolve: async (_query, _root, args, ctx, _info) => {
        const foundUser = await prisma.user.findUnique({
          where: {
            email: args.email,
          },
        });
        if (foundUser) {
          throw new AlreadyExistsError("email");
        } else {
          const hashedPassword = await argon2.hash(args.password);
          const newUser = await prisma.user.create({
            data: {
              ...args,
              password: hashedPassword,
            },
          });
          ctx.req.session.userId = newUser.id;
          return newUser;
        }
      },
    }),
    login: t.prismaField({
      type: "User",
      errors: {
        types: [InvalidCredentialsError, ZodError],
        // TODO: Remove intermediary object inside "data": from response
        // TODO: Have Error in an Errors object (?)
      },
      args: {
        email: t.arg({
          type: "String",
          required: true,
          description: "E-mail Adress",
          validate: {
            // TODO: Reformat validation messages. Match format with Errors from Error Plugin
            email: [true, { message: "Must be valid e-mail address." }],
          },
        }),
        password: t.arg({
          type: "String",
          required: true,
          description: "Password",
        }),
      },
      resolve: async (_query, _root, args, ctx, _info) => {
        const foundUser = await prisma.user.findUnique({
          where: {
            email: args.email,
          },
        });
        if (foundUser) {
          const passwordMatch = await argon2.verify(
            foundUser.password,
            args.password
          );
          if (passwordMatch) {
            ctx.req.session.userId = foundUser.id;
            return foundUser;
          } else {
            throw new InvalidCredentialsError();
          }
        } else {
          throw new InvalidCredentialsError();
        }
      },
    }),
    logout: t.boolean({
      resolve: (_parent, {}, { req, res }): Promise<boolean> => {
        return new Promise((resolve) =>
          req.session.destroy((err) => {
            res.clearCookie(COOKIE_NAME);
            if (err) {
              console.log(err);
              resolve(false);
              return;
            }
            resolve(true);
          })
        );
      },
    }),
    forgotPassword: t.boolean({
      args: {
        email: t.arg({
          type: "String",
          required: true,
          description: "E-mail address",
          validate: {
            email: [true, { message: "Must be valid e-mail address." }],
          },
        }),
      },
      errors: {
        types: [ZodError],
      },
      resolve: async (_parent, args, _ctx) => {
        const foundUser = await prisma.user.findUnique({
          where: {
            email: args.email,
          },
        });
        if (!foundUser) {
          // Exist early but always return true to prevent malicous actors
          return true;
        }
        const token = uuidv4();
        await redis.set(
          `${FORGOT_PASSWORD_PREFIX}:${token}`,
          foundUser.id,
          "ex",
          1000 * 60 * 60 * 24 //24 hour token validity
        );
        await sendEmail(
          args.email,
          // TODO: Better HTML please
          `<a href="${process.env.FRONT_END_URL}/change-password/${token}"> Reset Password`
        );
        return true;
      },
    }),
    changePassword: t.prismaField({
      type: "User",
      args: {
        token: t.arg({
          type: "String",
          required: true,
          description: "UUID Reset Token",
        }),
        newPassword: t.arg({
          type: "String",
          required: true,
          description: "New password",
          validate: {
            type: "string",
            minLength: [6, { message: "Minimum password length is 6." }],
          },
        }),
      },
      errors: {
        types: [NotFoundError, ZodError],
      },
      resolve: async (_query, _root, args, ctx, _info) => {
        const userId = await redis.get(
          `${FORGOT_PASSWORD_PREFIX}:${args.token}`
        );
        if (!userId) {
          throw new NotFoundError("token");
        }
        const foundUser = await prisma.user.findUnique({
          where: {
            id: parseInt(userId),
          },
        });
        if (foundUser) {
          const hashedPassword = await argon2.hash(args.newPassword);
          const updatedUser = prisma.user.update({
            where: {
              id: foundUser.id,
            },
            data: {
              password: hashedPassword,
            },
          });

          /* Also log in user after password reset and invalidate the token */
          ctx.req.session.userId = foundUser.id;
          await redis.del(`${FORGOT_PASSWORD_PREFIX}:${args.token}`);

          return updatedUser;
        } else {
          throw new NotFoundError("user");
        }
      },
    }),
  }),
});

export const schema = builder.toSchema({});
