import { TextContainer, Stack, TextStyle, RadioButton } from '@shopify/polaris';
import PropTypes from 'prop-types';

function ExportProductsModalContent({
  modalExportIsWorking,
  modalExportScope,
  productType,
  selectedItems,
  handleModalExportScopeChanged,
}) {
  return modalExportIsWorking ? (
    <TextContainer>
      <Stack alignment="center" distribution="center">
        <Stack.Item fill>
          <TextStyle>
            Export is working, please don&#39;t close the modal until it is
            finished
          </TextStyle>
        </Stack.Item>
      </Stack>
    </TextContainer>
  ) : (
    <Stack vertical>
      <RadioButton
        checked={modalExportScope === 'all'}
        label={`All the products of ${productType}`}
        id="all"
        value="all"
        name="exportScope"
        onChange={handleModalExportScopeChanged}
      />
      <RadioButton
        checked={modalExportScope === 'filtered'}
        label="All the products that meet the current filter conditions"
        id="filtered"
        value="filtered"
        name="exportScope"
        onChange={handleModalExportScopeChanged}
      />
      <RadioButton
        checked={modalExportScope === 'page'}
        label="All the products in the current page"
        id="page"
        value="page"
        name="exportScope"
        onChange={handleModalExportScopeChanged}
      />
      <RadioButton
        checked={modalExportScope === 'selected'}
        label={`All the selected: ${selectedItems.length} products`}
        id="selected"
        value="selected"
        name="exportScope"
        onChange={handleModalExportScopeChanged}
      />
    </Stack>
  );
}

ExportProductsModalContent.propTypes = {
  modalExportIsWorking: PropTypes.bool,
  modalExportScope: PropTypes.string,
  productType: PropTypes.string,
  selectedItems: PropTypes.arrayOf(PropTypes.string),
  handleModalExportScopeChanged: PropTypes.func,
};

export default ExportProductsModalContent;
