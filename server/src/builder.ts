import SchemaBuilder from "@pothos/core";
import ErrorsPlugin from "@pothos/plugin-errors";
import PrismaPlugin from "@pothos/plugin-prisma";
import PrismaTypes from "@pothos/plugin-prisma/generated"; // default generator location, can be changed in schema
import ScopeAuthPlugin from "@pothos/plugin-scope-auth";
import SimpleObjectsPlugin from "@pothos/plugin-simple-objects";
import ValidationPlugin from "@pothos/plugin-validation";
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
