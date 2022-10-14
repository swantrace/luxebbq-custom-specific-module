import merge from "lodash.merge";
import groupBy from "lodash.groupby";
import deepcopy from "deepcopy";
import axios from "axios";
import { gql } from "@apollo/client";
import uniq from "lodash.uniq";
import { delay } from "bluebird";
import slugify from "slugify";

export const multiSelectNameRegex = /^\w+-\w+\[\]$/;

export const GET_PRODUCTS_IN_BULK = gql`
  mutation bulkOperationRunQuery($query: String!) {
    bulkOperationRunQuery(query: $query) {
      bulkOperation {
        id
        completedAt
        createdAt
        errorCode
        fileSize
        objectCount
        partialDataUrl
        query
        rootObjectCount
        status
        url
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const GET_BULK_OPERATION_INFO = gql`
  query getBulkOperationInfo {
    currentBulkOperation {
      id
      url
      status
      completedAt
      createdAt
      errorCode
      fileSize
      objectCount
      query
      rootObjectCount
    }
  }
`;

export const UPDATE_PRODUCT = gql`
  mutation productUpdate($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
        id
        handle
        title
        legacyResourceId
        onlineStoreUrl
        metafield(namespace: "dtm", key: "info") {
          id
          key
          legacyResourceId
          namespace
          value
          type
          ownerType
        }
        tags
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const GET_PRODUCTS = gql`
  query getProducts(
    $query: String
    $reverse: Boolean
    $sortKey: ProductSortKeys
    $first: Int
    $last: Int
    $after: String
    $before: String
  ) {
    products(
      first: $first
      last: $last
      query: $query
      reverse: $reverse
      sortKey: $sortKey
      after: $after
      before: $before
    ) {
      edges {
        cursor
        node {
          id
          handle
          title
          legacyResourceId
          onlineStoreUrl
          featuredImage {
            originalSrc
            altText
          }
          metafield(key: "info", namespace: "dtm") {
            id
            key
            legacyResourceId
            namespace
            value
            type
            ownerType
          }
          tags
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

export const GET_PRODUCT = gql`
  query getProduct($id: ID!) {
    product(id: $id) {
      id
      handle
      title
      legacyResourceId
      onlineStoreUrl
      metafield(key: "info", namespace: "dtm") {
        id
        key
        legacyResourceId
        namespace
        value
        type
        ownerType
      }
      tags
    }
  }
`;

export const getProductSpecificationInfoWithValues = (
  product,
  specificationInfo
) => {
  const copiedSpecificationInfo = deepcopy(specificationInfo);
  const existingSpecificationTagKeyValuePairs =
    product?.tags
      ?.map((tag) => tag.split("_"))
      ?.filter(
        (parts) =>
          parts[0] === "dtm" && (parts[1] !== undefined || parts[1] !== "")
      )
      ?.reduce((acc, parts) => {
        const specificationNameFromTag = parts[1];
        const specificationProps = specificationInfo[specificationNameFromTag];
        if (specificationProps) {
          acc[specificationNameFromTag] = acc[specificationNameFromTag] || {};
          if (specificationProps.type === "multi-select") {
            acc[specificationNameFromTag].value = [
              ...(acc[specificationNameFromTag].value ?? []),
              parts[2],
            ];
          } else if (specificationProps.type === "checkbox") {
            acc[specificationNameFromTag].value = "TRUE";
          } else {
            // eslint-disable-next-line prefer-destructuring
            acc[specificationNameFromTag].value = parts[2];
          }
        }
        return acc;
      }, {}) ?? {};
  const existingSpecificationMetafieldKeyValuePairs = Object.entries(
    JSON.parse(product?.metafield?.value ?? "{}")
  ).reduce((acc, [key, value]) => {
    acc[key] = { value };
    return acc;
  }, {});
  const existingSpecificationKeyValuePairs = {
    ...existingSpecificationTagKeyValuePairs,
    ...existingSpecificationMetafieldKeyValuePairs,
  };
  const specificationInfoWithValuesMerged = merge(
    copiedSpecificationInfo,
    existingSpecificationKeyValuePairs
  );
  return specificationInfoWithValuesMerged;
};

export const getViewProductsTableInfo = (products, specificationInfo) => {
  const productsSpecificationInfoWithValues = deepcopy(specificationInfo);
  const rows = [];
  products.forEach((product, productIndex) => {
    rows[productIndex] = [];
    rows[productIndex][0] = product.title ?? "";
    const productSpecificationInfoWithValues = getProductSpecificationInfoWithValues(
      product,
      specificationInfo
    );
    Object.entries(productsSpecificationInfoWithValues).forEach(
      ([specificationName, specificationProps], specificationIndex) => {
        const specificationType = specificationProps.type;
        const { value } = productSpecificationInfoWithValues[specificationName];
        switch (specificationType) {
          case "textarea":
            rows[productIndex][specificationIndex + 1] = value.map((t) => (
              <p key={t}>{t}</p>
            ));
            break;
          case "multi-select":
            rows[productIndex][specificationIndex + 1] = value.join(",");
            break;
          default:
            rows[productIndex][specificationIndex + 1] = value;
            break;
        }
      }
    );
  });
  return {
    columnContentTypes: [
      "text",
      ...Object.values(productsSpecificationInfoWithValues).map((info) =>
        info.type === "number" ? "numeric" : "text"
      ),
    ],
    headings: [
      "Title",
      ...Object.values(productsSpecificationInfoWithValues).map(
        (info) => info.label
      ),
    ],
    rows,
  };
};

export const getSpecificationGroups = (product, specificationInfo) => {
  const specificationInfoWithValuesMerged = getProductSpecificationInfoWithValues(
    product,
    specificationInfo
  );

  const {
    true: storedSpecifications,
    false: nonstoredSpecifications,
  } = groupBy(
    specificationInfoWithValuesMerged,
    (specification) => specification.value !== undefined
  );
  return {
    storedSpecifications: storedSpecifications ?? [],
    nonstoredSpecifications: nonstoredSpecifications ?? [],
  };
};
// used in import and edit
export const getModalEditingProductUpdateInfo = (
  toBeSubmittedValues,
  specificationInfo
) => {
  // const specificationInfoWithValuesMerged = getProductSpecificationInfoWithValues(
  //   product,
  //   specificationInfo
  // );

  const updateInfo = Object.entries(specificationInfo).reduce(
    (acc, [specificationName, specificationProps]) => {
      const newValue = toBeSubmittedValues[specificationName];
      if (newValue) {
        switch (specificationProps.type) {
          case "textarea":
            acc.metafield[specificationName] = newValue.split("\n");
            break;
          case "multi-select":
            if (Array.isArray(newValue)) {
              acc.tags = [
                ...acc.tags,
                ...newValue.map((v) => `dtm_${specificationName}_${v.trim()}`),
              ];
            }
            if (typeof newValue === "string") {
              acc.tags = [
                ...acc.tags,
                ...newValue
                  .split(",")
                  .map((v) => `dtm_${specificationName}_${v.trim()}`),
              ];
            }
            break;
          case "checkbox":
            if (newValue.toLowerCase() === "true") {
              acc.tags = [...acc.tags, `dtm_${specificationName}`];
            }
            break;
          default:
            acc.tags = [...acc.tags, `dtm_${specificationName}_${newValue}`];
            break;
        }
      }
      return acc;
    },
    {
      tags: [],
      metafield: {},
    }
  );
  return updateInfo;
};

export const getProductInfoToExport = (product, specificationInfo) => {
  const specificationInfoWithValuesMerged = getProductSpecificationInfoWithValues(
    product,
    specificationInfo
  );
  const specificationValuePairs = Object.entries(
    specificationInfoWithValuesMerged
  ).reduce((acc, [specificationName, specificationProps]) => {
    const specificationValue = specificationProps.value;
    const specificationType = specificationProps.type;
    if (specificationValue) {
      switch (specificationType) {
        case "textarea":
          if (Array.isArray(specificationValue)) {
            acc[specificationName] = specificationValue.join("\n");
          }
          break;
        case "multi-select":
          if (Array.isArray(specificationValue)) {
            acc[specificationName] = specificationValue.join(",");
          }
          break;
        default:
          acc[specificationName] = specificationValue;
          break;
      }
    } else {
      acc[specificationName] = "";
    }
    return acc;
  }, {});
  const productInfoToExport = {
    // id: product.id,
    handle: product.handle,
    title: product.title,
    skus: product.skus.join("\n"),
    prices: product.prices.join("\n"),
    ...specificationValuePairs,
  };
  return productInfoToExport;
};

export const addslashes = (str) =>
  `${str}`.replace(/([\\"'])/g, "\\$1").replace(/\0/g, "\\0");

export const addQuotesIfNecessary = (cur) => {
  return cur.split(/[\s|:]+/).length > 1 ? `"${cur}"` : cur;
};

export const titleCase = (string) =>
  string
    .toLowerCase()
    .split(" ")
    .map((word) => word.replace(word[0], word[0].toUpperCase()))
    .join("");

export const getDownloadLink = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "download";
  const clickHandler = function clickHandler() {
    setTimeout(() => {
      URL.revokeObjectURL(url);
      this.removeEventListener("click", clickHandler);
      if (this.remove && typeof this.remove === "function") {
        this.remove();
      }
      if (
        this.parentNode &&
        typeof this.parentNode.removeChild === "function"
      ) {
        this.parentNode.removeChild(this);
      }
    }, 150);
  };
  a.addEventListener("click", clickHandler, false);
  return a;
};

// get input variable used in productUpdate request
export const getProductInputPayload = (
  toBeSubmittedValues,
  product,
  specificationInfo
) => {
  const { tags, metafield } = getModalEditingProductUpdateInfo(
    toBeSubmittedValues,
    specificationInfo
  );

  const input = {
    id: product.id,
    tags: [...product.tags.filter((t) => !t.includes("dtm_")), ...tags],
  };

  input.metafields = {
    key: "info",
    namespace: "dtm",
    type: "json",
    value: JSON.stringify(metafield),
  };
  if (product?.metafield?.id) {
    input.metafields.id = product.metafield.id;
  }

  return input;
};

export const convertValueToString = (key, value) => {
  let part = "";
  if (typeof value === "string") {
    part = value ? `${key}:${addslashes(addQuotesIfNecessary(value))} ` : "";
  }
  if (typeof value === "object" && Array.isArray(value) && value.length > 0) {
    part =
      value.length === 0
        ? ""
        : value.reduce((acc, cur) => {
          let str = acc;
          if (str === "") {
            str = `${key}:${addslashes(addQuotesIfNecessary(cur))} `;
          } else {
            str += `OR ${key}:${addslashes(addQuotesIfNecessary(cur))} `;
          }
          return str;
        }, "");
  }
  return part;
};

export const getQueryString = (
  productType,
  queryValue,
  productVendorValue,
  statusValue,
  availabilityValue
) => {
  const queryValueString =
    (queryValue?.trim() ?? "") === ""
      ? `*`
      : `${addQuotesIfNecessary(
        queryValue.trim().split(" ").length > 1
          ? `${queryValue.trim().split(" ").slice(0, -1).join(" ")}*`
          : `${queryValue.trim()}*`
      )}`;

  // console.log("queryValueString", queryValueString);
  const queryValuePart =
    (queryValue?.trim() ?? "") === ""
      ? ""
      : `sku:${queryValueString} OR barcode:${queryValueString} OR title:${queryValueString} `;

  const productTypePart = convertValueToString("product_type", productType);
  const productVendorPart = convertValueToString("vendor", productVendorValue);
  const statusPart = convertValueToString("status", statusValue);
  const availabilityPart = convertValueToString(
    "published_status",
    availabilityValue
  );
  return `${queryValuePart}${productTypePart}${productVendorPart}${statusPart}${availabilityPart}`.trim();
};

export const getRawExportedData = async (client, productsQueryString) => {
  console.log("productQueryString: ", productsQueryString);

  const { data } = await client.mutate({
    mutation: GET_PRODUCTS_IN_BULK,
    variables: {
      query: `
      {
        products(query: "${productsQueryString}") {
          edges {
            node {
              id
              handle
              title
              legacyResourceId
              onlineStoreUrl
              productType 
              metafield(key: "info", namespace: "dtm") {
                id
                key
                legacyResourceId
                namespace
                value
                type
                ownerType
              }
              tags
              variants {
                edges {
                  node {
                    sku
                    price
                    selectedOptions {
                      name
                      value
                    }
                  }
                }
              }
            }
          }
        }
      }`,
    },
  });

  if ((data?.bulkOperationRunQuery?.userErrors?.length ?? 0) > 0) {
    throw new Error(
      data.bulkOperationRunQuery.userErrors.map((error) => error.message)
    );
  }
  const bulkOperationCompleted = () =>
    new Promise((resolve) => {
      const interval = setInterval(async () => {
        const { data: dataWithBulkOperationInfo } = await client.query({
          query: GET_BULK_OPERATION_INFO,
          fetchPolicy: "network-only",
        });
        if (
          dataWithBulkOperationInfo.currentBulkOperation.status === "COMPLETED"
        ) {
          clearInterval(interval);
          console.log(dataWithBulkOperationInfo);
          resolve(dataWithBulkOperationInfo.currentBulkOperation.url);
        }
      }, 2000);
    });

  const url = await bulkOperationCompleted();
  console.log("url: ", url);
  const rawExportedData = await axios
    .get("/getFile", { params: { url } })
    .then((response) => response.data);
  return rawExportedData;
};

const GET_PRODUCTS_WITH_TAGS = gql`
  query getProducts($query: String, $first: Int, $after: String) {
    products(first: $first, query: $query, after: $after) {
      edges {
        cursor
        node {
          id
          tags
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

export const queryAllProductTagsThroughGraphqlCreator = ({
  client,
  searchString = "",
  productType = "",
} = {}) => {
  let tags = [];
  let products = [];

  const query250Products = (dataWithLastPageProducts) => {
    if (sessionStorage.getItem(slugify(productType, { lower: true }))) {
      return JSON.parse(
        sessionStorage.getItem(slugify(productType, { lower: true }))
      );
    }
    return client
      .query({
        query: GET_PRODUCTS_WITH_TAGS,
        variables: {
          first: 250,
          query: `${getQueryString(productType, searchString)}`,
          after:
            dataWithLastPageProducts?.data?.products?.edges?.slice(-1)?.[0]
              ?.cursor ?? null,
        },
        fetchPolicy: "network-only",
      })
      .then((data) => {
        const newProducts =
          data?.data?.products?.edges?.map(({ node }) => node) ?? [];
        tags = uniq([
          ...tags,
          ...(newProducts.reduce((acc, cur) => {
            // eslint-disable-next-line no-param-reassign
            acc = uniq([...acc, ...cur.tags]);
            return acc;
          }, []) ?? []),
        ]);
        products = [...products, ...newProducts];
        if ((data?.data?.products?.edges?.length ?? 0) < 250) {
          const result = { products, tags: tags.sort() };
          sessionStorage.setItem(
            slugify(productType, { lower: true }),
            JSON.stringify(result)
          );
          return Promise.resolve(result);
        }
        return delay(5000).then(() => query250Products(data));
      });
  };
  return query250Products;
};
