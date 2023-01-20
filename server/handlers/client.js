/* eslint-disable import/prefer-default-export */
import { ApolloClient } from "apollo-boost";

export const createClient = (shop, accessToken) => {
  return new ApolloClient({
    uri: `https://${shop}/admin/api/2022-10/graphql.json`,
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "User-Agent": `shopify-app-node ${process.env.npm_package_version} | Shopify App CLI`,
    },
  });
};
