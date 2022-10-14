/* eslint-disable no-nested-ternary */
/* eslint-disable shopify/polaris-no-bare-stack-item */
/* eslint-disable camelcase */
/* eslint-disable shopify/jsx-no-complex-expressions */
import {
  Stack,
  Button,
  TextStyle,
  Card,
  Form,
  TextField,
  Tabs,
  FormLayout,
} from "@shopify/polaris";
import PropTypes from "prop-types";
import uniq from "lodash.uniq";
import isEqual from "lodash.isequal";
import { useApolloClient, useMutation } from "@apollo/client";
import { map as pmap, delay as pdelay } from "bluebird";
import { useRef, useState } from "react";
import slugify from "slugify";
import {
  getQueryString,
  getRawExportedData,
  UPDATE_PRODUCT,
} from "../../utils";
import { useAppContext } from "../../context";
import ExistedTagDuplicator from "./ExistedTagDuplicator";
import ProductTypeCombinerContent from "./ProductTypeCombinerContent";
import ProductTypeTags from "./ProductTypeTags";

function DangerousZone({ setToastContent, setToastActive }) {
  const client = useApolloClient();
  const { productTypes, refetchShopInfo } = useAppContext();
  const [updateProduct] = useMutation(UPDATE_PRODUCT);
  const [leftProducts, setLeftProducts] = useState(0);
  const [hardWorking, setHardWorking] = useState(false);
  const [newProductTypeNameValue, setNewProductTypeNameValue] = useState("");
  const [
    selectedProductTypeTabIndex,
    setSelectedProductTypeTabIndex,
  ] = useState(0);
  const [productsToClearTags, setProductsToClearTags] = useState([]);
  const [tagsToRemove, setTagsToRemove] = useState([]);
  const [tagsHasBeenRemoved, setTagsHasBeenRemoved] = useState([]);
  const formWrapperRef = useRef();
  const combinerFormWrapperRef = useRef();
  const removerFormWrapperRef = useRef();

  const updateProductsAccordingToUpdateInputs = async ({
    updateInputs,
    productsLength,
    setLeftProductsCount,
  }) => {
    let availablePointsCount = 1000;
    let index = 0;
    await pmap(
      updateInputs,
      async (input) => {
        index += 1;
        setLeftProductsCount(productsLength - index);
        if (availablePointsCount > 100) {
          const { extensions } = await updateProduct({
            variables: { input },
          });
          availablePointsCount =
            extensions.cost.throttleStatus.currentlyAvailable;
          return availablePointsCount;
        }
        await pdelay(1000);
        const { extensions: extensions_1 } = await updateProduct({
          variables: { input },
        });
        availablePointsCount =
          extensions_1.cost.throttleStatus.currentlyAvailable;
        return availablePointsCount;
      },
      { concurrency: 4 }
    );
  };

  const handleGlobalDTMTagsRemoverClicked = async () => {
    setHardWorking(true);
    try {
      const rawExportedData = await getRawExportedData(client, null);
      const productsLength = rawExportedData.length;
      setLeftProducts(productsLength);
      const updateInputs = rawExportedData.map((product) => {
        const { id } = product;
        const tags = product.tags.filter((tag) => !tag.startsWith("dtm_"));
        const metafields = {
          key: "info",
          namespace: "dtm",
          type: "json",
          value: JSON.stringify({}),
        };
        if (product.metafield.id) {
          metafields.id = product.metafield.id;
        }
        return { id, tags, metafields };
      });

      await updateProductsAccordingToUpdateInputs({
        updateInputs,
        productsLength,
        setLeftProductsCount: setLeftProducts,
      });
      setToastContent("Finish removing all specifications");
      setToastActive(true);
    } catch (err) {
      console.error(err);
      setToastContent("Failed to update tags, because ", err.message);
      setToastActive(true);
    }
    setLeftProducts(0);
    setHardWorking(false);
  };

  const handleTagDuplicatorConfirmButtonClicked = async () => {
    setHardWorking(true);
    try {
      const inputRegex = /^(?:.+,\s*dtm_[^,\n]+\n{0,1}){1,}$/;
      const form = formWrapperRef.current.querySelector("form");
      const toBeSubmittedValues = Array.from(form.elements)
        .filter((element) => element.name)
        .reduce((acc, element) => {
          if (inputRegex.test(element.value)) {
            acc[element.name] = Object.fromEntries(
              element.value.split("\n").map((pairString) =>
                pairString.split(",").map((s, idx) => {
                  if (idx === 0) {
                    return s.trim().replaceAll(/\s+/g, "-").toLowerCase();
                  }
                  return s.trim();
                })
              )
            );
          }
          return acc;
        }, {});

      console.log("toBeSubmittedValues: ", toBeSubmittedValues);
      const rawExportedData = await getRawExportedData(
        client,
        `${getQueryString(Object.keys(toBeSubmittedValues), "", [])}`
      );
      const productsLength = rawExportedData.length;
      setLeftProducts(productsLength);
      const updateInputs = rawExportedData
        .map((product) => {
          const { id, tags: originalTags, productType } = product;
          console.log("originalTags: ", originalTags);
          const tags = uniq(
            (originalTags ?? []).reduce((acc, currentOldTag) => {
              let copiedAcc = [...acc, currentOldTag];
              if (
                toBeSubmittedValues[productType][
                currentOldTag.trim().replaceAll(/\s+/g, "-").toLowerCase()
                ]
              ) {
                copiedAcc = [
                  ...copiedAcc,
                  toBeSubmittedValues[productType][
                  currentOldTag.replace(/\s+/g, "-").toLowerCase().trim()
                  ],
                ];
              }
              return copiedAcc;
            }, [])
          );
          if (isEqual(tags, originalTags)) {
            return false;
          }
          return { id, tags };
        })
        .filter((t) => t);
      await updateProductsAccordingToUpdateInputs({
        updateInputs,
        productsLength,
        setLeftProductsCount: setLeftProducts,
      });
      setToastContent("Finish adding all tags");
      setToastActive(true);
    } catch (err) {
      console.error(err);
      setLeftProducts(0);
      setHardWorking(false);
      setToastContent("Failed to duplicate tags, because ", err.message);
      setToastActive(true);
    }
    setLeftProducts(0);
    setHardWorking(false);
  };

  const handleProductTypeCombinerConfirmButtonClicked = async () => {
    setHardWorking(true);
    try {
      const form = combinerFormWrapperRef.current.querySelector("form");
      const toBeSubmittedValues = Array.from(form.elements)
        .filter((element) => element.name)
        .reduce((acc, element) => {
          if (/old-product-type-names\[\]/.test(element.name)) {
            if (element.checked) {
              const key = element.name.replace("[]", "");
              acc[key] = [...(acc[key] ?? []), element.value];
            }
          } else {
            acc[element.name] = element.value;
          }
          return acc;
        }, {});

      const oldProductTypeNames = toBeSubmittedValues["old-product-type-names"];
      const newProductTypeName = toBeSubmittedValues["new-product-type-name"];
      if (
        Array.isArray(oldProductTypeNames) &&
        oldProductTypeNames.length > 0 &&
        newProductTypeName
      ) {
        const rawExportedData = await getRawExportedData(
          client,
          `${getQueryString(oldProductTypeNames, "", [])}`
        );
        const productsLength = rawExportedData.length;
        setLeftProducts(productsLength);
        const updateInputs = rawExportedData.map((product) => {
          const { id } = product;
          const productType = newProductTypeName;
          return { id, productType };
        });
        await updateProductsAccordingToUpdateInputs({
          updateInputs,
          productsLength,
          setLeftProductsCount: setLeftProducts,
        });
        await refetchShopInfo();
      } else {
        throw new Error("You need to select at least one product type");
      }

      setToastContent("Finish combining product types");
      setToastActive(true);
    } catch (err) {
      console.error(err);
      setLeftProducts(0);
      setHardWorking(false);
      setToastContent("Failed to combine product types, because ", err.message);
      setToastActive(true);
    }
    setLeftProducts(0);
    setHardWorking(false);
  };

  const handleProductTypeTabChanged = (selectedTabIndex) => {
    setSelectedProductTypeTabIndex(selectedTabIndex);
  };

  const handleTagsRemoverConfirmButtonClicked = async () => {
    // console.log(e);
    // console.log(tagsToRemove, productsToClearTags);
    setHardWorking(true);
    try {
      const productsLength = productsToClearTags.length;
      setLeftProducts(productsLength);
      const updateInputs = productsToClearTags
        .map((product) => {
          const { id, tags: originalTags } = product;
          const tags = originalTags.filter(
            (tag) => !tagsToRemove.includes(tag)
          );
          if (isEqual(originalTags, tags)) {
            return false;
          }
          return {
            id,
            tags,
          };
        })
        .filter((t) => t);
      await updateProductsAccordingToUpdateInputs({
        updateInputs,
        productsLength,
        setLeftProductsCount: setLeftProducts,
      });
      sessionStorage.removeItem(
        slugify(productTypes[selectedProductTypeTabIndex], { lower: true })
      );
      setTagsHasBeenRemoved((originalTags) =>
        uniq([...originalTags, ...tagsToRemove])
      );
      setTagsToRemove([]);
      setToastContent("Finish removing product tags");
      setToastActive(true);
    } catch (err) {
      console.error(err);
      setLeftProducts(0);
      setHardWorking(false);
      setToastContent("Failed to remove product tags, because ", err.message);
      setToastActive(true);
    }
    setLeftProducts(0);
    setHardWorking(false);
  };

  return (
    <Stack vertical wrap={false}>
      <Stack.Item>
        <Stack>
          <Stack.Item fill>
            <div style={{ lineHeight: "36px" }}>
              <TextStyle>
                {leftProducts > 0
                  ? `${leftProducts} products left to update`
                  : hardWorking
                    ? `I am grabbing product info now`
                    : `I am not working now`}
              </TextStyle>
            </div>
          </Stack.Item>
          <Button
            onClick={handleGlobalDTMTagsRemoverClicked}
            disabled={hardWorking}
          >
            Remove all specification
          </Button>
        </Stack>
      </Stack.Item>
      <Stack.Item>
        <Card sectioned title="Existed Tags Duplicator">
          <div ref={formWrapperRef} style={{ marginBottom: "30px" }}>
            <Form>
              <Stack vertical>
                {productTypes.map((type) => (
                  <ExistedTagDuplicator key={type} productType={type} />
                ))}
              </Stack>
            </Form>
          </div>
          <Button
            primary
            fullWidth
            disabled={hardWorking}
            onClick={handleTagDuplicatorConfirmButtonClicked}
          >
            Confirm
          </Button>
        </Card>
      </Stack.Item>
      <Stack.Item>
        <Card sectioned title="Existed Tags Remover">
          <Tabs
            tabs={productTypes.map((type) => ({
              id: slugify(type),
              content: type,
            }))}
            selected={selectedProductTypeTabIndex}
            onSelect={handleProductTypeTabChanged}
          >
            <div
              ref={removerFormWrapperRef}
              style={{ marginBottom: "30px", padding: "10px 15px 0" }}
              className="remover-form-wrapper"
            >
              <Form>
                <FormLayout>
                  <ProductTypeTags
                    productType={productTypes[selectedProductTypeTabIndex]}
                    tagsHasBeenRemoved={tagsHasBeenRemoved}
                    handleProductsLoaded={setProductsToClearTags}
                    setTagsToRemove={setTagsToRemove}
                  />
                </FormLayout>
              </Form>
            </div>
            <Button
              primary
              fullWidth
              disabled={hardWorking}
              onClick={handleTagsRemoverConfirmButtonClicked}
            >
              Confirm
            </Button>
          </Tabs>
        </Card>
      </Stack.Item>
      <Stack.Item>
        <Card sectioned title="ProductType Combiner">
          <div
            ref={combinerFormWrapperRef}
            style={{ marginBottom: "30px" }}
            className="combiner-form-wrapper"
          >
            <Form>
              <Stack vertical>
                <ProductTypeCombinerContent productTypes={productTypes} />
                <TextField
                  label="New product type name"
                  name="new-product-type-name"
                  value={newProductTypeNameValue}
                  onChange={setNewProductTypeNameValue}
                />
              </Stack>
            </Form>
          </div>
          <Button
            primary
            fullWidth
            disabled={hardWorking}
            onClick={handleProductTypeCombinerConfirmButtonClicked}
          >
            Confirm
          </Button>
        </Card>
      </Stack.Item>
    </Stack>
  );
}

DangerousZone.propTypes = {
  setToastActive: PropTypes.func,
  setToastContent: PropTypes.func,
};

export default DangerousZone;
