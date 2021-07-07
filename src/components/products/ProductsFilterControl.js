import { ChoiceList, Filters } from "@shopify/polaris";
import PropTypes from "prop-types";
import { useAppContext } from "../../context";

function ProductsFilterControl({
  queryValue,
  productVendorValue,
  statusValue,
  availabilityValue,
  setQueryValue,
  setProductVendorValue,
  setStatusValue,
  setAvailabilityValue,
  handleClearAll,
}) {
  const { productVendors } = useAppContext();
  const filters = [
    {
      key: "status",
      label: "Status",
      filter: (
        <ChoiceList
          allowMultiple
          title=""
          choices={[
            { label: "Active", value: "ACTIVE" },
            { label: "Draft", value: "DRAFT" },
            { label: "Archived", value: "ARCHIVED" },
          ]}
          selected={statusValue}
          onChange={setStatusValue}
        />
      ),
      shortcut: true,
    },
    {
      key: "availability",
      label: "Availability",
      filter: (
        <ChoiceList
          title=""
          choices={[
            { label: "Unavailable on all channels", value: "unavailable" },
            {
              label: "Available on Online Store",
              value: "online_store:visible",
            },
            {
              label: "Unavailable on Online Store",
              value: "online_store:hidden",
            },
          ]}
          selected={availabilityValue}
          onChange={setAvailabilityValue}
        />
      ),
      shortcut: true,
    },
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

  const statusAppliedFilter =
    statusValue.length > 0
      ? [
          statusValue.reduce(
            (acc, status) => {
              if (acc.label) {
                acc.label = `${acc.label.replace("is", "contains")}, ${status}`;
              } else {
                acc.label = `Status is ${status}`;
              }
              return acc;
            },
            {
              key: "status",
              onRemove: () => setStatusValue([]),
              label: "",
            }
          ),
        ]
      : [];

  const availabilityAppliedFilter =
    availabilityValue.length > 0
      ? [
          availabilityValue.reduce(
            (acc, availability) => {
              if (acc.label) {
                acc.label = `${acc.label.replace(
                  "is",
                  "contains"
                )}, ${availability}`;
              } else {
                acc.label = `Availability is ${availability}`;
              }
              return acc;
            },
            {
              key: "availability",
              onRemove: () => setAvailabilityValue([]),
              label: "",
            }
          ),
        ]
      : [];

  const vendorAppliedFilter =
    productVendorValue.length > 0
      ? [
          productVendorValue.reduce(
            (acc, vendor) => {
              if (acc.label) {
                acc.label = `${acc.label.replace("is", "contains")}, ${vendor}`;
              } else {
                acc.label = `Product vendor is ${vendor}`;
              }
              return acc;
            },
            {
              key: "productVendor",
              onRemove: () => setProductVendorValue([]),
              label: "",
            }
          ),
        ]
      : [];

  return (
    <Filters
      queryPlaceholder="Please enter one product's title, sku or barcode"
      queryValue={queryValue}
      filters={filters}
      appliedFilters={[
        ...statusAppliedFilter,
        ...availabilityAppliedFilter,
        ...vendorAppliedFilter,
      ]}
      onQueryChange={setQueryValue}
      onQueryClear={() => setQueryValue("")}
      onClearAll={handleClearAll}
    />
  );
}

ProductsFilterControl.propTypes = {
  queryValue: PropTypes.string,
  productVendorValue: PropTypes.arrayOf(PropTypes.string),
  statusValue: PropTypes.arrayOf(PropTypes.string),
  availabilityValue: PropTypes.arrayOf(PropTypes.string),
  setQueryValue: PropTypes.func,
  setProductVendorValue: PropTypes.func,
  setStatusValue: PropTypes.func,
  setAvailabilityValue: PropTypes.func,
  handleClearAll: PropTypes.func,
};

export default ProductsFilterControl;
