import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import type { AppProps } from "next/app";
import * as React from "react";
import { PostsQuery, PostsQueryResult } from "../generated/graphql";
import "../styles/globals.css";
import Layout from "./components/Layout";

// 2. Extend the theme to include custom colors, fonts, etc
const colors = {
  brand: {
    900: "#1a365d",
    800: "#153e75",
    700: "#2a69ac",
  },
};
const theme = extendTheme({ colors });

const client = new ApolloClient({
  uri: "http://localhost:8000/graphql",
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          posts: {
            keyArgs: [],
            // TODO: Types? Why does this skip the intermediate object (ie. existing.posts.__typename)
            merge(existing: any | undefined, incoming: any): PostsQuery {
              if (incoming.__typename === "QueryPostsSuccess") {
                return {
                  ...incoming,
                  data:
                    existing?.__typename === "QueryPostsSuccess"
                      ? [...existing.data, ...incoming.data]
                      : incoming.data,
                };
              } else {
                return incoming;
              }
            },
          },
        },
      },
    },
  }),
  credentials: "include",
});

export default function App({ Component, pageProps }: AppProps) {
  // 2. Use at the root of your app
  return (
    <ApolloProvider client={client}>
      <ChakraProvider theme={theme}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ChakraProvider>
    </ApolloProvider>
  );
}
