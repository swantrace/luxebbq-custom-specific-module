import { TextField } from '@shopify/polaris';
import { useState } from 'react';
import PropTypes from 'prop-types';

function EditProductTextArea({ label, name, value }) {
  const [text, setText] = useState(() => value?.join('\n') ?? '');
  return (
    <TextField
      multiline={3}
      name={name}
      label={label}
      value={text}
      onChange={setText}
    />
  );
}

EditProductTextArea.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.arrayOf(PropTypes.string),
};

export default EditProductTextArea;
