import { TextField } from '@shopify/polaris';
import { useState } from 'react';
import PropTypes from 'prop-types';

function EditProductNumber({ label, name, type, value }) {
  const [number, setNumber] = useState(() => value ?? '');
  return (
    <TextField
      name={name}
      label={label}
      type={type}
      value={number}
      onChange={setNumber}
    />
  );
}

EditProductNumber.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.string,
};

export default EditProductNumber;
