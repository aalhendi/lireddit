import React from "react";
import { Formik, Form } from "formik";
import { Button } from "@chakra-ui/button";
import Wrapper from "./components/Wrapper";
import InputField from "./components/InputField";
import { Box } from "@chakra-ui/layout";
import { useLoginMutation } from "../generated/graphql";
import { toErrorMap } from "../utils/toErrorMap";
import { useRouter } from "next/dist/client/router";

interface loginProps {}

const Login: React.FC<loginProps> = ({}) => {
  const router = useRouter();
  const [, login] = useLoginMutation();

  return (
    <Wrapper>
      <Formik
        initialValues={{ email: "", password: "" }}
        onSubmit={async (values, actions) => {
          // TODO: Add front-end validation
          const response = await login(values);
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
              />
              <InputField
                name="password"
                label="Password"
                type="password"
                placeholder="password"
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

export default Login;
