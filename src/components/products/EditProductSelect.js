import { Select } from '@shopify/polaris';
import { useState } from 'react';
import PropTypes from 'prop-types';

function EditProductSelect({ label, name, value, options }) {
  const [selected, setSelected] = useState(() => value ?? '');
  return (
    <Select
      name={name}
      label={label}
      options={[
        { label: 'N/A', value: '' },
        ...options.map((option) => ({
          label: option,
          value: option,
        })),
      ]}
      value={selected}
      onChange={setSelected}
    />
  );
}

EditProductSelect.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.string),
  value: PropTypes.string,
};

export default EditProductSelect;
