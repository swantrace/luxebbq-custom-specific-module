import { Form, FormLayout } from '@shopify/polaris';
import PropTypes from 'prop-types';
import EditProductCheckbox from './EditProductCheckbox';
import EditProductSelect from './EditProductSelect';
import EditProductText from './EditProductText';
import EditProductTextArea from './EditProductTextArea';
import EditProductNumber from './EditProductNumber';
import EditProductChoiceList from './EditProductChoiceList';

function EditProductModalContent({ specificationInfoWithValues }) {
  const specificationInputs = (
    <FormLayout>
      {Object.values(specificationInfoWithValues).map((specification) => {
        switch (specification.type) {
          case 'single-select':
            return (
              <EditProductSelect key={specification.name} {...specification} />
            );
          case 'multi-select':
            return (
              <EditProductChoiceList
                key={specification.name}
                {...specification}
              />
            );
          case 'text':
            return (
              <EditProductText key={specification.name} {...specification} />
            );
          case 'textarea':
            return (
              <EditProductTextArea
                key={specification.name}
                {...specification}
              />
            );
          case 'number':
            return (
              <EditProductNumber key={specification.name} {...specification} />
            );
          case 'checkbox':
            return (
              <EditProductCheckbox
                key={specification.name}
                {...specification}
              />
            );
          default:
            return null;
        }
      })}
    </FormLayout>
  );

  return (
    <Form>
      {specificationInputs}
      {/* {specificationAdder} */}
    </Form>
  );
}

EditProductModalContent.propTypes = {
  storedSpecifications: PropTypes.arrayOf(PropTypes.object),
  nonstoredSpecifications: PropTypes.arrayOf(PropTypes.object),
  specificationInfoWithValues: PropTypes.object,
};

export default EditProductModalContent;
