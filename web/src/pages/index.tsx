import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@chakra-ui/alert";
import { CloseButton } from "@chakra-ui/close-button";
import { Box, Center, Heading, Link, Stack, Text } from "@chakra-ui/layout";
import type { NextPage } from "next";
import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import { title } from "process";
import React from "react";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

const Home: NextPage = () => {
  const [error, setError] = React.useState<string | null>(null);
  const [posts, setPosts] = React.useState<JSX.Element[] | null>(null); // Will set type later, for now its type Element[]
  const [{ fetching: postsFetching, data }] = usePostsQuery({
    variables: {
      limit: 10,
    },
  });

  React.useEffect(() => {
    if (data?.posts.__typename === "QueryPostsSuccess" && !postsFetching) {
      setPosts(
        data.posts.data.map((p) => (
          <>
            <Box p={5} shadow="md" borderWidth="1px">
              <Heading fontSize="xl">{p.title}</Heading>
              {/* TODO: Field resolver in backend to return textSnippet instead of loading all text and splicing on front end */}
              <Text mt={4}>{p.content?.slice(0, 50)}</Text>
            </Box>
          </>
        ))
      );
    } else if (data?.posts.__typename === "BaseError") {
      setError("Could not fetch posts");
    }
  }, [data?.posts, postsFetching]);

  return (
    <>
      {error && (
        <Alert status="error">
          <AlertIcon />
          <AlertTitle mr={2}>Error:</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <CloseButton position="absolute" right="8px" top="8px" />
        </Alert>
      )}
      <Center>
        <Link as={NextLink} href={"/create-post"} passHref>
          <Text fontWeight={"bold"}>Create Post</Text>
        </Link>
      </Center>

      <Box>
        {postsFetching ? (
          <Text>Loading</Text>
        ) : (
          <Stack spacing={8}>{posts}</Stack>
        )}
      </Box>
    </>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Home);
