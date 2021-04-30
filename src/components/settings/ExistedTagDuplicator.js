import { Stack, TextField } from '@shopify/polaris';
import PropTypes from 'prop-types';
import { useState } from 'react';

function ExistedTagDuplicator({ productType }) {
  const [text, setText] = useState('');
  return (
    <Stack>
      <div style={{ minWidth: '150px', textAlign: 'left' }}>{productType}</div>
      <Stack.Item fill>
        <TextField
          multiline
          name={productType}
          type="text"
          value={text}
          onChange={setText}
        />
      </Stack.Item>
    </Stack>
  );
}

ExistedTagDuplicator.propTypes = {
  productType: PropTypes.string,
};

export default ExistedTagDuplicator;
