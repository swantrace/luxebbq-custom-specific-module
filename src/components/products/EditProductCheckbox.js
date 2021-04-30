import { Checkbox } from '@shopify/polaris';
import { useState } from 'react';
import PropTypes from 'prop-types';

function EditProductCheckbox({ label, name, value }) {
  const [checked, setChecked] = useState(() => value ?? false);
  return (
    <Checkbox
      checked={checked}
      name={name}
      label={label}
      value={checked}
      onChange={setChecked}
    />
  );
}

EditProductCheckbox.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string,
  value: PropTypes.string,
};

export default EditProductCheckbox;
