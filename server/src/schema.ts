import SchemaBuilder from "@giraphql/core";
import { PrismaClient } from "@prisma/client";
import ErrorsPlugin from "@giraphql/plugin-errors";
import PrismaPlugin from "@giraphql/plugin-prisma";
import ValidationPlugin from "@giraphql/plugin-validation";
import PrismaTypes from "@giraphql/plugin-prisma/generated"; // default generator location, can be changed in schema
import argon2 from "argon2";
import { ZodFormattedError, ZodError } from "zod";
import express from "express";
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from "./constants";
import { sendEmail } from "./utils/sendEmail";
import { v4 as uuidv4 } from "uuid";
import { redis } from "./redis";

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
    req: express.Request;
    res: express.Response;
  };
}>({
  plugins: [ErrorsPlugin, ValidationPlugin, PrismaPlugin],
  prisma: {
    client: prisma,
  },
});

const ErrorInterface = builder.interfaceRef<Error>("Error").implement({
  fields: (t) => ({
    message: t.exposeString("message"),
  }),
});

builder.objectType(Error, {
  name: "BaseError",
  isTypeOf: (obj) => obj instanceof Error,
  interfaces: [ErrorInterface],
});

class LengthError extends Error {
  fieldName: string;
  minLength: number;
  constructor(fieldName: string, minLength: number) {
    super(`${fieldName} length should be at least ${minLength}`);
    this.minLength = minLength;
    this.fieldName = fieldName;
    this.name = "LengthError";
  }
}

class NotFoundError extends Error {
  fieldName: string;
  constructor(fieldName: string) {
    super(`${fieldName} not found`);
    this.fieldName = fieldName;
    this.name = "NotFoundError";
  }
}

class InvalidCredentialsError extends Error {
  constructor() {
    super(`Invalid Credentials`);
    this.name = "NotFoundError";
  }
}

class AlreadyExistsError extends Error {
  fieldName: string;
  constructor(fieldName: string) {
    super(`${fieldName} already exists`);
    this.fieldName = fieldName;
    this.name = "AlreadyExistsError";
  }
}

builder.objectType(LengthError, {
  name: "LengthError",
  interfaces: [ErrorInterface],
  isTypeOf: (obj) => obj instanceof LengthError,
  fields: (t) => ({
    minLength: t.exposeInt("minLength"),
    fieldName: t.exposeString("fieldName"),
  }),
});

builder.objectType(NotFoundError, {
  name: "NotFoundError",
  interfaces: [ErrorInterface],
  isTypeOf: (obj) => obj instanceof NotFoundError,
  fields: (t) => ({
    fieldName: t.exposeString("fieldName"),
  }),
});

builder.objectType(InvalidCredentialsError, {
  name: "InvalidCredentialsError",
  interfaces: [ErrorInterface],
  isTypeOf: (obj) => obj instanceof InvalidCredentialsError,
});

builder.objectType(AlreadyExistsError, {
  name: "AlreadyExistsError",
  interfaces: [ErrorInterface],
  isTypeOf: (obj) => obj instanceof AlreadyExistsError,
  fields: (t) => ({
    fieldName: t.exposeString("fieldName"),
  }),
});

// Util for flattening zod errors into something easier to represent in your Schema.
function flattenErrors(
  error: ZodFormattedError<unknown>,
  path: string[]
): { path: string[]; message: string }[] {
  // eslint-disable-next-line no-underscore-dangle
  const errors = error._errors.map((message) => ({
    path,
    message,
  }));
  Object.keys(error).forEach((key) => {
    if (key !== "_errors") {
      errors.push(
        ...flattenErrors(
          (error as Record<string, unknown>)[key] as ZodFormattedError<unknown>,
          [...path, key]
        )
      );
    }
  });
  return errors;
}
// A type for the individual validation issues
const ZodFieldError = builder
  .objectRef<{
    message: string;
    path: string[];
  }>("ZodFieldError")
  .implement({
    fields: (t) => ({
      message: t.exposeString("message"),
      path: t.exposeStringList("path"),
    }),
  });
// The actual error type
builder.objectType(ZodError, {
  name: "ZodError",
  interfaces: [ErrorInterface],
  isTypeOf: (obj) => obj instanceof ZodError,
  fields: (t) => ({
    fieldErrors: t.field({
      type: [ZodFieldError],
      resolve: (err) => flattenErrors(err.format(), []),
    }),
  }),
});

builder.prismaObject("User", {
  name: "User", // Optional, default = prisma model
  findUnique: null,
  fields: (t) => ({
    id: t.exposeID("id"),
    email: t.exposeString("email"),
    name: t.exposeString("name", { nullable: true }),
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
    posts: t.prismaField({
      type: ["Post"],
      resolve: async () => await prisma.post.findMany({}),
    }),
    post: t.prismaField({
      type: "Post",
      errors: {
        types: [NotFoundError],
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
    }),
    me: t.prismaField({
      type: "User",
      // TODO: Change to unauthorized error (?)
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
    }),
  }),
});

builder.mutationType({
  fields: (t) => ({
    /* Post Mutations */
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
      errors: {
        types: [NotFoundError],
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
          where: {
            id: args.id,
          },
        });
        if (foundPost) {
          return await prisma.post.delete({
            where: {
              id: args.id,
            },
          });
        } else {
          throw new NotFoundError("id");
        }
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
          // rejectOnNotFound: true,
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
          // User doesnt exist. But how to prevent malicious actors?
          // TODO: Maybe have a response like: "if this user exists, we'll mail you"
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
