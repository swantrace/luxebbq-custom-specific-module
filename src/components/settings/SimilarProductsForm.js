import { useApolloClient } from "@apollo/client";
import {
  Form,
  Card,
  FormLayout,
  TextContainer,
  Stack,
  Autocomplete,
  Button,
  Tag,
} from "@shopify/polaris";
import axios from "axios";
import difference from "lodash.difference";
import { useState } from "react";
import PropTypes from "prop-types";
import { useAppContext } from "../../context";
import { titleCase } from "../../utils";

const deselectedOptions = [
  { value: "price50", label: "Price +- 50" },
  { value: "collection", label: "Same collection" },
  { value: "brand", label: "Same brand" },
  { value: "type", label: "Same product type" },
];

function SimilarProductsForm({ setToastContent, setToastActive }) {
  const client = useApolloClient();
  const { shopMetafields } = useAppContext();
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState(deselectedOptions);
  const similarProductsRulesFromQuery = JSON.parse(
    shopMetafields?.find(({ key }) => key === "similar")?.value ?? "[]"
  );
  const [selectedOptions, setSelectedOptions] = useState(
    similarProductsRulesFromQuery
  );

  const handleTextChanged = (value) => {
    setInputValue(value);
    if (value === "") {
      setOptions(deselectedOptions);
      return;
    }
    const filterRegex = new RegExp(value, "i");
    const resultOptions = deselectedOptions.filter((option) =>
      option.label.match(filterRegex)
    );
    setOptions(resultOptions);
  };
  const handleTagRemoved = (tag) => {
    const newOptions = [...selectedOptions];
    newOptions.splice(newOptions.indexOf(tag), 1);
    setSelectedOptions(newOptions);
  };
  const handleNewOptionSelected = (selected) => {
    setSelectedOptions((previousSelectedOptions) => {
      if (selected.length > previousSelectedOptions.length) {
        const newAdded = difference(selected, previousSelectedOptions);
        return [...previousSelectedOptions, ...newAdded];
      }
      if (selected.length < previousSelectedOptions.length) {
        return previousSelectedOptions.filter((option) =>
          selected.includes(option)
        );
      }
      return previousSelectedOptions;
    });
  };
  const handleSimilarProductsFormSubmitted = async () => {
    try {
      const newMetafield = await axios
        .post("/createMetafield", {
          key: "similar",
          namespace: "dtm",
          owner_resource: "shop",
          type: "json",
          value: JSON.stringify(selectedOptions),
        })
        .then((response) => response.data);

      client.cache.modify({
        id: `Metafield:${newMetafield.admin_graphql_api_id}`,
        fields: {
          value() {
            return newMetafield.value;
          },
        },
      });
      setToastContent("Changes saved");
      setToastActive(true);
    } catch (err) {
      setToastContent("Failed to save changes");
      setToastActive(true);
    }
  };

  const tagsMarkup = selectedOptions.map((option) => {
    const tagLabel = titleCase(option);
    return (
      <Tag key={`option${option}`} onRemove={() => handleTagRemoved(option)}>
        {tagLabel}
      </Tag>
    );
  });

  const textField = (
    <Autocomplete.TextField
      onChange={handleTextChanged}
      label="Similar Products"
      labelHidden
      value={inputValue}
    />
  );
  return (
    <Form onSubmit={handleSimilarProductsFormSubmitted}>
      <Card sectioned>
        <FormLayout>
          <TextContainer>
            <Stack>{tagsMarkup}</Stack>
          </TextContainer>
          <Autocomplete
            allowMultiple
            options={options}
            selected={selectedOptions}
            textField={textField}
            onSelect={handleNewOptionSelected}
          />
        </FormLayout>
      </Card>
      <Card sectioned>
        <FormLayout>
          <Button submit primary fullWidth>
            Submit
          </Button>
        </FormLayout>
      </Card>
    </Form>
  );
}

SimilarProductsForm.propTypes = {
  setToastContent: PropTypes.func,
  setToastActive: PropTypes.func,
};

export default SimilarProductsForm;
