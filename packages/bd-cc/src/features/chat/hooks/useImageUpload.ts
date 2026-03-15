import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useImageUpload');

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;

interface UseImageUploadOptions {
  onUploadError?: (message: string) => void;
}

interface UseImageUploadResult {
  attachedImages: File[];
  setAttachedImages: React.Dispatch<React.SetStateAction<File[]>>;
  uploadingImages: Map<string, number>;
  imageErrors: Map<string, string>;
  getRootProps: ReturnType<typeof useDropzone>['getRootProps'];
  getInputProps: ReturnType<typeof useDropzone>['getInputProps'];
  isDragActive: boolean;
  openImagePicker: ReturnType<typeof useDropzone>['open'];
  handlePaste: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
}

export function useImageUpload({ onUploadError }: UseImageUploadOptions = {}): UseImageUploadResult {
  const [attachedImages, setAttachedImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState<Map<string, number>>(new Map());
  const [imageErrors, setImageErrors] = useState<Map<string, string>>(new Map());

  const handleImageFiles = useCallback((files: File[]) => {
    const validFiles = files.filter((file) => {
      try {
        if (!file || typeof file !== 'object') {
          logger.warn('Invalid file object', { file });
          return false;
        }

        if (!file.type || !file.type.startsWith('image/')) {
          return false;
        }

        if (!file.size || file.size > MAX_FILE_SIZE) {
          const fileName = file.name || 'Unknown file';
          setImageErrors((previous) => {
            const next = new Map(previous);
            next.set(fileName, 'File too large (max 5MB)');
            return next;
          });
          return false;
        }

        return true;
      } catch (error) {
        logger.error('Error validating file', error, { file });
        return false;
      }
    });

    if (validFiles.length > 0) {
      setAttachedImages((previous) => [...previous, ...validFiles].slice(0, MAX_FILES));
    }
  }, []);

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = Array.from(event.clipboardData.items);

      items.forEach((item) => {
        if (!item.type.startsWith('image/')) {
          return;
        }
        const file = item.getAsFile();
        if (file) {
          handleImageFiles([file]);
        }
      });

      if (items.length === 0 && event.clipboardData.files.length > 0) {
        const files = Array.from(event.clipboardData.files);
        const imageFiles = files.filter((file) => file.type.startsWith('image/'));
        if (imageFiles.length > 0) {
          handleImageFiles(imageFiles);
        }
      }
    },
    [handleImageFiles]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
    },
    maxSize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES,
    onDrop: handleImageFiles,
    noClick: true,
    noKeyboard: true,
  });

  return {
    attachedImages,
    setAttachedImages,
    uploadingImages,
    imageErrors,
    getRootProps,
    getInputProps,
    isDragActive,
    openImagePicker: open,
    handlePaste,
  };
}
