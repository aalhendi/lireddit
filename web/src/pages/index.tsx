import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@chakra-ui/alert";
import { Button } from "@chakra-ui/button";
import { CloseButton } from "@chakra-ui/close-button";
import { useDisclosure } from "@chakra-ui/hooks";
import { DeleteIcon, EditIcon } from "@chakra-ui/icons";
import {
  Box,
  Center,
  Flex,
  Heading,
  Link,
  Stack,
  Text,
} from "@chakra-ui/layout";
import { IconButton } from "@chakra-ui/react";
import { Spinner } from "@chakra-ui/spinner";
import type { NextPage } from "next";
import NextLink from "next/link";
import React from "react";
import { usePostsQuery } from "../generated/graphql";
import DeletePostModal from "./components/DeletePostModal";
import { SideVotes } from "./components/SideVotes";

const Home: NextPage = () => {
  const [error, setError] = React.useState<string | null>(null);
  const [alertStatus, setAlertStatus] = React.useState<
    "error" | "info" | "warning" | "success" | undefined
  >(undefined);
  const { isOpen, onOpen, onClose } = useDisclosure();

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
    setAlertStatus("error");
    setError("Could not fetch posts");
  }

  return (
    <>
      {error && (
        <Alert status={alertStatus}>
          <AlertIcon />
          <AlertTitle mr={2}>{alertStatus}:</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <CloseButton position="absolute" right="8px" top="8px" />
        </Alert>
      )}

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
                      <Box w={"full"}>
                        <Flex align={"center"}>
                          <Link
                            as={NextLink}
                            href={`/post/${encodeURIComponent(p.id)}`}
                            passHref
                          >
                            <Heading as={"button"} fontSize="xl">
                              {p.title}
                            </Heading>
                          </Link>
                          <Box ml={"auto"}>
                            <IconButton
                              aria-label={"Edit Post"}
                              _hover={{ bgColor: "blue.200" }}
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
                        {/* TODO: Add username and make this username */}
                        <Text>By: {p.author.email}</Text>
                        {/* TODO: Field resolver in backend to return textSnippet instead of loading all text and splicing on front end */}
                        <Text mt={4}>{p.content?.slice(0, 50)}</Text>
                      </Box>
                    </Flex>
                    {/* // CHECK: Is rendering modal like this even good? Or is it rendering n modals all not shown? */}
                    <DeletePostModal
                      setAlertStatus={setAlertStatus}
                      isOpen={isOpen}
                      onClose={onClose}
                      postId={parseInt(p.id)}
                      key={p.id}
                      setError={setError}
                    />
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
