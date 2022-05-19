import { PrismaClient } from "@prisma/client";
import { ZodError } from "zod";
import { builder } from "../../../builder";
import { FORGOT_PASSWORD_PREFIX } from "../../../constants";
import { redis } from "../../../redis";
import { NotFoundError } from "../../Error/objects";
import argon2 from "argon2";

const prisma = new PrismaClient({});

builder.mutationField("changePassword", (t) => {
  return t.prismaField({
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
      const userId = await redis.get(`${FORGOT_PASSWORD_PREFIX}:${args.token}`);
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
  });
});
