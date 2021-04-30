import { createContext, useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { gql, useQuery } from "@apollo/client";

const AppContext = createContext();

const GET_SHOP_INFO = gql`
  query getShopInfo {
    shop {
      id
      productTypes(first: 250) {
        edges {
          node
          cursor
        }
      }
      productVendors(first: 250) {
        edges {
          node
          cursor
        }
      }
      metafields(first: 3, namespace: "dtm") {
        edges {
          node {
            id
            key
            legacyResourceId
            namespace
            value
            valueType
            ownerType
          }
        }
      }
    }
  }
`;

export function AppWrapper({ children, ...rest }) {
  const { data, refetch: refetchShopInfo } = useQuery(GET_SHOP_INFO);
  const [hiddenProductTypes, setHiddenProductTypes] = useState([]);
  useEffect(() => {
    setHiddenProductTypes(
      JSON.parse(window.localStorage.getItem("hiddenProductTypes") ?? "[]")
    );
  }, []);
  const productTypes =
    data?.shop?.productTypes?.edges?.map((edge) => edge.node) ?? [];

  const productVendors =
    data?.shop?.productVendors?.edges?.map((edge) => edge.node) ?? [];

  const shopMetafields =
    data?.shop?.metafields?.edges?.map((edge) => edge.node) ?? [];

  const sharedState = {
    productTypes,
    productVendors,
    shopMetafields,
    hiddenProductTypes,
    setHiddenProductTypes,
    refetchShopInfo,
  };

  return (
    <AppContext.Provider value={{ ...rest, ...sharedState }}>
      {children}
    </AppContext.Provider>
  );
}

AppWrapper.propTypes = {
  children: PropTypes.node,
};

export function useAppContext() {
  return useContext(AppContext);
}
