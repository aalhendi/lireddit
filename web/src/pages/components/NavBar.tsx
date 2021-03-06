import { useApolloClient } from "@apollo/client";
import { Button } from "@chakra-ui/button";
import { AddIcon } from "@chakra-ui/icons";
import { Box, Flex, Heading, Link, Text } from "@chakra-ui/layout";
import { IconButton } from "@chakra-ui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import React from "react";
import { useLogoutMutation, useMeQuery } from "../../generated/graphql";

interface NavBarProps {
  pageProps: any;
}

const NavBar: React.FC<NavBarProps> = ({}) => {
  const router = useRouter();
  const isActive = router.pathname === "/";
  // During hydration `useEffect` is called. `window` is available in `useEffect`. In this case because we know we're in the browser checking for window is not needed. If you need to read something from window that is fine.
  // By calling `setIsServer` in `useEffect` a render is triggered after hydrating, this causes the "browser specific" value to be available. In this case 'red'.
  const [isServer, setIsServer] = React.useState<boolean>(true);

  React.useEffect(() => {
    setIsServer(false);
  }, []);

  const { data, loading: meLoading } = useMeQuery({ skip: isServer });
  const [logout, { loading: logoutLoading }] = useLogoutMutation();
  const apolloClient = useApolloClient();

  let links: JSX.Element | null = null;
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
            await logout();
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
    <Flex bg={"gray.100"} p={4} align={"center"}>
      <Box>
        <Heading size={"md"} as={"h4"}>
          <Link as={NextLink} href={"/"} passHref>
            lireddit
          </Link>
        </Heading>
      </Box>
      <Box ml={"auto"}>
        <Flex align={"center"}>
          <Link as={NextLink} href={"/create-post"} passHref>
            <IconButton aria-label={"Create Post"} icon={<AddIcon />} mr={4} />
          </Link>
          {links}
        </Flex>
      </Box>
    </Flex>
  );
};

export default NavBar;
