import React from "react";
import { Formik, Form } from "formik";
import { Button } from "@chakra-ui/button";
import Wrapper from "../../components/Wrapper";
import InputField from "../../components/InputField";
import { Box } from "@chakra-ui/layout";
import { useRegisterMutation } from "../generated/graphql";

interface registerProps {}

const Register: React.FC<registerProps> = ({}) => {
  const [, register] = useRegisterMutation();

  function validateName(value: any): any {
    let error;
    if (!value) {
      error = "Name is required";
    } else if (value.toLowerCase() !== "naruto") {
      error = "Jeez! You're not a fan 😱";
    }
    return error;
  }

  return (
    <Wrapper>
      <Formik
        initialValues={{ email: "bob@bob.com", password: "" }}
        onSubmit={async (values, actions) => {
          alert(JSON.stringify(values, null, 2));
          const response = await register(values);
          console.log(response);
          if (
            response.error ||
            response.data?.register.__typename! === "ZodError"
          ) {
            alert(JSON.stringify(response.data?.register));
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

