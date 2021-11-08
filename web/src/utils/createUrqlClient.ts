import { dedupExchange, errorExchange, fetchExchange, Provider } from "urql";
import { cacheExchange } from "@urql/exchange-graphcache";
import { betterUpdateQuery } from "./betterUpdateQuery";
import {
  LoginMutation,
  MeQuery,
  MeDocument,
  RegisterMutation,
  LogoutMutation,
} from "../generated/graphql";

export const createUrqlClient = (ssrExchange: any) => ({
  url: "http://localhost:8000/graphql",
  fetchOptions: {
    credentials: "include" as const,
  },
  exchanges: [
    dedupExchange,
    cacheExchange({
      updates: {
        Mutation: {
          login(_result, args, cache, info) {
            betterUpdateQuery<LoginMutation, MeQuery | undefined>(
              cache,
              { query: MeDocument },
              _result,
              (result, query) => {
                if (result.login.__typename?.toLowerCase().includes("error")) {
                  return query;
                } else if (result.login.__typename === "MutationLoginSuccess") {
                  return {
                    me: result.login.data,
                  };
                }
              }
            );
          },
          register(_result, args, cache, info) {
            betterUpdateQuery<RegisterMutation, MeQuery | undefined>(
              cache,
              { query: MeDocument },
              _result,
              (result, query) => {
                if (
                  result.register.__typename?.toLowerCase().includes("error")
                ) {
                  return query;
                } else if (
                  result.register.__typename === "MutationRegisterSuccess"
                ) {
                  return {
                    me: result.register.data,
                  };
                }
              }
            );
          },
          logout(_result, args, cache, info) {
            betterUpdateQuery<LogoutMutation, MeQuery | undefined>(
              cache,
              { query: MeDocument },
              _result,
              () => {
                return {
                  me: null,
                };
              }
            );
          },
        },
      },
    }),
    ssrExchange,
    errorExchange({
      onError(error) {
        console.error(error);
      },
    }),
    fetchExchange,
  ],
});
