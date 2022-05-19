import { builder } from "../../builder";

export const UserObject = builder.prismaObject("User", {
  name: "User", // Optional, default = prisma model
  findUnique: null,
  fields: (t) => ({
    id: t.exposeID("id"),
    email: t.exposeString("email"),
    name: t.exposeString("name", { nullable: true }),
  }),
});
