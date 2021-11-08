import type { NextPage } from "next";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { usePostsQuery } from "../generated/graphql";
import NextLink from "next/link";
import { Box, Center, Link, Text } from "@chakra-ui/layout";
import React from "react";

const Home: NextPage = () => {
  const [{ fetching: postsFetching, data }] = usePostsQuery();
  return (
    <>
      <Center>
        <Link as={NextLink} href={"/create-post"} passHref>
          <Text fontWeight={"bold"}>Create Post</Text>
        </Link>
      </Center>

      <Box>
        {postsFetching ? (
          <Text>Loading</Text>
        ) : (
          data?.posts.map((post) => <Text key={post.id}>{post.title}</Text>)
        )}
      </Box>
    </>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Home);
