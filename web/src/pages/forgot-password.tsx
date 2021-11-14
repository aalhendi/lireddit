import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
} from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { NextPage } from "next";
import React from "react";
import { useForgotPasswordMutation } from "../generated/graphql";
import { toErrorMap } from "../utils/toErrorMap";
import InputField from "./components/InputField";
import Wrapper from "./components/Wrapper";

interface forgotPasswordProps {}

const ForgotPassword: NextPage<forgotPasswordProps> = ({}) => {
  const [forgotPassword] = useForgotPasswordMutation();
  const [isComplete, SetIsCompelte] = React.useState(false);
  return (
    <>
      {isComplete ? (
        <Alert
          status="success"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Submitted!
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            A password reset link will be sent if a user matching this email
            exists in our records.
          </AlertDescription>
        </Alert>
      ) : (
        <Wrapper>
          <Formik
            initialValues={{ email: "" }}
            onSubmit={async (values, actions) => {
              const response = await forgotPassword({ variables: values });
              if (response.data?.forgotPassword.__typename === "ZodError") {
                /* Backend validation response */
                actions.setErrors(
                  toErrorMap(response.data.forgotPassword.fieldErrors)
                );
              } else if (
                response.data?.forgotPassword.__typename ===
                "MutationForgotPasswordSuccess"
              ) {
                /* Backend successful response */
                SetIsCompelte(true);
              }
              actions.setSubmitting(false);
            }}
          >
            {(props) => (
              <Form>
                <Box mt={4}>
                  <InputField
                    name="email"
                    placeholder="name@example.com"
                    label="E-mail"
                    type="email"
                    required
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
      )}
    </>
  );
};

export default ForgotPassword;
