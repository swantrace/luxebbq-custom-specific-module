import { useState, useRef } from 'react';
import { gql, useApolloClient, useMutation, useQuery } from '@apollo/client';
import {
  Card,
  Modal,
  ResourceList,
  ResourceItem,
  Thumbnail,
  Stack,
  Button,
  ButtonGroup,
  Pagination,
  TextStyle,
} from '@shopify/polaris';
import PropTypes from 'prop-types';
import EditCollectionModalContent from './EditCollectionModalContent';

const GET_COLLECTIONS = gql`
  query getCollections {
    collections(first: 50) {
      edges {
        cursor
        node {
          id
          title
          image {
            altText
            originalSrc
          }
          metafield(namespace: "dtm", key: "info") {
            id
            key
            legacyResourceId
            namespace
            value
            valueType
            ownerType
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

const GET_COLLECTION = gql`
  query getCollection($id: ID!) {
    collection(id: $id) {
      id
      title
      image {
        altText
        originalSrc
      }
      metafield(namespace: "dtm", key: "info") {
        id
        key
        legacyResourceId
        namespace
        value
        valueType
        ownerType
      }
    }
  }
`;

const UPDATE_COLLECTION = gql`
  mutation productCollection($input: CollectionInput!) {
    collectionUpdate(input: $input) {
      collection {
        id
        title
        image {
          altText
          originalSrc
        }
        metafield(namespace: "dtm", key: "info") {
          id
          key
          legacyResourceId
          namespace
          value
          valueType
          ownerType
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

function ResourceListWithCollections({ setToastActive, setToastContent }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEditingCollection, setModalEditingCollection] = useState(null);
  const client = useApolloClient();
  const modalContentWrapperRef = useRef();
  const { loading, data: dataWithCollections, fetchMore } = useQuery(
    GET_COLLECTIONS,
    {
      variables: {
        first: 50,
      },
    }
  );
  const [updateCollection] = useMutation(UPDATE_COLLECTION);

  const hasPrevious =
    dataWithCollections?.collections?.pageInfo?.hasPreviousPage ?? false;
  const hasNext =
    dataWithCollections?.collections?.pageInfo?.hasNextPage ?? false;
  const lastCursor =
    dataWithCollections?.collections?.edges?.slice(-1)?.[0]?.cursor ?? null;
  const firstCursor =
    dataWithCollections?.collections?.edges?.[0]?.cursor ?? null;

  const handleModalCloseIconClicked = () => {
    setModalEditingCollection(null);
    setModalOpen(false);
  };

  const handleModalCancelButtonClicked = () => {
    setModalEditingCollection(null);
    setModalOpen(false);
  };

  const handleModalConfirmButtonClicked = async () => {
    const form = modalContentWrapperRef.current.querySelector('form');
    const toBeSubmittedImageInfoArray = Array.from(form.elements)
      .filter(
        (element) =>
          element.name &&
          (element.name.includes('imageUrl') ||
            element.name.includes('imageTarget') ||
            element.name.includes('imageText'))
      )
      .map(({ name, value }) => ({
        index: name.split('_')[0],
        name: name.split('_')[1],
        value,
      }))
      .reduce((acc, cur) => {
        acc[cur.index] = acc[cur.index] ?? {};
        acc[cur.index][cur.name] = cur.value;
        return acc;
      }, []);

    const input = {
      id: modalEditingCollection.id,
      metafields: {
        key: 'info',
        namespace: 'dtm',
        valueType: 'JSON_STRING',
        value: JSON.stringify({ images: toBeSubmittedImageInfoArray }),
      },
    };

    if (modalEditingCollection?.metafield?.id) {
      input.metafields.id = modalEditingCollection.metafield.id;
    }

    try {
      await updateCollection({ variables: { input } });
      setToastActive(true);
      setToastContent('Changes saved');
    } catch (err) {
      setToastActive(true);
      setToastContent('Failed to save changes');
    }
    setModalEditingCollection(null);
    setModalOpen(false);
  };

  const handleEditButtonClicked = async (id) => {
    const collectionInfo = await client
      .query({
        query: GET_COLLECTION,
        variables: { id },
      })
      .then((response) => response?.data?.collection ?? null);

    setModalEditingCollection(collectionInfo);
    setModalOpen(true);
  };

  return (
    <Card>
      <Modal
        large
        open={modalOpen}
        onClose={handleModalCloseIconClicked}
        title="Edit collection images"
        primaryAction={{
          content: 'Confirm',
          onAction: handleModalConfirmButtonClicked,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: handleModalCancelButtonClicked,
          },
        ]}
      >
        <Modal.Section>
          <div className="modal-content-wrapper" ref={modalContentWrapperRef}>
            <EditCollectionModalContent
              modalEditingCollection={modalEditingCollection}
            />
          </div>
        </Modal.Section>
      </Modal>
      <ResourceList
        resourceName={{ singular: 'Collection', plural: 'Collections' }}
        loading={loading}
        items={dataWithCollections?.collections?.edges ?? []}
        renderItem={({ node: collection }) => {
          const media = (
            <Thumbnail
              source={
                collection?.image?.originalSrc ??
                '/collection_image_placeholder.png'
              }
              alt={collection?.image?.altText ?? ''}
              size="small"
            />
          );

          return (
            <ResourceItem
              id={collection.id}
              media={media}
              accessibilityLabel={`View details for ${collection.title}`}
            >
              <Stack>
                <Stack.Item fill>
                  <h3>
                    <TextStyle variation="strong">{collection.title}</TextStyle>
                  </h3>
                  <h6>{collection.id}</h6>
                </Stack.Item>
                <ButtonGroup>
                  <Button
                    onClick={() => handleEditButtonClicked(collection.id)}
                  >
                    Edit
                  </Button>
                </ButtonGroup>
              </Stack>
            </ResourceItem>
          );
        }}
      />
      <hr style={{ marginBottom: 0 }} />
      <div style={{ padding: '15px 0' }}>
        <Stack
          alignment="center"
          distribution="center"
          wrap
          vertical
          spacing="none"
        >
          <Pagination
            hasPrevious={hasPrevious}
            onPrevious={() => {
              if (hasPrevious && firstCursor) {
                fetchMore({
                  variables: {
                    before: firstCursor,
                    last: 50,
                    first: undefined,
                  },
                });
              }
            }}
            hasNext={hasNext}
            onNext={() => {
              if (hasNext && lastCursor) {
                fetchMore({ variables: { after: lastCursor } });
              }
            }}
          />
        </Stack>
      </div>
    </Card>
  );
}

ResourceListWithCollections.propTypes = {
  setToastActive: PropTypes.func,
  setToastContent: PropTypes.func,
};

export default ResourceListWithCollections;
