import { Page, Layout, Toast } from '@shopify/polaris';
import { useState } from 'react';
import ResourceListWithCollections from '../components/collections/ResourceListWithCollections';

const Collections = () => {
  const [toastActive, setToastActive] = useState(false);
  const [toastContent, setToastContent] = useState('');
  const toastMarkup = toastActive ? (
    <Toast
      content={toastContent}
      onDismiss={() => setToastActive(false)}
      duration={2000}
    />
  ) : null;

  return (
    <Page title="Collections">
      <Layout>
        <Layout.Section>
          <ResourceListWithCollections
            setToastActive={setToastActive}
            setToastContent={setToastContent}
          />
        </Layout.Section>
      </Layout>
      {toastMarkup}
    </Page>
  );
};

export default Collections;
