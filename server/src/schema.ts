import { builder } from "./builder";
// TODO: Tidy up these imports
import "./modules/Post/resolvers/createPost";
import "./modules/Post/resolvers/deletePost";
import "./modules/Post/resolvers/post";
import "./modules/Post/resolvers/posts";
import "./modules/Post/resolvers/updatePost";
import "./modules/Post/resolvers/vote";
import "./modules/User/resolvers/me";
import "./modules/User/resolvers/register";
import "./modules/User/resolvers/login";
import "./modules/User/resolvers/logout";
import "./modules/User/resolvers/forgotPassword";
import "./modules/User/resolvers/changePassword";
import "./modules/User/objects";
import "./modules/Post/objects";

// TODO: Backend permission conditional. Post owner can see own email but others shouldnt be able to
builder.queryType({
  fields: (_t) => ({}),
});

builder.mutationType({
  fields: (_t) => ({}),
});

export const schema = builder.toSchema({});
