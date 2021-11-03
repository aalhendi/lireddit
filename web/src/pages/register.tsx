import React from "react";
import { Formik, Form } from "formik";
import { Button } from "@chakra-ui/button";
import Wrapper from "./components/Wrapper";
import InputField from "./components/InputField";
import { Box } from "@chakra-ui/layout";
import { useRegisterMutation } from "../generated/graphql";
import { toFieldError, toErrorMap } from "../utils/toErrorMap";

interface registerProps {}

const Register: React.FC<registerProps> = ({}) => {
  const [, register] = useRegisterMutation();

  return (
    <Wrapper>
      <Formik
        initialValues={{ email: "", password: "" }}
        onSubmit={async (values, actions) => {
          // TODO: Improve error handling
          // TODO: Add front-end validation
          const response = await register(values);
          if (response.data?.register.__typename === "ZodError") {
            /* Backend validation response */
            actions.setErrors(toErrorMap(response.data.register.fieldErrors));
          } else if (
            response.data?.register.__typename === "MutationRegisterSuccess"
          ) {
            /* Backend successful response */
            alert(JSON.stringify(response.data.register.data, null, 2));
          } else if (
            response.data?.register.__typename === "AlreadyExistsError"
          ) {
            actions.setErrors(toFieldError(response.data.register));
          }
          actions.setSubmitting(false);
          return;
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
              <InputField name="password" label="Password" type="password" />
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
