import { useState, useCallback, useEffect, useRef, useContext } from "react";
import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import { AppBridgeContext } from "@shopify/app-bridge-react/context";
import { Redirect } from "@shopify/app-bridge/actions";

import PropTypes from "prop-types";
import {
  Card,
  ResourceItem,
  ResourceList,
  Stack,
  ButtonGroup,
  Button,
  Pagination,
  Thumbnail,
  Modal,
  DataTable,
} from "@shopify/polaris";
import axios from "axios";
import { parse } from "json2csv";
import { map as pmap, delay as pdelay } from "bluebird";
import isEqual from "lodash.isequal";
import EditProductModalContent from "./EditProductModalContent";
import {
  getDownloadLink,
  getProductInfoToExport,
  getProductInputPayload,
  getProductSpecificationInfoWithValues,
  getQueryString,
  getRawExportedData,
  getViewProductsTableInfo,
  GET_PRODUCT,
  GET_PRODUCTS,
  multiSelectNameRegex,
  UPDATE_PRODUCT,
} from "../../utils";
import ImportProductsModalContent from "./ImportProductsModalContent";
import ExportProductsModalContent from "./ExportProductsModalContenta";
import { useAppContext } from "../../context";
import ProductsFilterControl from "./ProductsFilterControl";

function ResourceListWithProducts({
  setToastActive,
  setToastContent,
  modalStatusFromImportOrExport,
  setModalStatusFromImportOrExport,
  productType,
}) {
  const { shopMetafields } = useAppContext();
  const client = useApolloClient();
  const app = useContext(AppBridgeContext);
  const redirect = Redirect.create(app);
  const [productTypeValue, setProductTypeValue] = useState([]);
  const [productVendorValue, setProductVendorValue] = useState([]);
  const [statusValue, setStatusValue] = useState([]);
  const [availabilityValue, setAvailabilityValue] = useState([]);
  const [queryValue, setQueryValue] = useState("");
  const [sortValue, setSortValule] = useState("TITLE_ASC");
  const [selectedItems, setSelectedItems] = useState([]);
  const [modalStatus, setModalStatus] = useState(0);
  const [modalExportScope, setModalExportScope] = useState("all");
  const [modalExportIsWorking, setModalExportIsWorking] = useState(false);
  const [modalFileDialogOpened, setModalFileDialogOpened] = useState(false);
  const [modalImportedFile, setModalImportedFile] = useState(null);
  const [modalImportIsWorking, setModalImportIsWorking] = useState(false);
  const [
    modalImportLeftProductsCount,
    setModalImportLeftProductsCount,
  ] = useState(0);
  const [modalEditingProduct, setModalEditingProduct] = useState(null);
  const [modalViewProductsTableInfo, setModalViewProductsTableInfo] = useState({
    columnContentTypes: [],
    headings: [],
    rows: [],
  });
  const modalContentWrapperRef = useRef();
  const [updateProduct] = useMutation(UPDATE_PRODUCT);

  // console.log(
  //   "79.queryString: ",
  //   getQueryString(
  //     productType,
  //     queryValue,
  //     productVendorValue,
  //     statusValue,
  //     availabilityValue
  //   )
  // );

  const { loading, data: dataWithProducts, refetch, fetchMore } = useQuery(
    GET_PRODUCTS,
    {
      variables: {
        first: 50,
        query: getQueryString(
          productType,
          queryValue,
          productVendorValue,
          statusValue,
          availabilityValue
        ),
        reverse: !!sortValue.includes("DESC"),
        sortKey: sortValue.replace("_DESC", "").replace("_ASC", ""),
      },
    }
  );

  const specificationInfo =
    JSON.parse(
      shopMetafields?.find(({ key }) => key === "info")?.value ?? "{}"
    )?.[productType] ?? {};

  useEffect(() => {
    refetch();
  }, [
    queryValue,
    productTypeValue,
    productVendorValue,
    statusValue,
    availabilityValue,
    sortValue,
    refetch,
  ]);

  useEffect(() => {
    setModalStatus(modalStatusFromImportOrExport);
  }, [modalStatusFromImportOrExport]);

  const resetModal = () => {
    setModalExportScope("all");
    setModalFileDialogOpened(false);
    setModalImportedFile(null);
    setModalEditingProduct(null);
    setModalExportIsWorking(false);
    setModalImportIsWorking(false);
    setModalViewProductsTableInfo({
      columnContentTypes: [],
      headings: [],
      rows: [],
    });
    setModalStatus(0);
    setModalStatusFromImportOrExport(0);
  };

  const handleModalExportScopeChanged = (_checked, value) => {
    setModalExportScope(value);
  };

  const handleModalDropZoneAccepted = (files) => {
    setModalImportedFile(files?.[0] ?? null);
  };

  const handleViewButtonClicked = async () => {
    const promiseArray = selectedItems.map((id) =>
      client
        .query({ query: GET_PRODUCT, variables: { id } })
        .then((response) => response?.data?.product ?? null)
    );
    const productsInfo = await Promise.all(promiseArray);
    const viewProductsTableInfo = getViewProductsTableInfo(
      productsInfo,
      specificationInfo
    );
    setModalViewProductsTableInfo(viewProductsTableInfo);
    setModalStatus(3);
  };

  const handleEditButtonClicked = async (id) => {
    const productInfo = await client
      .query({
        query: GET_PRODUCT,
        variables: { id },
      })
      .then((response) => response?.data?.product ?? null);

    setModalEditingProduct(productInfo);
    setModalStatus(4);
  };

  const handleModalConfirmButtonClicked = async () => {
    // do something according to modal status;
    if (modalStatus === 1 && modalImportedFile) {
      setModalImportIsWorking(true);
      try {
        const formData = new FormData();
        formData.append("csv", modalImportedFile);
        const productsFromCSV = await axios
          .post("/importCSV", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })
          .then((response) => response.data);

        console.log(
          "formData: ",
          formData,
          "\n",
          "productsFromCSV: ",
          productsFromCSV
        );

        const rawExportedData = await getRawExportedData(
          client,
          getQueryString(productType, "", [], [], [])
        );
        const updateInputs = productsFromCSV
          .map((productFromCSV) => {
            const productFromQuery = rawExportedData.find(
              ({ handle }) => productFromCSV.handle === handle
            );
            if (productFromQuery) {
              const input = getProductInputPayload(
                productFromCSV,
                productFromQuery,
                specificationInfo
              );
              if (
                isEqual(input.tags, productFromQuery.tags) &&
                input.metafields.value === productFromQuery.metafield?.value
              ) {
                return false;
              }
              return input;
            }
            return false;
          })
          .filter((input) => input);

        const countOfProductsToUpdate = updateInputs.length ?? 0;
        setModalImportLeftProductsCount(countOfProductsToUpdate);

        let availablePointsCount = 1000;
        let index = 0;
        await pmap(
          updateInputs,
          (input) => {
            index += 1;
            setModalImportLeftProductsCount(countOfProductsToUpdate - index);
            if (availablePointsCount > 100) {
              return updateProduct({ variables: { input } }).then(
                ({ extensions }) => {
                  availablePointsCount =
                    extensions.cost.throttleStatus.currentlyAvailable;
                  return availablePointsCount;
                }
              );
            }
            return pdelay(1000).then(
              updateProduct({ variables: { input } }).then(({ extensions }) => {
                availablePointsCount =
                  extensions.cost.throttleStatus.currentlyAvailable;
                return availablePointsCount;
              })
            );
          },
          { concurrency: 4 }
        );

        setToastActive(true);
        setToastContent("File imported");
      } catch (err) {
        console.log("err:", err);
        setToastActive(true);
        setToastContent(err.message);
      }
    }

    if (modalStatus === 2) {
      try {
        setModalExportIsWorking(true);
        const productsQueryString =
          modalExportScope !== "filtered"
            ? getQueryString(productType, "", [], [], [])
            : getQueryString(
                productType,
                queryValue,
                productVendorValue,
                statusValue,
                availabilityValue
              );

        // console.log("productsQueryString: ", productsQueryString);
        const rawExportedData = await getRawExportedData(
          client,
          productsQueryString
        );

        const targetJSON = rawExportedData
          .reduce((acc, cur) => {
            if (cur.handle) {
              return [...acc, cur];
            }
            const finishedProducts = acc.slice(0, acc.length - 1);
            const currentProduct = acc[acc.length - 1];
            const variantName = cur.selectedOptions
              .map((option) => `[${option.name}][${option.value}]`)
              .join(",");

            currentProduct.skus = [
              ...(currentProduct.skus ?? []),
              `(${variantName}): ${cur.sku}`,
            ];
            currentProduct.prices = [
              ...(currentProduct.prices ?? []),
              `(${variantName}): ${cur.price}`,
            ];
            return [...finishedProducts, currentProduct];
          }, [])
          .filter((product) => {
            switch (modalExportScope) {
              case "all": {
                return true;
              }
              case "filtered": {
                return true;
              }
              case "page": {
                return (dataWithProducts?.products?.edges ?? [])
                  ?.map(({ node }) => node.id)
                  .includes(product.id);
              }
              case "selected": {
                return selectedItems.includes(product.id);
              }
              default: {
                return false;
              }
            }
          })
          .map((product) => getProductInfoToExport(product, specificationInfo));

        console.log(targetJSON);
        const targetCSV = parse(targetJSON);
        const blob = new Blob([targetCSV], { type: "text/csv" });
        const now = new Date();
        const fileName = `${now.toDateString()} ${
          now.toTimeString().split(" ")[0]
        }.csv`;
        const csvLink = getDownloadLink(blob, fileName);
        csvLink.click();
      } catch (err) {
        setToastContent(err.message);
        setToastActive(true);
      }
    }

    if (modalStatus === 4) {
      const form = modalContentWrapperRef.current.querySelector("form");
      const toBeSubmittedValues = Array.from(form.elements)
        .filter((element) => element.name)
        .reduce((acc, element) => {
          if (multiSelectNameRegex.test(element.name)) {
            if (element.checked) {
              const key = element.name.replace("[]", "");
              acc[key] = [...(acc[key] ?? []), element.value];
            }
          } else {
            acc[element.name] = element.value;
          }
          return acc;
        }, {});
      try {
        const input = getProductInputPayload(
          toBeSubmittedValues,
          modalEditingProduct,
          specificationInfo
        );
        await updateProduct({ variables: { input } });
        setToastActive(true);
        setToastContent("Changes saved");
      } catch (err) {
        setToastActive(true);
        setToastContent("Failed to save changes");
      }
    }
    resetModal();
  };

  const handleModalCancelButtonClicked = async () => {
    resetModal();
  };

  const handleModalCloseIconClicked = async () => {
    resetModal();
  };

  const handleClearAll = useCallback(() => {
    setQueryValue("");
    setProductTypeValue([]);
    setProductVendorValue([]);
    setStatusValue([]);
    setAvailabilityValue([]);
  }, [
    setQueryValue,
    setProductTypeValue,
    setProductVendorValue,
    setStatusValue,
    setAvailabilityValue,
  ]);

  const handleEditProductButtonClicked = (id) => {
    redirect.dispatch(Redirect.Action.ADMIN_PATH, {
      path: `/products/${id}`,
      newContext: true,
    });
  };

  const handleViewProductButtonClicked = (url) => {
    redirect.dispatch(Redirect.Action.REMOTE, {
      url: `${url}`,
      newContext: true,
    });
  };

  const promotedBulkActions = [
    {
      content: "View specifications",
      onAction: handleViewButtonClicked,
    },
  ];

  let modalContent = null;
  let modalTitle = "";
  switch (modalStatus) {
    case 0: {
      break;
    }
    case 1: {
      modalTitle = "Import product specifications by CSV";
      modalContent = (
        <ImportProductsModalContent
          {...{
            modalImportLeftProductsCount,
            modalImportedFile,
            modalImportIsWorking,
            modalFileDialogOpened,
            setModalFileDialogOpened,
            handleModalDropZoneAccepted,
          }}
        />
      );
      break;
    }
    case 2: {
      modalTitle = "Export product specifications";
      modalContent = (
        <ExportProductsModalContent
          {...{
            modalExportIsWorking,
            modalExportScope,
            productType,
            selectedItems,
            handleModalExportScopeChanged,
          }}
        />
      );
      break;
    }
    case 3: {
      modalTitle = "Selected product's specifications";
      modalContent = (
        <DataTable
          headings={modalViewProductsTableInfo.headings}
          rows={modalViewProductsTableInfo.rows}
          columnContentTypes={modalViewProductsTableInfo.columnContentTypes}
        />
      );
      break;
    }
    case 4: {
      modalTitle = "Edit the product's specifications";

      const specificationInfoWithValues = getProductSpecificationInfoWithValues(
        modalEditingProduct,
        specificationInfo
      );
      modalContent = (
        <EditProductModalContent
          specificationInfoWithValues={specificationInfoWithValues}
        />
      );
      break;
    }
    default: {
      break;
    }
  }

  const hasPrevious =
    dataWithProducts?.products?.pageInfo?.hasPreviousPage ?? false;
  const hasNext = dataWithProducts?.products?.pageInfo?.hasNextPage ?? false;
  const lastCursor =
    dataWithProducts?.products?.edges?.slice(-1)?.[0]?.cursor ?? null;
  const firstCursor = dataWithProducts?.products?.edges?.[0]?.cursor ?? null;

  const viewProductButton = (item) =>
    item.onlineStoreUrl ? (
      <Button
        onClick={() => handleViewProductButtonClicked(item.onlineStoreUrl)}
      >
        View Product
      </Button>
    ) : null;
  return (
    <Card>
      <Modal
        large={modalStatus === 3}
        open={modalStatus}
        onClose={handleModalCloseIconClicked}
        title={modalTitle}
        primaryAction={{
          content: "Confirm",
          onAction: handleModalConfirmButtonClicked,
          disabled: modalImportIsWorking || modalExportIsWorking,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleModalCancelButtonClicked,
            disabled: modalImportIsWorking || modalExportIsWorking,
          },
        ]}
      >
        <Modal.Section>
          <div className="modal-content-wrapper" ref={modalContentWrapperRef}>
            {modalContent}
          </div>
        </Modal.Section>
      </Modal>
      <ResourceList
        resourceName={{ singular: "Product", plural: "Products" }}
        loading={loading}
        filterControl={
          <ProductsFilterControl
            {...{
              queryValue,
              productVendorValue,
              statusValue,
              availabilityValue,
              setQueryValue,
              setProductVendorValue,
              setStatusValue,
              setAvailabilityValue,
              handleClearAll,
            }}
          />
        }
        sortValue={sortValue}
        sortOptions={[
          { label: "Product title A-Z", value: "TITLE_ASC" },
          { label: "Product title Z-A", value: "TITLE_DESC" },
          { label: "Created (oldest first)", value: "CREATED_AT_ASC" },
          { label: "Created (newest first)", value: "CREATED_AT_DESC" },
          { label: "Updated (oldest first)", value: "UPDATED_AT_ASC" },
          { label: "Updated (newest first)", value: "UPDATED_AT_DESC" },
          { label: "Low inventory", value: "INVENTORY_TOTAL_ASC" },
          { label: "High inventory", value: "INVENTORY_TOTAL_DESC" },
          { label: "Product type A-Z", value: "PRODUCT_TYPE_ASC" },
          { label: "Product type Z-A", value: "PRODUCT_TYPE_DESC" },
          { label: "Vendor A-Z", value: "VENDOR_ASC" },
          { label: "Vendor Z-A", value: "VENDOR_DESC" },
        ]}
        onSortChange={setSortValule}
        selectable
        selectedItems={selectedItems}
        onSelectionChange={(items) => {
          setSelectedItems(items);
        }}
        idForItem={(item, index) => item?.id ?? index}
        promotedBulkActions={promotedBulkActions}
        items={dataWithProducts?.products?.edges?.map(({ node }) => node) ?? []}
        renderItem={(item) => {
          const media = (
            <Thumbnail
              source={
                item?.featuredImage?.originalSrc ??
                "/product_image_placeholder.png"
              }
              alt={item?.featuredImage?.altText ?? ""}
              size="small"
            />
          );

          return (
            <ResourceItem
              id={item.id}
              media={media}
              accessibilityLabel={`View details for ${item.title}`}
            >
              <Stack>
                <Stack.Item fill>
                  <h3
                    style={{
                      width: "300px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "block",
                    }}
                  >
                    {item.title}
                  </h3>
                  <h6>{item.id}</h6>
                </Stack.Item>
                <ButtonGroup>
                  <Button
                    onClick={() =>
                      handleEditProductButtonClicked(item.legacyResourceId)
                    }
                  >
                    Edit Product
                  </Button>
                  {viewProductButton(item)}
                  <Button onClick={() => handleEditButtonClicked(item.id)}>
                    Edit Specification
                  </Button>
                </ButtonGroup>
              </Stack>
            </ResourceItem>
          );
        }}
      />
      <hr style={{ marginBottom: 0 }} />
      <div style={{ padding: "15px 0" }}>
        <Stack
          alignment="center"
          distribution="center"
          wrap
          vertical
          spacing="none"
        >
          <Pagination
            hasPrevious={hasPrevious}
            onPrevious={() => {
              if (hasPrevious && firstCursor) {
                fetchMore({
                  variables: {
                    before: firstCursor,
                    last: 50,
                    first: undefined,
                  },
                });
              }
            }}
            hasNext={hasNext}
            onNext={() => {
              if (hasNext && lastCursor) {
                fetchMore({ variables: { after: lastCursor } });
              }
            }}
          />
        </Stack>
      </div>
    </Card>
  );
}

ResourceListWithProducts.propTypes = {
  setToastActive: PropTypes.func,
  setToastContent: PropTypes.func,
  modalStatusFromImportOrExport: PropTypes.number,
  setModalStatusFromImportOrExport: PropTypes.func,
  dataWithShopInfo: PropTypes.object,
  productType: PropTypes.string,
};

export default ResourceListWithProducts;
