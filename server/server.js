/* eslint-disable no-await-in-loop */
import "@babel/polyfill";
import dotenv from "dotenv";
import "isomorphic-fetch";
import createShopifyAuth, { verifyRequest } from "@shopify/koa-shopify-auth";
import graphQLProxy from "@shopify/koa-shopify-graphql-proxy";
import Koa from "koa";
import next from "next";
import Router from "koa-router";
import session from "koa-session";
import path from "path";
import koaBody from "koa-body";
import Shopify from "shopify-api-node";
import fs from "fs";
import csv from "csv-parser";
import axios from "axios";
import ndjsonParser from "ndjson-parse";

dotenv.config();
const port = parseInt(process.env.PORT, 10) || 8081;
const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
});
const handle = app.getRequestHandler();
const { SHOPIFY_API_SECRET, SHOPIFY_API_KEY, SCOPES } = process.env;
let shopify;
const createShopifyAPINode = async (ctx, nextStep) => {
  const { shop: shopName, accessToken } = ctx.session;
  shopify ??= new Shopify({
    shopName,
    accessToken,
    apiVersion: "2021-01",
  });
  ctx.shopify = shopify;
  await nextStep();
};

app.prepare().then(() => {
  const server = new Koa();
  const router = new Router();
  server.use(
    session(
      {
        sameSite: "none",
        secure: true,
      },
      server
    )
  );
  server.keys = [SHOPIFY_API_SECRET];
  server.use(
    createShopifyAuth({
      apiKey: SHOPIFY_API_KEY,
      secret: SHOPIFY_API_SECRET,
      scopes: [SCOPES],

      async afterAuth(ctx) {
        // Access token and shop available in ctx.state.shopify
        const { shop } = ctx.state.shopify;

        // Redirect to app with shop parameter upon auth
        ctx.redirect(`/?shop=${shop}`);
      },
    })
  );
  server.use(
    graphQLProxy({
      version: "2021-01",
    })
  );
  server.use(
    koaBody({
      multipart: true,
      formidable: {
        uploadDir: path.join(__dirname, "../public/uploads"),
        keepExtensions: true,
      },
    })
  );

  router.post(
    "/createMetafield",
    verifyRequest(),
    createShopifyAPINode,
    async (ctx) => {
      const { shopify: shopifyInContext } = ctx;
      ctx.body = await shopifyInContext.metafield.create(ctx.request.body);
      ctx.res.statusCode = 200;
    }
  );

  router.post(
    "/updateMetafield",
    verifyRequest(),
    createShopifyAPINode,
    async (ctx) => {
      const { shopify: shopifyInContext } = ctx;
      const { id, ...rest } = ctx.request.body;
      ctx.body = await shopifyInContext.metafield.update(id, rest);
      ctx.res.statusCode = 200;
    }
  );

  router.post(
    "/getProducts",
    verifyRequest(),
    createShopifyAPINode,
    async (ctx) => {
      const { shopify: shopifyInContext } = ctx;
      let params = { limit: 250, ...ctx.request.body };
      let products = [];
      do {
        const productsOnCurrentPage = await shopifyInContext.product.list(
          params
        );
        products = [...products, ...productsOnCurrentPage];
        params = productsOnCurrentPage.nextPageParameters;
      } while (params !== undefined);
      ctx.body = products;
      ctx.res.statusCode = 200;
    }
  );

  router.post("/importCSV", verifyRequest(), async (ctx) => {
    const file = ctx.request.files.csv;
    const filePath = file.path;
    try {
      const readCsv = () =>
        new Promise((resolve) => {
          const results = [];
          fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (data) => results.push(data))
            .on("end", () => {
              resolve(results);
            });
        });
      const results = await readCsv();
      ctx.body = results;
      ctx.res.statusCode = 200;
    } catch (err) {
      ctx.body = err;
      ctx.res.statusCode = 500;
    }
  });

  router.post("/importJSON", verifyRequest(), async (ctx) => {
    const file = ctx.request.files.json;
    const filePath = file.path;
    try {
      const data = fs.readFileSync(filePath);
      console.log(data);
      ctx.body = data;
      ctx.res.statusCode = 200;
    } catch (err) {
      ctx.body = err;
      ctx.res.statusCode = 500;
    }
  });

  router.get("/getFile", verifyRequest(), async (ctx) => {
    try {
      const { url } = ctx.request.query;
      if (!url) {
        throw new Error("no url parameter provided");
      }
      const dataInJSONL = await axios
        .get(url)
        .then((response) => response.data);
      ctx.body = ndjsonParser(dataInJSONL);
      ctx.res.statusCode = 200;
    } catch (err) {
      ctx.body = err.message;
      ctx.res.statusCode = 400;
    }
  });

  router.get("(.*)", verifyRequest(), async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  });
  server.use(router.allowedMethods());
  server.use(router.routes());
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
