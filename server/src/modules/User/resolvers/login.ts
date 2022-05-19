import { PrismaClient } from "@prisma/client";
import { InvalidCredentialsError } from "../../Error/objects";
import { ZodError } from "zod";
import { builder } from "../../../builder";
import argon2 from "argon2";

const prisma = new PrismaClient({});

builder.mutationField("login", (t) => {
  return t.prismaField({
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
  });
});
