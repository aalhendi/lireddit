import router from "next/router";
import React from "react";
import { useMeQuery } from "../generated/graphql";

const useIsAuth = () => {
  const [{ data, fetching }] = useMeQuery();
  React.useEffect(() => {
    if (!data?.me && !fetching) {
      router.replace(`/login?next=${router.pathname}`);
    } else {
    }
  }, [data, router, fetching]);
};
export default useIsAuth;
