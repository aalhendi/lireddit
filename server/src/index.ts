require("dotenv").config();
const PORT = process.env.PORT || 8000;
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { PrismaClient } from "@prisma/client";
import { schema } from "./schema";
import fs from "fs";
import cors from "cors";
import session from "express-session";
import redis from "redis";
import connectRedis from "connect-redis";

if (!fs.existsSync("./.env")) {
  throw new Error("Cannot locate .env file in the root directory.");
}

const prisma = new PrismaClient();

async function main() {
  try {
    const app = express();

    const RedisStore = connectRedis(session);
    const redisClient = redis.createClient();

    const corsOptions = {
      // TODO: Origin in .env (?)
      origin: ["https://studio.apollographql.com", "http://localhost:3000"],
      credentials: true,
    };

    app.set("trust proxy", 1); //the following for trust proxy and the next app.use are about setting up cors. see https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    app.use(cors(corsOptions));
    app.use(
      session({
        name: "xrf",
        store: new RedisStore({
          client: redisClient,
          // disableTTL: true,
          disableTouch: true, // touching keeps connected user auth token active, disabling = can sit idle and not have auth expire. less secure
        }),
        cookie: {
          maxAge: 1000 * 60 * 60 * 24 * 365 * 5,
          httpOnly: true, // Dont alow JS to access this cookie
          sameSite: "lax", // CSRF stuff
          secure: process.env.NODE_ENV === "production", // HTTPS only. False until prod
          domain: undefined, // TODO: Change
        },
        saveUninitialized: false,
        secret: process.env.SECRET_KEY!,
        resave: false,
      })
    );
    async function startServer() {
      const apolloServer = new ApolloServer({
        schema: schema,
        debug: true, // TODO: Change in prod
        plugins: [
          ApolloServerPluginLandingPageGraphQLPlayground({
            // options
          }),
        ],
        context: async ({ req, res }) => ({
          req,
          res,
          // currentUser: await getUserFromAuthHeader(req.session.authorization), // Fetch user on demand via req.session.userId vs fetch user here
        }),
      });
      await apolloServer.start();
      apolloServer.applyMiddleware({
        app,
        path: "/graphql",
        cors: corsOptions,
      });
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
