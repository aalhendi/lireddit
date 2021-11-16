import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@chakra-ui/alert";
import { Button } from "@chakra-ui/button";
import { CloseButton } from "@chakra-ui/close-button";
import {
  Box,
  Center,
  Flex,
  Heading,
  Link,
  Stack,
  Text,
} from "@chakra-ui/layout";
import { Spinner } from "@chakra-ui/spinner";
import type { NextPage } from "next";
import NextLink from "next/link";
import React from "react";
import { usePostsQuery } from "../generated/graphql";
import { SideVotes } from "./components/SideVotes";

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
          <Center>
            <Spinner />
          </Center>
        ) : (
          <Stack spacing={8}>
            {data?.posts.__typename === "QueryPostsSuccess"
              ? data.posts.data.map((p) => (
                  <>
                    <Flex p={5} shadow="md" borderWidth="1px">
                      <SideVotes post={p} />
                      {/* TODO: Refactor into component */}
                      <Link
                        as={NextLink}
                        href={`/post/${encodeURIComponent(p.id)}`}
                        passHref
                      >
                        <Box w={"full"}>
                          <Heading fontSize="xl">{p.title}</Heading>
                          {/* TODO: Add username and make this username */}
                          <Text>By: {p.author.email}</Text>
                          {/* TODO: Field resolver in backend to return textSnippet instead of loading all text and splicing on front end */}
                          <Text mt={4}>{p.content?.slice(0, 50)}</Text>
                        </Box>
                      </Link>
                    </Flex>
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

// TODO: SSR Home component
export default Home;
