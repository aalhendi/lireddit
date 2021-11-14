import { Button } from "@chakra-ui/button";
import { Box } from "@chakra-ui/layout";
import { Form, Formik } from "formik";
import { NextPage } from "next";
import { useRouter } from "next/dist/client/router";
import React from "react";
import { MeDocument, MeQuery, useRegisterMutation } from "../generated/graphql";
import { toErrorMap, toFieldError } from "../utils/toErrorMap";
import InputField from "./components/InputField";
import Wrapper from "./components/Wrapper";

interface registerProps {}

const Register: NextPage<registerProps> = ({}) => {
  const router = useRouter();
  const [register] = useRegisterMutation();

  return (
    <Wrapper>
      <Formik
        initialValues={{ email: "", password: "" }}
        onSubmit={async (values, actions) => {
          // TODO: Improve error handling
          const response = await register({
            variables: values,
            update: (cache, { data }) => {
              if (data?.register.__typename === "MutationRegisterSuccess") {
                cache.writeQuery<MeQuery>({
                  query: MeDocument,
                  data: {
                    me: data.register.data,
                  },
                });
              }
            },
          });
          if (response.data?.register.__typename === "ZodError") {
            /* Backend validation response */
            actions.setErrors(toErrorMap(response.data.register.fieldErrors));
          } else if (
            response.data?.register.__typename === "MutationRegisterSuccess"
          ) {
            /* Backend successful response */
            return router.push("/");
          } else if (
            response.data?.register.__typename === "AlreadyExistsError"
          ) {
            actions.setErrors(toFieldError(response.data.register));
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
                placeholder="password"
                min={6}
                // TODO: Add front-end validation
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
  );
};

export default Register;
