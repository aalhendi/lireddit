import router from "next/router";
import React from "react";
import { useMeQuery } from "../generated/graphql";

const useIsAuth = () => {
  const { data, loading } = useMeQuery();
  React.useEffect(() => {
    if (!data?.me && !loading) {
      router.replace(`/login?next=${router.pathname}`);
    } else {
    }
  }, [data, router, loading]);
};
export default useIsAuth;
