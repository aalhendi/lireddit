import SchemaBuilder from "@giraphql/core";
import ErrorsPlugin from "@giraphql/plugin-errors";
import PrismaPlugin from "@giraphql/plugin-prisma";
import PrismaTypes from "@giraphql/plugin-prisma/generated"; // default generator location, can be changed in schema
import ScopeAuthPlugin from "@giraphql/plugin-scope-auth";
import SimpleObjectsPlugin from "@giraphql/plugin-simple-objects";
import ValidationPlugin from "@giraphql/plugin-validation";
import { PrismaClient } from "@prisma/client";
import express from "express";

class User {
  userId: string;
  firstName: string;
  username: string;
  constructor(id: string, firstName: string, username: string) {
    this.userId = id;
    this.firstName = firstName;
    this.username = username;
  }
}

const prisma = new PrismaClient({});

export const builder = new SchemaBuilder<{
  PrismaTypes: PrismaTypes;
  Context: {
    currentUser: User;
    req: express.Request;
    res: express.Response;
  };
  // Types used for scope parameters
  AuthScopes: {
    isLoggedIn: boolean;
  };
}>({
  plugins: [
    ErrorsPlugin,
    ScopeAuthPlugin,
    ValidationPlugin,
    PrismaPlugin,
    SimpleObjectsPlugin,
  ],
  prisma: {
    client: prisma,
  },
  // scope initializer, create the scopes and scope loaders for each request
  authScopes: async (context) => ({
    isLoggedIn: !!context.req.session.userId,
  }),
});
