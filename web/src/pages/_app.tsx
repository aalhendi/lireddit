import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import type { AppProps } from "next/app";
import * as React from "react";
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

export default function App({ Component, pageProps }: AppProps) {
  // 2. Use at the root of your app
  return (
    <ChakraProvider theme={theme}>
      <Layout pageProps>
        <Component {...pageProps} />
      </Layout>
    </ChakraProvider>
  );
}
