import { Stack, Button, TextContainer, DropZone } from '@shopify/polaris';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

function ImportProductsModalContent({
  modalImportLeftProductsCount,
  modalImportedFile,
  modalImportIsWorking,
  modalFileDialogOpened,
  setModalFileDialogOpened,
  handleModalDropZoneAccepted,
}) {
  const [progressStatus, setProgressStatus] = useState('');

  useEffect(() => {
    if (modalImportLeftProductsCount && modalImportLeftProductsCount > 0) {
      setProgressStatus(
        `${modalImportLeftProductsCount} products left to update`
      );
    }
  }, [modalImportLeftProductsCount]);
  const replaceFileButton = modalImportedFile ? (
    <Stack alignment="center">
      <Stack.Item fill>{modalImportedFile.name}</Stack.Item>
      <Button onClick={() => setModalFileDialogOpened(true)}>
        Replace file
      </Button>
    </Stack>
  ) : null;
  const dropZoneWrapperStyle = modalImportedFile ? { display: 'none' } : {};

  return modalImportIsWorking ? (
    <TextContainer>
      <Stack alignment="center" distribution="center">
        <Stack.Item fill>
          <TextContainer>
            Import is working, please don&#39;t close the modal until it is
            finished. {progressStatus}
          </TextContainer>
        </Stack.Item>
      </Stack>
    </TextContainer>
  ) : (
    <>
      {replaceFileButton}
      <div style={dropZoneWrapperStyle}>
        <DropZone
          allowMultiple={false}
          openFileDialog={modalFileDialogOpened}
          onDropAccepted={handleModalDropZoneAccepted}
          onClick={() => setModalFileDialogOpened(true)}
          onFileDialogClose={() => setModalFileDialogOpened(false)}
          accept=".csv"
        >
          <DropZone.FileUpload />
        </DropZone>
      </div>
    </>
  );
}

ImportProductsModalContent.propTypes = {
  modalImportLeftProductsCount: PropTypes.number,
  modalImportedFile: PropTypes.object,
  modalImportIsWorking: PropTypes.bool,
  modalFileDialogOpened: PropTypes.bool,
  setModalFileDialogOpened: PropTypes.func,
  handleModalDropZoneAccepted: PropTypes.func,
};

export default ImportProductsModalContent;
