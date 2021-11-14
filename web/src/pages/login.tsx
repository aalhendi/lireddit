import React from "react";
import { Formik, Form } from "formik";
import { Button } from "@chakra-ui/button";
import Wrapper from "./components/Wrapper";
import InputField from "./components/InputField";
import { Box, Flex, Link, Text } from "@chakra-ui/layout";
import { useLoginMutation } from "../generated/graphql";
import { toErrorMap } from "../utils/toErrorMap";
import { useRouter } from "next/dist/client/router";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";
import { NextPage } from "next";
import NextLink from "next/link";

interface loginProps {}

const Login: NextPage<loginProps> = ({}) => {
  const router = useRouter();
  const [login] = useLoginMutation();

  return (
    <Wrapper>
      <Formik
        initialValues={{ email: "", password: "" }}
        onSubmit={async (values, actions) => {
          const response = await login({ variables: values });
          if (response.data?.login.__typename === "ZodError") {
            /* Backend validation response */
            actions.setErrors(toErrorMap(response.data.login.fieldErrors));
          } else if (
            response.data?.login.__typename === "MutationLoginSuccess"
          ) {
            /* Backend successful response */
            return router.push("/");
          } else if (
            response.data?.login.__typename === "InvalidCredentialsError"
          ) {
            actions.setErrors({
              email: "Invalid Credentials",
              password: "Invalid Credentials",
            });
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
              <InputField
                name="password"
                label="Password"
                type="password"
                required
                min={6}
                // TODO: Add front-end validation
                placeholder="password"
              />
              <Flex mt={1}>
                <Text fontSize={"sm"} ml={"auto"}>
                  <Link as={NextLink} href="/forgot-password" passHref>
                    Forgot Password?
                  </Link>
                </Text>
              </Flex>
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
  );
};

export default Login;
