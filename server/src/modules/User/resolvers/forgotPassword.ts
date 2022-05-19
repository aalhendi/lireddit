import { PrismaClient } from "@prisma/client";
import { ZodError } from "zod";
import { builder } from "../../../builder";
import { FORGOT_PASSWORD_PREFIX } from "../../../constants";
import { redis } from "../../../redis";
import { sendEmail } from "../../../utils/sendEmail";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient({});

builder.mutationField("forgotPassword", (t) => {
  return t.boolean({
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
        "EX",
        1000 * 60 * 60 * 24 //24 hour token validity
      );
      await sendEmail(
        args.email,
        // TODO: Better HTML please
        `<a href="${process.env.FRONT_END_URL}/change-password/${token}"> Reset Password`
      );
      return true;
    },
  });
});
