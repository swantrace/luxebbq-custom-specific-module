import { Page, Layout, Toast } from '@shopify/polaris';
import { useState } from 'react';

import DangerousZone from '../components/settings/DangerousZone';

const DeveloperOnly = () => {
  const [toastActive, setToastActive] = useState(false);
  const [toastContent, setToastContent] = useState('');

  const toastMarkup = toastActive ? (
    <Toast
      content={toastContent}
      onDismiss={() => setToastActive(false)}
      duration={3000}
    />
  ) : null;

  return (
    <Page fullWidth title="Developer Only">
      <Layout>
        <Layout.Section>
          <DangerousZone {...{ setToastContent, setToastActive }} />
        </Layout.Section>
      </Layout>
      {toastMarkup}
    </Page>
  );
};

export default DeveloperOnly;
