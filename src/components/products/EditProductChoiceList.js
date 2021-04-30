import { ChoiceList } from '@shopify/polaris';
import { useState } from 'react';
import PropTypes from 'prop-types';

function EditProductChoiceList({ label, name, value, options }) {
  const [selected, setSelected] = useState(() => value ?? []);
  return (
    <ChoiceList
      allowMultiple
      name={name}
      title={label}
      choices={[
        ...options.map((option) => ({
          label: option,
          value: option,
        })),
      ]}
      selected={selected}
      onChange={setSelected}
    />
  );
}

EditProductChoiceList.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.string),
  value: PropTypes.arrayOf(PropTypes.string),
};

export default EditProductChoiceList;
