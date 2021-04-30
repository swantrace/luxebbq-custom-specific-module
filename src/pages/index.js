import { useState } from "react";
import {
  Layout,
  Page,
  ButtonGroup,
  Button,
  Toast,
  Tabs,
} from "@shopify/polaris";

import slugify from "slugify";
import ResourceListWithProducts from "../components/products/ResourceListWithProducts";
import { useAppContext } from "../context";

const Index = () => {
  const { productTypes, hiddenProductTypes } = useAppContext();
  const [
    selectedProductTypeTabIndex,
    setSelectedProductTypeTabIndex,
  ] = useState(0);
  const [modalStatus, setModalStatus] = useState(0);
  const [toastActive, setToastActive] = useState(false);
  const [toastContent, setToastContent] = useState("");

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
      duration={2000}
    />
  ) : null;
  return (
    <Page
      title="Products"
      primaryAction={
        <ButtonGroup>
          <Button onClick={() => setModalStatus(1)}>Import</Button>
          <Button onClick={() => setModalStatus(2)}>Export</Button>
        </ButtonGroup>
      }
    >
      <Layout>
        <Layout.Section>
          <Tabs
            tabs={shownProductTypeTabs}
            selected={selectedProductTypeTabIndex}
            onSelect={handleProductTypeTabChanged}
          >
            <ResourceListWithProducts
              setToastActive={setToastActive}
              setToastContent={setToastContent}
              modalStatusFromImportOrExport={modalStatus}
              setModalStatusFromImportOrExport={setModalStatus}
              productType={shownProductTypes[selectedProductTypeTabIndex]}
            />
          </Tabs>
        </Layout.Section>
      </Layout>
      {toastMarkup}
    </Page>
  );
};
export default Index;
