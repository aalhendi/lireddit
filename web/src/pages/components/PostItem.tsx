import { EditIcon, DeleteIcon } from "@chakra-ui/icons";
import { Flex, Box, Link, Heading, IconButton, Text } from "@chakra-ui/react";
import router from "next/router";
import React from "react";
import DeletePostModal from "./DeletePostModal";
import { SideVotes } from "./SideVotes";
import NextLink from "next/link";
import { Post } from "../../generated/graphql";

interface PostItemProps {
  post: Post;
  meId: string | undefined;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  setError: (value: React.SetStateAction<string | null>) => void;
  setAlertStatus: React.Dispatch<
    React.SetStateAction<"error" | "info" | "warning" | "success" | undefined>
  >;
}

export const PostItem: React.FC<PostItemProps> = ({
  post,
  setError,
  isOpen,
  onOpen,
  onClose,
  setAlertStatus,
  meId,
}) => {
  return (
    <>
      <Flex p={5} shadow="md" borderWidth="1px">
        <SideVotes post={post} />
        <Box w={"full"}>
          <Flex align={"center"}>
            <Link
              as={NextLink}
              href={`/post/${encodeURIComponent(post.id)}`}
              passHref
            >
              <Heading as={"button"} fontSize="xl">
                {post.title}
              </Heading>
            </Link>
            {meId === post.author.id && (
              <Box ml={"auto"}>
                <IconButton
                  aria-label={"Edit Post"}
                  _hover={{ bgColor: "blue.200" }}
                  mx={1}
                  icon={<EditIcon />}
                  onClick={async () =>
                    await router.push(`/post/edit/${post.id}`)
                  }
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
            )}
          </Flex>
          {/* TODO: Add username and make this username */}
          <Text>By: {post.author.email}</Text>
          {/* TODO: Field resolver in backend to return textSnippet instead of loading all text and splicing on front end */}
          <Text mt={4}>{post.content?.slice(0, 50)}</Text>
        </Box>
      </Flex>
      {/* // CHECK: Is rendering modal like this even good? Or is it rendering n modals all not shown? */}
      <DeletePostModal
        setAlertStatus={setAlertStatus}
        isOpen={isOpen}
        onClose={onClose}
        postId={parseInt(post.id)}
        key={post.id}
        setError={setError}
      />
    </>
  );
};
