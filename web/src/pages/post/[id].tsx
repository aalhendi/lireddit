import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@chakra-ui/alert";
import { DeleteIcon, EditIcon } from "@chakra-ui/icons";
import { Box, Center, Flex, Heading, Text } from "@chakra-ui/layout";
import { IconButton, useDisclosure } from "@chakra-ui/react";
import { Spinner } from "@chakra-ui/spinner";
import { NextPage } from "next";
import { useRouter } from "next/router";
import React from "react";
import { usePostQuery } from "../../generated/graphql";
import DeletePostModal from "../components/DeletePostModal";

interface PostProps {}

const Post: NextPage<PostProps> = ({}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [error, setError] = React.useState<string | null>(null);
  const [alertStatus, setAlertStatus] = React.useState<
    "error" | "info" | "warning" | "success" | undefined
  >(undefined);

  const router = useRouter();
  /* Check if query param is valid, if not don't bother sending request to server */
  const postId =
    typeof router.query.id === "string" ? parseInt(router.query.id) : -1;

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
        <DeletePostModal
          setAlertStatus={setAlertStatus}
          isOpen={isOpen}
          onClose={onClose}
          postId={postId}
          key={postId}
          setError={setError}
        />
        <Box m={8}>
          <Flex align={"center"}>
            <Heading>{post.title}</Heading>
            <Box ml={"auto"}>
              <IconButton
                aria-label={"Edit Post"}
                _hover={{ bg: "blue.200" }}
                mx={1}
                icon={<EditIcon />}
              />
              <IconButton
                aria-label={"Delete Post"}
                bgColor={"red.500"}
                _hover={{ bgColor: "red" }}
                mx={1}
                onClick={onOpen}
                icon={<DeleteIcon color={"white"} />}
              />
            </Box>
          </Flex>
          <Text>{post.content}</Text>
        </Box>
      </>
    );
  } else {
    return (
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
  }
};

export default Post;
