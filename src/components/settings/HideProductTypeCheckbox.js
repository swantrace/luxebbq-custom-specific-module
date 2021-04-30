import { Checkbox } from '@shopify/polaris';
import { useState } from 'react';
import uniq from 'lodash.uniq';
import PropTypes from 'prop-types';

function HideProductTypeCheckbox({
  productType,
  hiddenProductTypes,
  setHiddenProductTypes,
}) {
  const [checked, setChecked] = useState(
    !!hiddenProductTypes.includes(productType)
  );
  const handleProductTypeCheckboxChange = (newChecked) => {
    setChecked(newChecked);
    if (newChecked) {
      setHiddenProductTypes((previousHiddenProductTypes) => {
        const newHiddenProductTypes = uniq([
          ...previousHiddenProductTypes,
          productType,
        ]);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(
            'hiddenProductTypes',
            JSON.stringify(newHiddenProductTypes)
          );
        }
        return newHiddenProductTypes;
      });
    } else {
      setHiddenProductTypes((previousHiddenProductTypes) => {
        const newHiddenProductTypes = previousHiddenProductTypes.filter(
          (p) => p !== productType
        );
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(
            'hiddenProductTypes',
            JSON.stringify(newHiddenProductTypes)
          );
        }
        return newHiddenProductTypes;
      });
    }
  };
  return (
    <Checkbox
      label={productType}
      checked={checked}
      onChange={handleProductTypeCheckboxChange}
    />
  );
}

HideProductTypeCheckbox.propTypes = {
  productType: PropTypes.string,
  hiddenProductTypes: PropTypes.arrayOf(PropTypes.string),
  setHiddenProductTypes: PropTypes.func,
};

export default HideProductTypeCheckbox;
