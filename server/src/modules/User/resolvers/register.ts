import { PrismaClient } from "@prisma/client";
import { AlreadyExistsError } from "../../Error/objects";
import { ZodError } from "zod";
import { builder } from "../../../builder";
import argon2 from "argon2";

const prisma = new PrismaClient({});

builder.mutationField("register", (t) => {
  return t.prismaField({
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
  });
});
