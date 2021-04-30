/* eslint-disable react/prop-types */
import { ClientRouter as AppBridgeClientRouter } from '@shopify/app-bridge-react';
import { useRouter } from 'next/router';

function ClientRouter() {
  const router = useRouter();
  return <AppBridgeClientRouter history={router} />;
}

export default ClientRouter;
