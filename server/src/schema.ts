import SchemaBuilder from "@giraphql/core";
import { PrismaClient } from "@prisma/client";
import ErrorsPlugin from "@giraphql/plugin-errors";
import PrismaPlugin from "@giraphql/plugin-prisma";
import ValidationPlugin from "@giraphql/plugin-validation";
import PrismaTypes from "@giraphql/plugin-prisma/generated"; // default generator location, can be changed in schema
import argon2 from "argon2";
import { ZodFormattedError, ZodError } from "zod";

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
    req: Express.Request;
    res: Express.Response;
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
    super(`${fieldName} Not found`);
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
    /* User Mutations */
    register: t.prismaField({
      type: "User",
      errors: {
        types: [ZodError],
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
        const hashedPassword = await argon2.hash(args.password);
        // TODO: Handle duplicate unique constraint, maybe trycatch
        const newUser = await prisma.user.create({
          data: {
            ...args,
            password: hashedPassword,
          },
        });
        ctx.req.session.userId = newUser.id;
        return newUser;
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
  }),
});

export const schema = builder.toSchema({});
