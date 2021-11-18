import { Button } from "@chakra-ui/button";
import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/modal";
import router from "next/router";
import React from "react";
import { useDeletePostMutation } from "../../generated/graphql";

interface DeletePostModalProps {
  postId: number;
  onClose: () => void;
  isOpen: boolean;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setAlertStatus: React.Dispatch<
    React.SetStateAction<"error" | "info" | "warning" | "success" | undefined>
  >;
}

const DeletePostModal: React.FC<DeletePostModalProps> = ({
  postId,
  onClose,
  isOpen,
  setError,
  setAlertStatus,
}) => {
  const [deletePost, { loading, data }] = useDeletePostMutation();
  const confirmDelete = async (postId: number) => {
    await deletePost({
      variables: {
        postId: postId,
      },
      update: (cache) => {
        if (data?.deletePost.__typename === "MutationDeletePostSuccess") {
          cache.evict({ id: `Post:${postId}` });
          cache.gc();
          setAlertStatus("success");
          setError("Post was deleted");
        } else {
          setAlertStatus("error");
          setError("Could not delete post");
        }
      },
    });

    if (!loading) {
      onClose();
      router.replace("/");
    }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Delete Post</ModalHeader>
        <ModalCloseButton />
        <ModalBody>Do you really wish to delete this post?</ModalBody>

        <ModalFooter>
          <Button
            colorScheme="red"
            mr={3}
            onClick={async () => {
              await confirmDelete(postId);
              onClose;
            }}
            isLoading={loading}
          >
            Delete
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DeletePostModal;
