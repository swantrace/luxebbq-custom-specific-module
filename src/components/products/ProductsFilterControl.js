import { ChoiceList, Filters } from "@shopify/polaris";
import PropTypes from "prop-types";
import { useAppContext } from "../../context";

function ProductsFilterControl({
  queryValue,
  productVendorValue,
  setQueryValue,
  setProductVendorValue,
  handleClearAll,
}) {
  const { productVendors } = useAppContext();
  const filters = [
    {
      key: "productVendor",
      label: "Product vendor",
      filter: (
        <ChoiceList
          allowMultiple
          title=""
          choices={
            productVendors?.map((vendor) => ({
              label: vendor,
              value: vendor,
            })) ?? []
          }
          selected={productVendorValue}
          onChange={setProductVendorValue}
        />
      ),
      shortcut: true,
    },
  ];

  const vendorAppliedFilter = productVendorValue.reduce((acc, vendor) => {
    if (acc.length === 0) {
      acc[0] = {};
    }
    acc[0].key ??= "productVendor";
    acc[0].onRemove ??= () => setProductVendorValue([]);
    if (acc[0].label) {
      acc[0].label = `${acc[0].label.replace("is", "contains")}, ${vendor}`;
    } else {
      acc[0].label = `Product vendor is ${vendor}`;
    }
    return acc;
  }, []);

  return (
    <Filters
      queryPlaceholder="Please enter one product's title, sku or barcode"
      queryValue={queryValue}
      filters={filters}
      appliedFilters={vendorAppliedFilter}
      onQueryChange={setQueryValue}
      onQueryClear={() => setQueryValue("")}
      onClearAll={handleClearAll}
    />
  );
}

ProductsFilterControl.propTypes = {
  queryValue: PropTypes.string,
  productVendorValue: PropTypes.arrayOf(PropTypes.string),
  setQueryValue: PropTypes.func,
  setProductVendorValue: PropTypes.func,
  handleClearAll: PropTypes.func,
};

export default ProductsFilterControl;
