import { ChoiceList } from '@shopify/polaris';
import PropTypes from 'prop-types';
import { useState } from 'react';

function ProductTypeCombinerContent({ productTypes }) {
  const [selected, setSelected] = useState([]);
  return (
    <ChoiceList
      allowMultiple
      name="old-product-type-names"
      choices={productTypes.map((type) => ({
        label: type,
        value: type,
      }))}
      selected={selected}
      onChange={setSelected}
    />
  );
}

ProductTypeCombinerContent.propTypes = {
  productTypes: PropTypes.arrayOf(PropTypes.string),
};

export default ProductTypeCombinerContent;
