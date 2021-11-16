import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/alert";
import { Box, Center, Heading, Text } from "@chakra-ui/layout";
import { Spinner } from "@chakra-ui/spinner";
import { NextPage } from "next";
import { useRouter } from "next/router";
import React from "react";
import { usePostQuery } from "../../generated/graphql";

interface PostProps {}

const Post: NextPage<PostProps> = ({}) => {
  const router = useRouter();
  /* Check if query param is valid, if not don't bother sending request to server */
  const postId =
    typeof router.query.id === "string" ? parseInt(router.query.id) : -1;

  const error = (
    <Alert
      status="error"
      variant="subtle"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      height="200px"
    >
      <AlertIcon boxSize="40px" mr={0} />
      <AlertTitle mt={4} mb={1} fontSize="lg">
        Error
      </AlertTitle>
      <AlertDescription maxWidth="sm">Could not fetch post</AlertDescription>
    </Alert>
  );

  const { loading, data } = usePostQuery({
    skip: postId === -1,
    variables: {
      postId: postId,
    },
  });

  let post = null;
  if (loading) {
    return (
      <Center>
        <Spinner />
      </Center>
    );
  } else if (data?.post.__typename === "QueryPostSuccess") {
    post = data.post.data;
    return (
      <>
        <Box>
          <Heading>{post.title}</Heading>
          <Text>{post.content}</Text>
        </Box>
      </>
    );
  } else {
    // TODO: Fix. Error shows up always even before loading etc...
    return <>{error}</>;
  }
};

export default Post;
