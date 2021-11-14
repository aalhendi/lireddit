import { Button } from "@chakra-ui/button";
import { Box, Flex, Link, Text } from "@chakra-ui/layout";
import { Form, Formik } from "formik";
import { NextPage } from "next";
import { useRouter } from "next/dist/client/router";
import NextLink from "next/link";
import React from "react";
import { MeDocument, MeQuery, useLoginMutation } from "../generated/graphql";
import { toErrorMap } from "../utils/toErrorMap";
import InputField from "./components/InputField";
import Wrapper from "./components/Wrapper";

interface loginProps {}

const Login: NextPage<loginProps> = ({}) => {
  const router = useRouter();
  const [login] = useLoginMutation();

  return (
    <Wrapper>
      <Formik
        initialValues={{ email: "", password: "" }}
        onSubmit={async (values, actions) => {
          const response = await login({
            variables: values,
            update: (cache, { data }) => {
              if (data?.login.__typename === "MutationLoginSuccess") {
                cache.writeQuery<MeQuery>({
                  query: MeDocument,
                  data: {
                    me: data.login.data,
                  },
                });
                cache.evict({ fieldName: "posts:{}" });
              }
            },
          });
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
