import { cacheExchange, Resolver } from "@urql/exchange-graphcache";
import {
  dedupExchange,
  errorExchange,
  fetchExchange,
  stringifyVariables,
} from "urql";
import {
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  RegisterMutation,
} from "../generated/graphql";
import { betterUpdateQuery } from "./betterUpdateQuery";

const cursorPagination = (): Resolver => {
  return (_parent, args, cache, info) => {
    /* entityKey is Query and fieldName is posts */
    const { parentKey: entityKey, fieldName } = info;
    /* Inspect the cache for entityKey aka. Queries */
    const allFields = cache.inspectFields(entityKey);
    console.log("allFields:", allFields);
    /* Filter the cache inspect result to only match the fieldName. ie. Only get posts query */
    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);
    console.log("fieldInfos: ", fieldInfos);
    const size = fieldInfos.length;
    /* The first query will be a cache miss. If so, return undefined */
    if (size === 0) {
      console.log("Miss");
      return undefined;
    }

    /* Tells urql to do a query when true */
    const fieldKey = `${fieldName}${stringifyVariables(args)}`;
    // console.log(entityKey);
    // const isInCache = cache.resolve(entityKey, fieldKey);
    // console.log("FieldKey:", fieldKey);
    // console.log("inCache?:", isInCache);
    // TODO: Need a way to make info to partial conditionally true depending on if there is stuff in the cache
    // info.partial = !isInCache;
    info.partial = false;

    /* Check if data exists in cache and return it from cache */
    let results: string[] = [];
    let typename = "";
    // TODO: Use for in to check typename so can access break when typename isnt Success
    fieldInfos.forEach((fi) => {
      const key = cache.resolve(entityKey, fi.fieldKey) as string;
      typename = cache.resolve(key, "__typename") as string;
      let data = null;
      if (typename === "QueryPostsSuccess") {
        data = cache.resolve(key, "data") as string[];
        results.push(...data);
      } else {
        console.log("errorland");
      }
    });

    /* Basically, grab old data from cache, append this new data returned below to it and return bigger object */
    return {
      __typename: typename,
      data: results,
      // limit: args.limit,
      // cursor: args.cursor,
    };
  };
};

export const createUrqlClient = (ssrExchange: any) => ({
  url: "http://localhost:8000/graphql",
  fetchOptions: {
    credentials: "include" as const,
  },
  exchanges: [
    dedupExchange,
    cacheExchange({
      resolvers: {
        Query: {
          posts: cursorPagination(),
        },
      },
      updates: {
        Mutation: {
          login(result, _args, cache, _info) {
            betterUpdateQuery<LoginMutation, MeQuery | undefined>(
              cache,
              { query: MeDocument },
              result,
              (res, query) => {
                if (res.login.__typename?.toLowerCase().includes("error")) {
                  return query;
                } else if (res.login.__typename === "MutationLoginSuccess") {
                  return {
                    me: res.login.data,
                  };
                }
              }
            );
          },
          register(result, _args, cache, _info) {
            betterUpdateQuery<RegisterMutation, MeQuery | undefined>(
              cache,
              { query: MeDocument },
              result,
              (res, query) => {
                if (res.register.__typename?.toLowerCase().includes("error")) {
                  return query;
                } else if (
                  res.register.__typename === "MutationRegisterSuccess"
                ) {
                  return {
                    me: res.register.data,
                  };
                }
              }
            );
          },
          logout(result, _args, cache, _info) {
            betterUpdateQuery<LogoutMutation, MeQuery | undefined>(
              cache,
              { query: MeDocument },
              result,
              () => {
                return {
                  me: null,
                };
              }
            );
          },
        },
      },
    }),
    ssrExchange,
    errorExchange({
      onError(error) {
        console.error(error);
      },
    }),
    fetchExchange,
  ],
});
