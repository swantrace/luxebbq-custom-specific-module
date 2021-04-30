import { Form, FormLayout, Stack, Button, TextField } from '@shopify/polaris';
import { useState } from 'react';
import PropTypes from 'prop-types';
import EditCollectionImageInfoInputs from './EditCollectionImageInfoInputs';

function EditCollectionModalContent({ modalEditingCollection }) {
  const [imageUrl, setImageUrl] = useState('');
  const [imageText, setImageText] = useState('');
  const [imageTarget, setImageTarget] = useState('');
  const [collectionImageInfoArray, setCollectionImageInfoArray] = useState(
    () => {
      const images =
        JSON.parse(modalEditingCollection?.metafield?.value ?? '{}')?.images ??
        [];
      return images;
    }
  );

  const handleCollectionImageInfoAdderButtonClicked = () => {
    if (imageUrl && imageTarget && imageText) {
      setCollectionImageInfoArray((previousCollectionImageInfoArray) => [
        ...previousCollectionImageInfoArray,
        { imageUrl, imageTarget, imageText },
      ]);
      setImageUrl('');
      setImageTarget('');
      setImageText('');
    }
  };
  const handleCollectionImageInfoRemoveButtonClicked = (index) => {
    setCollectionImageInfoArray((previousCollectionImageInfoArray) =>
      previousCollectionImageInfoArray.filter((e, i) => i !== index)
    );
  };

  const collectionImageInfoEditor = (
    <FormLayout>
      {collectionImageInfoArray.map((imageInfo, index) => (
        <EditCollectionImageInfoInputs
          imageInfo={imageInfo}
          imageIndex={index}
          key={JSON.stringify({ ...imageInfo, index })}
          handleCollectionImageInfoRemoveButtonClicked={
            handleCollectionImageInfoRemoveButtonClicked
          }
        />
      ))}
    </FormLayout>
  );

  const collectionImageInfoAdder = (
    <FormLayout>
      <Stack alignment="trailing">
        <Stack.Item fill>
          <TextField
            type="url"
            label="Image url"
            onChange={setImageUrl}
            value={imageUrl}
          />
        </Stack.Item>
        <Stack.Item fill>
          <TextField
            type="url"
            label="Image target"
            onChange={setImageTarget}
            value={imageTarget}
          />
        </Stack.Item>
        <Stack.Item fill>
          <TextField
            type="text"
            label="Image text"
            onChange={setImageText}
            value={imageText}
          />
        </Stack.Item>
        <Button onClick={handleCollectionImageInfoAdderButtonClicked}>
          Add
        </Button>
      </Stack>
    </FormLayout>
  );

  return (
    <Form>
      <Stack vertical>
        <Stack.Item fill>{collectionImageInfoEditor}</Stack.Item>
        <Stack.Item fill>{collectionImageInfoAdder}</Stack.Item>
      </Stack>
    </Form>
  );
}

EditCollectionModalContent.propTypes = {
  modalEditingCollection: PropTypes.object,
};

export default EditCollectionModalContent;
