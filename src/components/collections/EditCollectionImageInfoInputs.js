import { Stack, Button, FormLayout, TextField } from '@shopify/polaris';
import { useState } from 'react';
import PropTypes from 'prop-types';

function EditCollectionImageInfoInputs({
  imageInfo,
  imageIndex,
  handleCollectionImageInfoRemoveButtonClicked,
}) {
  const [imageUrl, setImageUrl] = useState(() => imageInfo?.imageUrl ?? '');
  const [imageTarget, setImageTarget] = useState(
    () => imageInfo?.imageTarget ?? ''
  );
  const [imageText, setImageText] = useState(() => imageInfo?.imageText ?? '');
  return (
    <FormLayout>
      <Stack alignment="trailing">
        <Stack.Item fill>
          <TextField
            type="url"
            label="Image source url"
            onChange={setImageUrl}
            value={imageUrl}
            name={`${imageIndex}_imageUrl`}
          />
        </Stack.Item>
        <Stack.Item fill>
          <TextField
            type="url"
            label="Link url"
            onChange={setImageTarget}
            value={imageTarget}
            name={`${imageIndex}_imageTarget`}
          />
        </Stack.Item>
        <Stack.Item fill>
          <TextField
            type="text"
            label="Image text"
            onChange={setImageText}
            value={imageText}
            name={`${imageIndex}_imageText`}
          />
        </Stack.Item>
        <Button
          onClick={() => {
            handleCollectionImageInfoRemoveButtonClicked(imageIndex);
          }}
        >
          Remove
        </Button>
      </Stack>
    </FormLayout>
  );
}

EditCollectionImageInfoInputs.propTypes = {
  imageInfo: PropTypes.object,
  imageIndex: PropTypes.number,
  handleCollectionImageInfoRemoveButtonClicked: PropTypes.func,
};

export default EditCollectionImageInfoInputs;
