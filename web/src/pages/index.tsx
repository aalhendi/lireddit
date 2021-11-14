import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@chakra-ui/alert";
import { Button } from "@chakra-ui/button";
import { CloseButton } from "@chakra-ui/close-button";
import { Box, Center, Heading, Link, Stack, Text } from "@chakra-ui/layout";
import { Spinner } from "@chakra-ui/spinner";
import type { NextPage } from "next";
import NextLink from "next/link";
import React from "react";
import { PostsQuery, usePostsQuery } from "../generated/graphql";

const Home: NextPage = () => {
  const [error, setError] = React.useState<string | null>(null);
  const {
    loading: postsLoading,
    data,
    fetchMore,
    variables,
  } = usePostsQuery({
    variables: {
      limit: 10,
      cursor: null,
    },
    notifyOnNetworkStatusChange: true,
  });

  const loadMore = () => {
    if (data?.posts.__typename === "QueryPostsSuccess") {
      fetchMore({
        variables: {
          limit: variables?.limit,
          cursor: data.posts.data[data.posts.data.length - 1].id,
        },
      });
    }
  };

  if (data?.posts.__typename === "BaseError") {
    setError("Could not fetch posts");
  }

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
        {postsLoading && !data ? (
          <Spinner />
        ) : (
          <Stack spacing={8}>
            {data?.posts.__typename === "QueryPostsSuccess"
              ? data.posts.data.map((p) => (
                  <>
                    <Box p={5} shadow="md" borderWidth="1px">
                      <Heading fontSize="xl">{p.title}</Heading>
                      {/* TODO: Field resolver in backend to return textSnippet instead of loading all text and splicing on front end */}
                      <Text mt={4}>{p.content?.slice(0, 50)}</Text>
                    </Box>
                  </>
                ))
              : null}
          </Stack>
        )}
        <Center>
          {data ? (
            <Button my={4} onClick={loadMore} isLoading={postsLoading}>
              Load More
            </Button>
          ) : null}
        </Center>
      </Box>
    </>
  );
};

export default Home;
