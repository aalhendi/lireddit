import "../styles/globals.css";
import * as React from "react";
import type { AppProps } from "next/app";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { createClient, dedupExchange, fetchExchange, Provider } from "urql";
import { Cache, cacheExchange, QueryInput } from "@urql/exchange-graphcache";
import Layout from "./components/Layout";
import {
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  RegisterMutation,
} from "../generated/graphql";

function betterUpdateQuery<Result, Query>(
  cache: Cache,
  queryInput: QueryInput,
  result: any,
  fn: (result: Result, query: Query) => Query
) {
  return cache.updateQuery(queryInput, (data) => {
    return fn(result, data as any) as any;
  });
}

const client = createClient({
  url: "http://localhost:8000/graphql",
  fetchOptions: {
    credentials: "include",
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
    fetchExchange,
  ],
});

// 2. Extend the theme to include custom colors, fonts, etc
const colors = {
  brand: {
    900: "#1a365d",
    800: "#153e75",
    700: "#2a69ac",
  },
};
const theme = extendTheme({ colors });

export default function App({ Component, pageProps }: AppProps) {
  // 2. Use at the root of your app
  return (
    <Provider value={client}>
      <ChakraProvider theme={theme}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ChakraProvider>
    </Provider>
  );
}
