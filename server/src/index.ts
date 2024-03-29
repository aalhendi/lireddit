require("dotenv").config();
const PORT = process.env.PORT || 8000;
import express from "express";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "@apollo/server-plugin-landing-page-graphql-playground";
import { expressMiddleware } from "@apollo/server/express4";
import { PrismaClient } from "@prisma/client";
import { json } from "body-parser";
import { schema } from "./schema";
import fs from "fs";
import cors from "cors";
import session from "express-session";
import { redis } from "./redis";
import connectRedis from "connect-redis";
import { COOKIE_NAME, __prod__ } from "./constants";

if (!fs.existsSync("./.env")) {
  throw new Error("Cannot locate .env file in the root directory.");
}

const prisma = new PrismaClient();

async function main() {
  try {
    const app = express();

    const RedisStore = connectRedis(session);

    const corsOptions = {
      disableStats: true,
      origin: [process.env.FRONT_END_URL],
      credentials: true,
    };

    app.set("trust proxy", 1); //the following for trust proxy and the next app.use are about setting up cors. see https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    app.use(cors(corsOptions));
    app.use(
      session({
        name: COOKIE_NAME,
        store: new RedisStore({
          client: redis as any,
          // disableTTL: true,
          disableTouch: true, // touching keeps connected user auth token active, disabling = can sit idle and not have auth expire. less secure
        }),
        cookie: {
          maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie
          httpOnly: true, // Dont alow JS to access this cookie
          sameSite: "lax", // CSRF stuff
          secure: __prod__, // HTTPS only. False until prod
          domain: __prod__
            ? process.env.FRONT_END_URL // Cookie only to the domain in prod
            : undefined, // Set cookie anywhere req is sent
        },
        saveUninitialized: false,
        secret: process.env.SECRET_KEY,
        resave: false,
      })
    );
    async function startServer() {
      const apolloServer = new ApolloServer({
        csrfPrevention: true,
        schema: schema,
        includeStacktraceInErrorResponses: !__prod__,
        plugins: [
          ApolloServerPluginLandingPageGraphQLPlayground({
            // options
          }),
        ],
      });
      await apolloServer.start();
      app.use(
        "/graphql",
        cors<cors.CorsRequest>(corsOptions),
        json(),
        expressMiddleware(apolloServer, {
          context: async ({
            req,
            res,
          }: {
            req: express.Request;
            res: express.Response;
          }) => ({
            req,
            res,
            // currentUser: await getUserFromAuthHeader(req.session.authorization), // Fetch user on demand via req.session.userId vs fetch user here
          }),
        })
      );
    }
    startServer();
    app.get("/", (_, res) => {
      res.send("/graphql");
    });
    app.listen(parseInt(PORT), () => {
      console.log(`Listening on port ${PORT}`);
    });
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
