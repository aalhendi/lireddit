import gql from 'graphql-tag';
import * as Urql from 'urql';
export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type AlreadyExistsError = Error & {
  __typename?: 'AlreadyExistsError';
  fieldName: Scalars['String'];
  message: Scalars['String'];
};

export type BaseError = Error & {
  __typename?: 'BaseError';
  message: Scalars['String'];
};

export type Error = {
  message: Scalars['String'];
};

export type InvalidCredentialsError = Error & {
  __typename?: 'InvalidCredentialsError';
  message: Scalars['String'];
};

export type LengthError = Error & {
  __typename?: 'LengthError';
  fieldName: Scalars['String'];
  message: Scalars['String'];
  minLength: Scalars['Int'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createPost: Post;
  deletePost: Post;
  login: MutationLoginResult;
  logout: Scalars['Boolean'];
  register: MutationRegisterResult;
  updatePost: Post;
};


export type MutationCreatePostArgs = {
  authorId: Scalars['Int'];
  content?: Maybe<Scalars['String']>;
  title: Scalars['String'];
};


export type MutationDeletePostArgs = {
  id: Scalars['Int'];
};


export type MutationLoginArgs = {
  email: Scalars['String'];
  password: Scalars['String'];
};


export type MutationRegisterArgs = {
  email: Scalars['String'];
  name?: Maybe<Scalars['String']>;
  password: Scalars['String'];
};


export type MutationUpdatePostArgs = {
  authorId?: Maybe<Scalars['Int']>;
  content?: Maybe<Scalars['String']>;
  id: Scalars['Int'];
  title?: Maybe<Scalars['String']>;
};

export type MutationLoginResult = InvalidCredentialsError | MutationLoginSuccess | ZodError;

export type MutationLoginSuccess = {
  __typename?: 'MutationLoginSuccess';
  data: User;
};

export type MutationRegisterResult = AlreadyExistsError | MutationRegisterSuccess | ZodError;

export type MutationRegisterSuccess = {
  __typename?: 'MutationRegisterSuccess';
  data: User;
};

export type NotFoundError = Error & {
  __typename?: 'NotFoundError';
  fieldName: Scalars['String'];
  message: Scalars['String'];
};

export type Post = {
  __typename?: 'Post';
  content?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  title: Scalars['String'];
};

export type Query = {
  __typename?: 'Query';
  me?: Maybe<User>;
  post: QueryPostResult;
  posts: Array<Post>;
};


export type QueryPostArgs = {
  id: Scalars['Int'];
};

export type QueryPostResult = NotFoundError | QueryPostSuccess;

export type QueryPostSuccess = {
  __typename?: 'QueryPostSuccess';
  data: Post;
};

export type User = {
  __typename?: 'User';
  email: Scalars['String'];
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
};

export type ZodError = Error & {
  __typename?: 'ZodError';
  fieldErrors: Array<ZodFieldError>;
  message: Scalars['String'];
};

export type ZodFieldError = {
  __typename?: 'ZodFieldError';
  message: Scalars['String'];
  path: Array<Scalars['String']>;
};

export type NormalUserFragment = { __typename?: 'User', id: string, name?: string | null | undefined, email: string };

export type LoginMutationVariables = Exact<{
  email: Scalars['String'];
  password: Scalars['String'];
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'InvalidCredentialsError', message: string } | { __typename?: 'MutationLoginSuccess', data: { __typename?: 'User', id: string, name?: string | null | undefined, email: string } } | { __typename?: 'ZodError', message: string, fieldErrors: Array<{ __typename?: 'ZodFieldError', message: string, path: Array<string> }> } };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { __typename?: 'Mutation', logout: boolean };

export type RegisterMutationVariables = Exact<{
  email: Scalars['String'];
  password: Scalars['String'];
  name?: Maybe<Scalars['String']>;
}>;


export type RegisterMutation = { __typename?: 'Mutation', register: { __typename?: 'AlreadyExistsError', fieldName: string, message: string } | { __typename?: 'MutationRegisterSuccess', data: { __typename?: 'User', id: string, name?: string | null | undefined, email: string } } | { __typename?: 'ZodError', fieldErrors: Array<{ __typename?: 'ZodFieldError', message: string, path: Array<string> }> } };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me?: { __typename?: 'User', id: string, name?: string | null | undefined, email: string } | null | undefined };

export const NormalUserFragmentDoc = gql`
    fragment NormalUser on User {
  id
  name
  email
}
    `;
export const LoginDocument = gql`
    mutation login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    ... on MutationLoginSuccess {
      data {
        ...NormalUser
      }
    }
    ... on ZodError {
      fieldErrors {
        message
        path
      }
    }
    ... on InvalidCredentialsError {
      message
    }
    ... on Error {
      message
    }
  }
}
    ${NormalUserFragmentDoc}`;

export function useLoginMutation() {
  return Urql.useMutation<LoginMutation, LoginMutationVariables>(LoginDocument);
};
export const LogoutDocument = gql`
    mutation logout {
  logout
}
    `;

export function useLogoutMutation() {
  return Urql.useMutation<LogoutMutation, LogoutMutationVariables>(LogoutDocument);
};
export const RegisterDocument = gql`
    mutation register($email: String!, $password: String!, $name: String) {
  register(email: $email, password: $password, name: $name) {
    ... on ZodError {
      fieldErrors {
        message
        path
      }
    }
    ... on MutationRegisterSuccess {
      data {
        ...NormalUser
      }
    }
    ... on AlreadyExistsError {
      fieldName
      message
    }
  }
}
    ${NormalUserFragmentDoc}`;

export function useRegisterMutation() {
  return Urql.useMutation<RegisterMutation, RegisterMutationVariables>(RegisterDocument);
};
export const MeDocument = gql`
    query me {
  me {
    ...NormalUser
  }
}
    ${NormalUserFragmentDoc}`;

export function useMeQuery(options: Omit<Urql.UseQueryArgs<MeQueryVariables>, 'query'> = {}) {
  return Urql.useQuery<MeQuery>({ query: MeDocument, ...options });
};