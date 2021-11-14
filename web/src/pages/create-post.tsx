import { Box } from "@chakra-ui/layout";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  CloseButton,
} from "@chakra-ui/react";
import { Formik, Form } from "formik";
import { NextPage } from "next";
import router from "next/router";
import React from "react";
import { useCreatePostMutation } from "../generated/graphql";
import useIsAuth from "../utils/useIsAuth";
import InputField from "./components/InputField";
import Wrapper from "./components/Wrapper";

interface createPostProps {}

const CreatePost: NextPage<createPostProps> = ({}) => {
  const [createPost] = useCreatePostMutation();
  const [error, setError] = React.useState<string | null>(null);
  // TODO: Spinner while fetching from useIsAuth
  useIsAuth();

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
            const response = await createPost({ variables: values });
            if (
              response.data?.createPost.__typename ===
              "MutationCreatePostSuccess"
            ) {
              /* Backend successful response */
              if (typeof router.query.next === "string") {
                return router.push(router.query.next);
              } else {
                return router.push("/");
              }
            } else if (response.data?.createPost.__typename === "BaseError") {
              setError(response.data.createPost.message);
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
                  required
                />
                <InputField
                  name="content"
                  label="content"
                  type="text"
                  placeholder="..."
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

export default CreatePost;
