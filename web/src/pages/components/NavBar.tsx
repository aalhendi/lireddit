import { Box, Flex, Heading, Link, Text } from "@chakra-ui/layout";
import React from "react";
import { useRouter } from "next/router";
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from "../../generated/graphql";
import { Button } from "@chakra-ui/button";
import { isServer } from "../../utils/isServer";
import { useApolloClient } from "@apollo/client";

interface NavBarProps {}

const NavBar: React.FC<NavBarProps> = ({}) => {
  const router = useRouter();
  const isActive = router.pathname === "/";
  const { data, loading: meLoading } = useMeQuery({ skip: isServer() });
  const [logout, { loading: logoutLoading }] = useLogoutMutation();
  const apolloClient = useApolloClient();

  let links = null;
  if (meLoading) {
    /* Data is still fetching */
    links = null;
  } else if (data?.me) {
    /* User logged in */
    links = (
      <Flex>
        <Text mr={2}>Hello {data.me.email}</Text>
        <Button
          variant={"link"}
          onClick={async () => {
            logout();
            await apolloClient.resetStore();
          }}
          isLoading={logoutLoading}
        >
          <Text color={"blue"}>Logout</Text>
        </Button>
      </Flex>
    );
  } else {
    /* User not logged in */
    links = (
      <Flex>
        <Box mx={3}>
          <Link
            color={isActive ? "black" : "red"}
            as={NextLink}
            href={"/login"}
            passHref
          >
            Login
          </Link>
        </Box>
        <Box mx={3}>
          <Link
            color={isActive ? "black" : "red"}
            as={NextLink}
            href={"/register"}
            passHref
          >
            Register
          </Link>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex bg={"gray.100"} p={4}>
      <Box>
        <Heading size={"md"} as={"h4"}>
          <Link as={NextLink} href={"/"} passHref>
            lireddit
          </Link>
        </Heading>
      </Box>
      <Box ml={"auto"}>{links}</Box>
    </Flex>
  );
};

export default NavBar;
