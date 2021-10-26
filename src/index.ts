require("dotenv").config();
const PORT = process.env.PORT || 8000;
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { PrismaClient } from "@prisma/client";
import { schema } from "./schema";

const prisma = new PrismaClient();

async function main() {
  try {
    const app = express();
    async function startServer() {
      const apolloServer = new ApolloServer({
        schema: schema,
      });
      await apolloServer.start();
      apolloServer.applyMiddleware({ app });
    }
    startServer();
    app.get("/", (_, res) => {
      res.send("/graphql");
    });
    app.listen(parseInt(PORT as string), () => {
      console.log(`Listening on port ${PORT}`);
    });
    // const post = await prisma.post.update({
    //   where: { id: 1 },
    //   data: { published: true },
    // });
    // console.log(post);

    // await prisma.user.create({
    //   data: {
    //     name: "Alice",
    //     email: "alice@prisma.io",
    //     posts: {
    //       create: { title: "Hello World" },
    //     },
    //     profile: {
    //       create: { bio: "I like turtles" },
    //     },
    //   },
    // });

    // const allUsers = await prisma.user.findMany({
    //   include: {
    //     posts: true,
    //     profile: true,
    //   },
    // });
    // console.dir(allUsers, { depth: null });

    // const allUsers = await prisma.user.findMany();
    // console.log(allUsers);
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
