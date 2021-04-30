import { useApolloClient } from "@apollo/client";
import { Form, Card, FormLayout, Stack, Button } from "@shopify/polaris";
import axios from "axios";
import pickBy from "lodash.pickby";
import { useState } from "react";
import slugify from "slugify";
import PropTypes from "prop-types";
import { useAppContext } from "../../context";
import SettingRuleInputs from "./SettingRuleInputs";
import SettingRuleInputsContent from "./SettingRuleInputsContent";

function SpecificationRulesForm({
  setToastContent,
  setToastActive,
  productType,
}) {
  const client = useApolloClient();
  const { shopMetafields } = useAppContext();
  const [labelValue, setLabelValue] = useState("");
  const [nameValue, setNameValue] = useState("");
  const [positionValue, setPositionValue] = useState("tag");
  const [typeValue, setTypeValue] = useState("text");
  const [optionsValue, setOptionsValue] = useState([]);
  const specificationRulesFromQuery = JSON.parse(
    shopMetafields?.find(({ key }) => key === "info")?.value ?? "{}"
  );
  const specificationRulesFromQueryForThisProductType =
    specificationRulesFromQuery?.[productType] ?? {};

  const [
    toBeSubmittedSpecificationRules,
    setToBeSubmittedSpecificationRules,
  ] = useState(specificationRulesFromQueryForThisProductType);

  const resetSpecificationRuleAdderInputs = () => {
    setLabelValue("");
    setNameValue("");
    setPositionValue("tag");
    setTypeValue("text");
    setOptionsValue([]);
  };
  const handleLabelValueChanged = (value) => {
    setLabelValue(value);
    setNameValue(slugify(value, { lower: true }));
  };
  const handleOptionsValueChanged = (value) => {
    setOptionsValue(value.trim() === "" ? [] : value.split(","));
  };
  const handleSpecificationRulesFormSubmitted = async () => {
    try {
      const newMetafield = await axios
        .post("/createMetafield", {
          key: "info",
          namespace: "dtm",
          owner_resource: "shop",
          value_type: "json_string",
          value: JSON.stringify({
            ...specificationRulesFromQuery,
            [productType]: toBeSubmittedSpecificationRules,
          }),
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

  const handleSpecificationRuleAdderButtonClicked = () => {
    setToBeSubmittedSpecificationRules(
      (previousToBeSubmittedSpecificationRules) => ({
        ...previousToBeSubmittedSpecificationRules,
        [nameValue]: {
          label: labelValue,
          name: nameValue,
          position: positionValue,
          type: typeValue,
          options: optionsValue.map((option) => option.trim()),
        },
      })
    );
    resetSpecificationRuleAdderInputs();
  };
  const handleSpecificationRuleRemoverButtonClicked = (nameToRemove) => {
    setToBeSubmittedSpecificationRules(
      (previousToBeSubmittedSpecificationRules) =>
        pickBy(
          previousToBeSubmittedSpecificationRules,
          (rule, name) => name !== nameToRemove
        )
    );
  };
  const handleSpecificationRuleChanged = (oldRule, newRule) => {
    setToBeSubmittedSpecificationRules(
      (previousToBeSubmittedSpecificationRules) => {
        const copiedPreviousRules = {
          ...previousToBeSubmittedSpecificationRules,
        };
        const newRules = Object.entries(copiedPreviousRules).reduce(
          (acc, [ruleName, ruleValue]) => {
            if (ruleName === oldRule.name) {
              acc[newRule.name] = {
                label: newRule.label,
                name: newRule.name,
                position: newRule.position,
                type: newRule.type,
                options: newRule.options.map((option) => option.trim()),
              };
            } else {
              acc[ruleName] = ruleValue;
            }
            return acc;
          },
          {}
        );
        return newRules;
      }
    );
  };

  const handlePositionValueChanged = (position) => {
    setPositionValue(position);
    if (position === "metafield") {
      setTypeValue("textarea");
    }
  };

  const handleTypeValueChanged = (value) => {
    setTypeValue(value);
  };

  const handleNameValueChanged = (value) => {
    setNameValue(value);
  };

  return (
    <Form onSubmit={handleSpecificationRulesFormSubmitted}>
      {Object.values(toBeSubmittedSpecificationRules).map((rule) => (
        <Card sectioned key={rule.name}>
          <FormLayout>
            <SettingRuleInputs
              rule={rule}
              handleSpecificationRuleRemoverButtonClicked={
                handleSpecificationRuleRemoverButtonClicked
              }
              handleSpecificationRuleChanged={handleSpecificationRuleChanged}
            />
          </FormLayout>
        </Card>
      ))}
      <Card sectioned>
        <FormLayout>
          <Stack alignment="trailing">
            <Stack.Item fill>
              <SettingRuleInputsContent
                {...{
                  positionValue,
                  typeValue,
                  optionsValue,
                  labelValue,
                  nameValue,
                  handleTypeValueChanged,
                  handleOptionsValueChanged,
                  handleLabelValueChanged,
                  handleNameValueChanged,
                  handlePositionValueChanged,
                }}
              />
            </Stack.Item>
            <Button onClick={handleSpecificationRuleAdderButtonClicked}>
              Add
            </Button>
          </Stack>
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

SpecificationRulesForm.propTypes = {
  setToastActive: PropTypes.func,
  setToastContent: PropTypes.func,
  productType: PropTypes.string,
};

export default SpecificationRulesForm;
