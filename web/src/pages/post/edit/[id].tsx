import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/alert";
import { Box } from "@chakra-ui/layout";
import { CloseButton, Button } from "@chakra-ui/react";
import { Formik, Form } from "formik";
import { NextPage } from "next";
import { useRouter } from "next/router";
import React from "react";
import {
  Post,
  usePostQuery,
  useUpdatePostMutation,
} from "../../../generated/graphql";
import useIsAuth from "../../../utils/useIsAuth";
import InputField from "../../components/InputField";
import Wrapper from "../../components/Wrapper";

interface EditPostProps {}

const EditPost: NextPage<EditPostProps> = ({}) => {
  const router = useRouter();
  /* Check if query param is valid, if not don't bother sending request to server */
  const postId =
    typeof router.query.id === "string" ? parseInt(router.query.id) : -1;
  const [updatePost] = useUpdatePostMutation();
  const [error, setError] = React.useState<string | null>(null);
  // TODO: Spinner while fetching from useIsAuth
  useIsAuth();

  // TODO: Fetch current values of Post and set them as placeholder/value
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
      <Wrapper variant="small">
        <Formik
          initialValues={{ title: "", content: "" }}
          onSubmit={async (values, actions) => {
            const response = await updatePost({
              variables: {
                ...values,
                postId: postId,
              },
              update: (cache) => {
                /* Evicts all posts so we fetch a fresh set */
                cache.evict({ fieldName: "posts:{}" });
                cache.gc();
              },
            });
            if (
              response.data?.updatePost.__typename ===
              "MutationUpdatePostSuccess"
            ) {
              /* Backend successful response */
              if (typeof router.query.next === "string") {
                return router.push(`post/${postId}`);
              } else {
                return router.push("/");
              }
            } else if (
              // TODO: Any neater ways of doing this ?
              response.data?.updatePost.__typename === "BaseError" ||
              response.data?.updatePost.__typename === "NotFoundError" ||
              response.data?.updatePost.__typename === "UnauthorizedError"
            ) {
              setError(response.data.updatePost.message);
            }
            actions.setSubmitting(false);
          }}
        >
          {(props) => (
            <Form>
              <Box mt={4}>
                <InputField
                  name="title"
                  placeholder="Cool Title"
                  label="title"
                  type="text"
                  //   value={post.title}
                  required
                />
                <InputField
                  name="content"
                  label="content"
                  type="text"
                  placeholder="..."
                  //   value={post.content ?? undefined}
                  textarea
                />
              </Box>
              <Button
                mt={1}
                colorScheme="teal"
                isLoading={props.isSubmitting}
                type="submit"
              >
                Submit
              </Button>
            </Form>
          )}
        </Formik>
      </Wrapper>
    </>
  );
};

export default EditPost;
