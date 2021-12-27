import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from "@chakra-ui/alert";
import { Button } from "@chakra-ui/button";
import { CloseButton } from "@chakra-ui/close-button";
import { useDisclosure } from "@chakra-ui/hooks";
import { Box, Center, Stack } from "@chakra-ui/layout";
import { Spinner } from "@chakra-ui/spinner";
import type { NextPage } from "next";
import React from "react";
import { useMeQuery, usePostsQuery } from "../generated/graphql";
import { PostItem } from "./components/PostItem";

const Home: NextPage = () => {
  const { data: meData, loading } = useMeQuery();
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
    if (data?.posts.data.__typename === "PaginatedPostsDataSuccess") {
      fetchMore({
        variables: {
          limit: variables?.limit,
          cursor: data.posts.data.data[data.posts.data.data.length - 1].id,
        },
      });
    }
  };

  if (data?.posts.data.__typename === "BaseError") {
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
            {data?.posts.data.__typename === "PaginatedPostsDataSuccess" &&
              data.posts.data.data.map((p) => (
                <PostItem
                  meId={meData?.me?.id}
                  post={p}
                  isOpen={isOpen}
                  onOpen={onOpen}
                  onClose={onClose}
                  setError={setError}
                  setAlertStatus={setAlertStatus}
                />
              ))}
            <Center>
              {data?.posts.hasMore && (
                <Button my={4} onClick={loadMore} isLoading={postsLoading}>
                  Load More
                </Button>
              )}
            </Center>
          </Stack>
        )}
      </Box>
    </>
  );
};

// TODO: SSR Home component
export default Home;
