import { ChevronUpIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { Flex, IconButton, Text } from "@chakra-ui/react";
import React from "react";
import { Post, useVoteMutation } from "../../generated/graphql";

interface SideVotesProps {
  post: Post;
}

export const SideVotes: React.FC<SideVotesProps> = ({ post }) => {
  const [vote] = useVoteMutation();
  const [loading, setLoading] = React.useState<
    "up-loading" | "down-loading" | "none"
  >("none");
  // TODO: Loading spinners on vote buttons
  return (
    <Flex
      direction={"column"}
      justifyContent={"center"}
      alignItems={"center"}
      mr={4}
    >
      <IconButton
        onClick={async () => {
          setLoading("up-loading");
          await vote({
            variables: {
              postId: parseInt(post.id),
              value: true,
            },
          });
          setLoading("none");
        }}
        bgColor={post.voteStatus === true ? "green" : ""}
        isLoading={loading === "up-loading"}
        aria-label={"Upvote Post"}
        icon={<ChevronUpIcon w={8} h={8} />}
      />
      <Text>{post.points}</Text>
      <IconButton
        onClick={async () => {
          setLoading("down-loading");
          await vote({
            variables: {
              postId: parseInt(post.id),
              value: false,
            },
          });
          setLoading("none");
        }}
        bgColor={post.voteStatus === false ? "red" : ""}
        isLoading={loading === "down-loading"}
        aria-label={"Pownvote Post"}
        icon={<ChevronDownIcon w={8} h={8} />}
      />
    </Flex>
  );
};
