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
        context: async ({}) => ({
          // This part is up to you!
          // TODO: Implement authenticated user stuff
          // currentUser: await getUserFromAuthHeader(req.headers.authorization),
        }),
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
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
