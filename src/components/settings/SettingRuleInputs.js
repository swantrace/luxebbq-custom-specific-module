import { Stack, Button } from '@shopify/polaris';
import { useState } from 'react';
import slugify from 'slugify';
import PropTypes from 'prop-types';
import SettingRuleInputsContent from './SettingRuleInputsContent';

function SettingRuleInputs({
  rule,
  handleSpecificationRuleRemoverButtonClicked,
  handleSpecificationRuleChanged,
}) {
  const [labelValue, setLabelValue] = useState(() => rule?.label ?? '');
  const [nameValue, setNameValue] = useState(() => rule?.name ?? '');
  const [positionValue, setPositionValue] = useState(
    () => rule?.position ?? 'tag'
  );
  const [typeValue, setTypeValue] = useState(() => rule?.type ?? 'text');
  const [optionsValue, setOptionsValue] = useState(() => rule?.options ?? []);
  const handleLabelValueChanged = (value) => {
    setLabelValue(value);
    setNameValue(slugify(value, { lower: true }));
    handleSpecificationRuleChanged(rule, {
      label: value,
      name: slugify(value, { lower: true }),
      position: positionValue,
      type: typeValue,
      options: optionsValue,
    });
  };
  const handleNameValueChanged = (value) => {
    setNameValue(value);
    handleSpecificationRuleChanged(rule, {
      label: labelValue,
      name: value,
      position: positionValue,
      type: typeValue,
      options: optionsValue,
    });
  };
  const handlePositionValueChanged = (value) => {
    setPositionValue(value);
    handleSpecificationRuleChanged(rule, {
      label: labelValue,
      name: nameValue,
      position: value,
      type: value === 'tag' ? 'text' : 'textarea',
      options: optionsValue,
    });
  };
  const handleTypeValueChanged = (value) => {
    setTypeValue(value);
    handleSpecificationRuleChanged(rule, {
      label: labelValue,
      name: nameValue,
      position: positionValue,
      type: value,
      options: optionsValue,
    });
  };
  const handleOptionsValueChanged = (value) => {
    setOptionsValue(value.split(','));
    handleSpecificationRuleChanged(rule, {
      label: labelValue,
      name: nameValue,
      position: positionValue,
      type: typeValue,
      options: value.split(','),
    });
  };
  const handleRemoveButtonClicked = () => {
    handleSpecificationRuleRemoverButtonClicked(rule.name);
  };

  return (
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
      <Button onClick={handleRemoveButtonClicked}>Remove</Button>
    </Stack>
  );
}

SettingRuleInputs.propTypes = {
  rule: PropTypes.object,
  handleSpecificationRuleRemoverButtonClicked: PropTypes.func,
  handleSpecificationRuleChanged: PropTypes.func,
};

export default SettingRuleInputs;
