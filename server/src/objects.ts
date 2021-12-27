import { PrismaClient } from "@prisma/client";
import { builder } from "./builder";
import { ZodError } from "zod";
import { flattenErrors } from "./utils/flattenErrors";

const prisma = new PrismaClient({});

export const UserObject = builder.prismaObject("User", {
  name: "User", // Optional, default = prisma model
  findUnique: null,
  fields: (t) => ({
    id: t.exposeID("id"),
    email: t.exposeString("email"),
    name: t.exposeString("name", { nullable: true }),
  }),
});

// export const UserOnPostsObject = builder.prismaObject("UsersOnPosts", {
//   name: "UsersOnPosts", // Optional, default = prisma model
//   findUnique: null,
//   fields: (t) => ({
//     postId: t.exposeID("postId"),
//     userId: t.exposeID("userId"),
//   }),
// });

export const PostObject = builder.prismaObject("Post", {
  findUnique: null,
  fields: (t) => ({
    id: t.exposeID("id"),
    title: t.exposeString("title"),
    content: t.exposeString("content", { nullable: true }),
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

const ErrorInterface = builder.interfaceRef<Error>("Error").implement({
  fields: (t) => ({
    message: t.exposeString("message"),
  }),
});

export const BaseErrorObject = builder.objectType(Error, {
  name: "BaseError",
  isTypeOf: (obj) => obj instanceof Error,
  interfaces: [ErrorInterface],
});

export class LengthError extends Error {
  fieldName: string;
  minLength: number;
  constructor(fieldName: string, minLength: number) {
    super(`${fieldName} length should be at least ${minLength}`);
    this.minLength = minLength;
    this.fieldName = fieldName;
    this.name = "LengthError";
  }
}

export class NotFoundError extends Error {
  fieldName: string;
  constructor(fieldName: string) {
    super(`${fieldName} not found`);
    this.fieldName = fieldName;
    this.name = "NotFoundError";
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super(`Invalid Credentials`);
    this.name = "NotFoundError";
  }
}

export class AlreadyExistsError extends Error {
  fieldName: string;
  constructor(fieldName: string) {
    super(`${fieldName} already exists`);
    this.fieldName = fieldName;
    this.name = "AlreadyExistsError";
  }
}

export class UnauthorizedError extends Error {
  constructor() {
    super(`Unauthorized`);
    this.name = "UnauthorizedError";
  }
}

export const LengthErrorObject = builder.objectType(LengthError, {
  name: "LengthError",
  interfaces: [ErrorInterface],
  isTypeOf: (obj) => obj instanceof LengthError,
  fields: (t) => ({
    minLength: t.exposeInt("minLength"),
    fieldName: t.exposeString("fieldName"),
  }),
});

export const NotFoundErrorObject = builder.objectType(NotFoundError, {
  name: "NotFoundError",
  interfaces: [ErrorInterface],
  isTypeOf: (obj) => obj instanceof NotFoundError,
  fields: (t) => ({
    fieldName: t.exposeString("fieldName"),
  }),
});

export const InvalidCredentialsErrorObject = builder.objectType(
  InvalidCredentialsError,
  {
    name: "InvalidCredentialsError",
    interfaces: [ErrorInterface],
    isTypeOf: (obj) => obj instanceof InvalidCredentialsError,
  }
);

export const AlreadyExistsErrorObject = builder.objectType(AlreadyExistsError, {
  name: "AlreadyExistsError",
  interfaces: [ErrorInterface],
  isTypeOf: (obj) => obj instanceof AlreadyExistsError,
  fields: (t) => ({
    fieldName: t.exposeString("fieldName"),
  }),
});

export const UnauthorizedErrorObject = builder.objectType(UnauthorizedError, {
  name: "UnauthorizedError",
  interfaces: [ErrorInterface],
  isTypeOf: (obj) => obj instanceof UnauthorizedError,
});

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
