import { builder } from "../../../builder";
import { COOKIE_NAME } from "../../../constants";

builder.mutationField("logout", (t) => {
  return t.boolean({
    resolve: (_parent, {}, { req, res }): Promise<boolean> => {
      return new Promise((resolve) =>
        req.session.destroy((err) => {
          res.clearCookie(COOKIE_NAME);
          if (err) {
            console.log(err);
            resolve(false);
            return;
          }
          resolve(true);
        })
      );
    },
  });
});
