import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import type { AppProps } from "next/app";
import * as React from "react";
import { PaginatedPosts, PostsQuery } from "../generated/graphql";
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
  //TODO: Move this to an environment variable
  uri: "http://localhost:8000/graphql",
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          posts: {
            keyArgs: [],
            // TODO: Find out why this isnt working and fix pagination
            merge(existing = [], incoming: any) {
              // console.log(incoming, incoming['data({"limit":10})']);
              console.log(existing, incoming);
              const result = {
                ...incoming,
                'data({"limit":10})': {
                  data: [
                    ...(existing['data({"limit":10})']?.data || []),
                    ...(incoming['data({"limit":10})'].__typename ===
                    "PaginatedPostsDataSuccess"
                      ? incoming['data({"limit":10})'].data
                      : []),
                  ],
                },
              };
              // result.data = result['data({"limit":10})']; // on object create new key name. Assign old value to this
              // delete result['data({"limit":10})'];
              console.log(result);
              return result;
            },
          },
        },
      },
    },
  }),
  credentials: "include",
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ApolloProvider client={client}>
      <ChakraProvider theme={theme}>
        <Layout pageProps={pageProps}>
          <Component {...pageProps} />
        </Layout>
      </ChakraProvider>
    </ApolloProvider>
  );
}
