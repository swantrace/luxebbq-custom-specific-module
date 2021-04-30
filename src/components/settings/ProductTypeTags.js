import { useApolloClient } from '@apollo/client';
import { ChoiceList, Spinner, Stack } from '@shopify/polaris';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useState } from 'react';
import { queryAllProductTagsThroughGraphqlCreator } from '../../utils';

function ProductTypeTags({
  productType,
  tagsHasBeenRemoved,
  handleProductsLoaded,
  setTagsToRemove,
}) {
  const client = useApolloClient();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const queryTagsFunc = useCallback(
    queryAllProductTagsThroughGraphqlCreator({
      client,
      productType,
    }),
    [client, productType]
  );

  const handleSelectedChanged = (newSelected) => {
    setSelected(newSelected);
    setTagsToRemove(newSelected);
  };

  useEffect(() => {
    setSelected([]);
    setTags((originalTags) =>
      originalTags.filter((ot) => !tagsHasBeenRemoved.includes(ot))
    );
  }, [tagsHasBeenRemoved]);
  useEffect(() => {
    setLoading(true);
    const fetchTags = async () => {
      const {
        tags: tagsOfCurrentProductType,
        products: productsToClearTags,
      } = await queryTagsFunc();
      setTags(tagsOfCurrentProductType);
      handleProductsLoaded(productsToClearTags);
      setLoading(false);
    };
    fetchTags();
  }, [queryTagsFunc, handleProductsLoaded]);

  return loading ? (
    <Stack distribution="center" alignment="center">
      <Spinner size="large" />
    </Stack>
  ) : (
    <ChoiceList
      allowMultiple
      choices={tags.map((tag) => ({
        label: tag,
        value: tag,
      }))}
      selected={selected}
      onChange={handleSelectedChanged}
    />
  );
}

ProductTypeTags.propTypes = {
  productType: PropTypes.string,
  tagsHasBeenRemoved: PropTypes.arrayOf(PropTypes.string),
  handleProductsLoaded: PropTypes.func,
  setTagsToRemove: PropTypes.func,
};

export default ProductTypeTags;
