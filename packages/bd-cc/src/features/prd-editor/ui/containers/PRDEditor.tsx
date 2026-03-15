import { useCallback, useMemo, useState } from 'react';
import type { Project } from '@/types/app';
import { usePrdDocument } from '@/features/prd-editor/hooks/usePrdDocument';
import { usePrdKeyboardShortcuts } from '@/features/prd-editor/hooks/usePrdKeyboardShortcuts';
import { usePrdRegistryQuery } from '@/features/prd-editor/hooks/usePrdQuery';
import { usePrdSave } from '@/features/prd-editor/hooks/usePrdSave';
import type { PrdFile, ExistingPrdFile } from '@/features/prd-editor/types/types';
import { ensurePrdExtension } from '@/features/prd-editor/biz/fileName';
import OverwriteConfirmModal from '@/features/prd-editor/ui/composites/OverwriteConfirmModal';
import PrdEditorLoadingState from '@/features/prd-editor/ui/composites/PrdEditorLoadingState';
import PrdEditorWorkspace from '@/features/prd-editor/ui/composites/PrdEditorWorkspace';

type PRDEditorProps = {
  file?: PrdFile | null;
  onClose: () => void;
  projectPath?: string;
  project?: Project | null;
  initialContent?: string;
  isNewFile?: boolean;
  onSave?: () => Promise<void> | void;
};

export default function PRDEditor({
  file,
  onClose,
  projectPath,
  project,
  initialContent = '',
  isNewFile = false,
  onSave,
}: PRDEditorProps) {
  const [showOverwriteConfirm, setShowOverwriteConfirm] = useState<boolean>(false);
  const [overwriteFileName, setOverwriteFileName] = useState<string>('');

  const { content, setContent, fileName, setFileName, loading, loadError } = usePrdDocument({
    file,
    isNewFile,
    initialContent,
    projectPath,
  });

  const { data: existingPrds = [], refetch: refreshExistingPrds } = usePrdRegistryQuery(project?.name || '') as {
    data: ExistingPrdFile[];
    refetch: () => Promise<unknown>;
  };

  const isExistingFile = useMemo(() => !isNewFile || Boolean(file?.isExisting), [file?.isExisting, isNewFile]);

  const { savePrd, saving, saveSuccess } = usePrdSave({
    projectName: project?.name,
    existingPrds,
    isExistingFile,
    onAfterSave: async () => {
      await refreshExistingPrds();
      await onSave?.();
    },
  });

  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const downloadedFileName = ensurePrdExtension(fileName || 'prd');

    anchor.href = url;
    anchor.download = downloadedFileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [content, fileName]);

  const handleSave = useCallback(
    async (allowOverwrite = false) => {
      const result = await savePrd({
        content,
        fileName,
        allowOverwrite,
      });

      if (result.status === 'needs-overwrite') {
        setOverwriteFileName(result.fileName);
        setShowOverwriteConfirm(true);
        return;
      }

      if (result.status === 'failed') {
        alert(result.message);
      }
    },
    [content, fileName, savePrd]
  );

  const confirmOverwrite = useCallback(async () => {
    setShowOverwriteConfirm(false);
    await handleSave(true);
  }, [handleSave]);

  usePrdKeyboardShortcuts({
    onSave: () => {
      void handleSave();
    },
    onClose,
  });

  if (loading) {
    return <PrdEditorLoadingState />;
  }

  return (
    <>
      <PrdEditorWorkspace
        content={content}
        onContentChange={setContent}
        fileName={fileName}
        onFileNameChange={setFileName}
        isNewFile={isNewFile}
        saving={saving}
        saveSuccess={saveSuccess}
        onSave={() => {
          void handleSave();
        }}
        onDownload={handleDownload}
        onClose={onClose}
        loadError={loadError}
      />

      <OverwriteConfirmModal
        isOpen={showOverwriteConfirm}
        fileName={overwriteFileName || ensurePrdExtension(fileName || 'prd')}
        saving={saving}
        onCancel={() => setShowOverwriteConfirm(false)}
        onConfirm={() => {
          void confirmOverwrite();
        }}
      />
    </>
  );
}
