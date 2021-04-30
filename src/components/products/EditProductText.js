import { TextField } from '@shopify/polaris';
import { useState } from 'react';
import PropTypes from 'prop-types';

function EditProductText({ label, name, value, type }) {
  const [text, setText] = useState(() => value ?? '');
  return (
    <TextField
      name={name}
      label={label}
      type={type}
      value={text}
      onChange={setText}
    />
  );
}

EditProductText.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.string,
};

export default EditProductText;
