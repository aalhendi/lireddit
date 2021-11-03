import { AlreadyExistsError, ZodFieldError } from "../generated/graphql";

export const toErrorMap = (errors: ZodFieldError[]) => {
  // NOTE: obj:{ [key: string]: string } === obj: Record<string, string>
  const obj: Record<string, string> = {};
  for (const error of errors) {
    obj[error.path[0]] = error.message;
  }
  return obj;
};

// TODO: Add other types whenever needed
export const toFieldError = (error: AlreadyExistsError) => {
  const obj: Record<string, string> = {};
  obj[error.fieldName] = error.message;
  return obj;
};
