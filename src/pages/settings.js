/* eslint-disable shopify/jsx-no-complex-expressions */
import { useApolloClient } from "@apollo/client";
import {
  Page,
  Layout,
  Toast,
  Tabs,
  Stack,
  ButtonGroup,
  Button,
  Form,
} from "@shopify/polaris";
import axios from "axios";
import { useRef, useState } from "react";
import slugify from "slugify";
import HideProductTypeCheckbox from "../components/settings/HideProductTypeCheckbox";
import SimilarProductsForm from "../components/settings/SimilarProductsForm";
import SpecificationRulesForm from "../components/settings/SpecificationRulesForm";
import { useAppContext } from "../context";
import { getDownloadLink } from "../utils";

const Settings = () => {
  const {
    productTypes,
    hiddenProductTypes,
    setHiddenProductTypes,
    shopMetafields,
    refetchShopInfo,
  } = useAppContext();
  const client = useApolloClient();
  const importExportFormWrapperRef = useRef();
  const [
    selectedProductTypeTabIndex,
    setSelectedProductTypeTabIndex,
  ] = useState(0);
  const [toastActive, setToastActive] = useState(false);
  const [toastContent, setToastContent] = useState("");
  const [importFileFormData, setImportFileFormData] = useState(null);

  const shownProductTypes = productTypes.filter(
    (t) => !hiddenProductTypes.includes(t)
  );
  const shownProductTypeTabs = shownProductTypes.map((type) => ({
    id: slugify(type),
    content: type,
  }));

  const handleProductTypeTabChanged = (selectedTabIndex) => {
    setSelectedProductTypeTabIndex(selectedTabIndex);
  };

  const toastMarkup = toastActive ? (
    <Toast
      content={toastContent}
      onDismiss={() => setToastActive(false)}
      duration={3000}
    />
  ) : null;

  const handleImportFileInputChanged = (e) => {
    if (e.target?.files?.[0]) {
      const formData = new FormData();
      formData.append("json", e.target?.files?.[0]);
      setImportFileFormData(formData);
    }
  };

  const handleImportCancelButtonClicked = () => {
    const form = importExportFormWrapperRef.current.querySelector("form");
    console.log("form", form);
    const fileInput = form.querySelector('input[type="file"]');
    fileInput.value = "";
    setImportFileFormData(null);
  };

  const handleSpecificationRulesExportButtonClicked = async () => {
    try {
      await refetchShopInfo();
      const similarMetafield = shopMetafields.find(
        ({ key }) => key === "similar"
      );
      const infoMetafield = shopMetafields.find(({ key }) => key === "info");
      console.log(similarMetafield, infoMetafield);
      const objectToExport = {};
      if (similarMetafield) {
        objectToExport.similar = JSON.parse(similarMetafield.value);
      }
      if (infoMetafield) {
        objectToExport.info = JSON.parse(infoMetafield.value);
      }
      const jsonToExport = JSON.stringify(objectToExport);
      console.log(jsonToExport);
      const blob = new Blob([jsonToExport], { type: "application/json" });
      const now = new Date();
      const fileName = `${now.toDateString()} ${
        now.toTimeString().split(" ")[0]
      }.json`;
      const csvLink = getDownloadLink(blob, fileName);
      csvLink.click();
    } catch (err) {
      setToastContent(err.message);
      setToastActive(true);
    }
  };

  const handleSpecificationRulesImportButtonClicked = async () => {
    try {
      const specificationFromJson = await axios
        .post("/importJSON", importFileFormData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        })
        .then((response) => response.data);

      const newInfoObject = specificationFromJson.info;
      const newSimilarObject = specificationFromJson.similar;
      console.log(newInfoObject, newSimilarObject);
      if (newInfoObject) {
        const newInfoMetafield = await axios
          .post("/createMetafield", {
            key: "info",
            namespace: "dtm",
            owner_resource: "shop",
            value_type: "json_string",
            value: JSON.stringify(newInfoObject),
          })
          .then((response) => response.data);

        client.cache.modify({
          id: `Metafield:${newInfoMetafield.admin_graphql_api_id}`,
          fields: {
            value() {
              return newInfoMetafield.value;
            },
          },
        });
      }
      if (newSimilarObject) {
        const newSimilarMetafield = await axios
          .post("/createMetafield", {
            key: "similar",
            namespace: "dtm",
            owner_resource: "shop",
            value_type: "json_string",
            value: JSON.stringify(newSimilarObject),
          })
          .then((response) => response.data);

        client.cache.modify({
          id: `Metafield:${newSimilarMetafield.admin_graphql_api_id}`,
          fields: {
            value() {
              return newSimilarMetafield.value;
            },
          },
        });
      }
      setImportFileFormData(null);
      setToastContent("File imported");
      setToastActive(true);
    } catch (err) {
      setImportFileFormData(null);
      setToastContent("Failed to import file because", err.message);
      setToastActive(true);
    }
  };

  return (
    <Page fullWidth title="Settings">
      <Layout>
        <Layout.AnnotatedSection
          title="Hide irrelevant product types"
          description="check product types that you wouldn't like to show"
        >
          <Stack>
            {productTypes.map((productType) => (
              <HideProductTypeCheckbox
                key={slugify(productType)}
                productType={productType}
                hiddenProductTypes={hiddenProductTypes}
                setHiddenProductTypes={setHiddenProductTypes}
              />
            ))}
          </Stack>
        </Layout.AnnotatedSection>
        <Layout.AnnotatedSection
          title="Specification settings"
          description="Add or edit specification rules"
        >
          <div
            style={{ display: "flex", justifyContent: "flex-end" }}
            ref={importExportFormWrapperRef}
          >
            <Form>
              <ButtonGroup>
                <input
                  type="file"
                  name="json"
                  id="json"
                  accept="application/json"
                  onChange={handleImportFileInputChanged}
                />
                {importFileFormData ? (
                  <Button onClick={handleImportCancelButtonClicked}>
                    Cancel
                  </Button>
                ) : null}
                <Button
                  onClick={handleSpecificationRulesImportButtonClicked}
                  disabled={!importFileFormData}
                >
                  Import
                </Button>
                <Button onClick={handleSpecificationRulesExportButtonClicked}>
                  Export
                </Button>
              </ButtonGroup>
            </Form>
          </div>
          <Tabs
            tabs={shownProductTypeTabs}
            selected={selectedProductTypeTabIndex}
            onSelect={handleProductTypeTabChanged}
          >
            <SpecificationRulesForm
              {...{ setToastContent, setToastActive }}
              productType={shownProductTypes[selectedProductTypeTabIndex]}
            />
          </Tabs>
        </Layout.AnnotatedSection>
        <Layout.AnnotatedSection
          title="Similar products"
          description="Control the priorities of different factors"
        >
          <SimilarProductsForm {...{ setToastContent, setToastActive }} />
        </Layout.AnnotatedSection>
        {/* <div className="danger-zone" style={{ width: '100%' }}>
          <hr style={{ marginTop: '28px', marginLeft: '1.5em' }} />
          <Layout.AnnotatedSection
            title="Danger Zone"
            description="Do something about tags globally"
          >
            <DangerousZone {...{ setToastContent, setToastActive }} />
          </Layout.AnnotatedSection>
        </div> */}
      </Layout>
      {toastMarkup}
    </Page>
  );
};

export default Settings;
