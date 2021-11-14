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
import {
  MeDocument,
  MeQuery,
  useChangePasswordMutation,
} from "../../generated/graphql";
import { toErrorMap } from "../../utils/toErrorMap";
import InputField from "../components/InputField";
import Wrapper from "../components/Wrapper";

interface changePasswordProps {
  token: string;
}

const ChangePassword: NextPage<changePasswordProps> = ({}) => {
  const [changePassword] = useChangePasswordMutation();
  const [error, setError] = React.useState<Record<string, string> | null>(null);
  return (
    <>
      {error && (
        <Alert status="error">
          <AlertIcon />
          <AlertTitle mr={2}>Error:</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
          <CloseButton position="absolute" right="8px" top="8px" />
        </Alert>
      )}
      <Wrapper>
        <Formik
          initialValues={{ newPassword: "" }}
          onSubmit={async (values, actions) => {
            // TODO: Add front-end validation
            const response = await changePassword({
              variables: {
                newPassword: values.newPassword,
                token:
                  typeof router.query.token === "string"
                    ? router.query.token
                    : "",
              },
              update: (cache, { data }) => {
                if (
                  data?.changePassword.__typename ===
                  "MutationChangePasswordSuccess"
                ) {
                  cache.writeQuery<MeQuery>({
                    query: MeDocument,
                    data: {
                      me: data.changePassword.data,
                    },
                  });
                }
              },
            });
            if (
              response.data?.changePassword.__typename ===
              "MutationChangePasswordSuccess"
            ) {
              /* Backend successful response */
              return router.push("/");
            } else if (
              response.data?.changePassword.__typename === "ZodError"
            ) {
              actions.setErrors(
                toErrorMap(response.data.changePassword.fieldErrors)
              );
            } else if (
              response.data?.changePassword.__typename === "NotFoundError"
            ) {
              setError(response.data.changePassword);
            }

            actions.setSubmitting(false);
          }}
        >
          {(props) => (
            <Form>
              <Box mt={4}>
                <InputField
                  name="newPassword"
                  label="Password"
                  type="password"
                  placeholder="new password"
                  required
                  min={6}
                />
              </Box>
              <Button
                mt={4}
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

export default ChangePassword;
