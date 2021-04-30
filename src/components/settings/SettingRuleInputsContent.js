import { Select, Stack, TextField } from '@shopify/polaris';
import PropTypes from 'prop-types';

function SettingRuleInputsContent({
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
}) {
  const typeSelector =
    positionValue === 'tag' ? (
      <Select
        label="Type"
        options={[
          { label: 'Text', value: 'text' },
          { label: 'Number', value: 'number' },
          { label: 'Checkbox', value: 'checkbox' },
          { label: 'Select', value: 'single-select' },
          { label: 'ChoiceList', value: 'multi-select' },
        ]}
        value={typeValue}
        onChange={handleTypeValueChanged}
      />
    ) : (
      <Select
        label="Type"
        options={[{ label: 'Textarea', value: 'textarea' }]}
        value={typeValue}
        onChange={handleTypeValueChanged}
      />
    );

  const optionsInput =
    typeValue === 'single-select' || typeValue === 'multi-select' ? (
      <Stack.Item fill>
        <TextField
          label="Options"
          value={optionsValue.join(',')}
          onChange={handleOptionsValueChanged}
        />
      </Stack.Item>
    ) : null;

  return (
    <Stack>
      <Stack.Item fill>
        <TextField
          label="Label"
          value={labelValue}
          onChange={handleLabelValueChanged}
        />
      </Stack.Item>
      <Stack.Item fill>
        <TextField
          label="Name"
          value={nameValue}
          onChange={handleNameValueChanged}
        />
      </Stack.Item>
      <Stack.Item fill>
        <Select
          label="Position"
          options={[
            { label: 'Tag', value: 'tag' },
            { label: 'Metafield', value: 'metafield' },
          ]}
          value={positionValue}
          onChange={handlePositionValueChanged}
        />
      </Stack.Item>
      <Stack.Item fill>{typeSelector}</Stack.Item>
      {optionsInput}
    </Stack>
  );
}

SettingRuleInputsContent.propTypes = {
  positionValue: PropTypes.string,
  typeValue: PropTypes.string,
  optionsValue: PropTypes.arrayOf(PropTypes.string),
  labelValue: PropTypes.string,
  nameValue: PropTypes.string,
  handleTypeValueChanged: PropTypes.func,
  handleOptionsValueChanged: PropTypes.func,
  handleLabelValueChanged: PropTypes.func,
  handleNameValueChanged: PropTypes.func,
  handlePositionValueChanged: PropTypes.func,
};

export default SettingRuleInputsContent;
