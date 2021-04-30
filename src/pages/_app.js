import {
  ApolloProvider,
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  HttpLink,
} from "@apollo/client";
import App from "next/app";
import { AppProvider, Frame } from "@shopify/polaris";
import { Provider } from "@shopify/app-bridge-react";
import "@shopify/polaris/dist/styles.css";
import translations from "@shopify/polaris/locales/en.json";
// import ClientRouter from "../components/ClientRouter";
import "../styles.css";
import { AppWrapper } from "../context";

const client = new ApolloClient({
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          products: {
            keyArgs: false,
            merge(...args) {
              return args[1];
            },
          },
        },
      },
    },
  }),
  link: new ApolloLink((operation, forward) =>
    forward(operation).map((response) => {
      if (response.data) {
        response.data.extensions = response.extensions;
      }
      return response;
    })
  ).concat(new HttpLink({ uri: "/graphql" })),
});

class MyApp extends App {
  render() {
    const { Component, pageProps, shopOrigin } = this.props;
    return (
      <AppProvider i18n={translations}>
        <Provider
          config={{
            apiKey: process.env.API_KEY,
            shopOrigin,
            forceRedirect: true,
          }}
        >
          <ApolloProvider client={client}>
            <Frame>
              <AppWrapper>
                <Component {...pageProps} />
              </AppWrapper>
            </Frame>
          </ApolloProvider>
        </Provider>
      </AppProvider>
    );
  }
}

MyApp.getInitialProps = async ({ ctx }) => ({
  shopOrigin: ctx.query.shop,
});

export default MyApp;
