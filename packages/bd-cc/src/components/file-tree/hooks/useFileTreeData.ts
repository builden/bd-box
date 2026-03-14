import { useCallback, useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { api } from '../../../utils/api';
import type { Project } from '../../../types/app';
import { FileTreeNodeSchema, FileTreeResponseSchema } from '@shared/api/files';
import { notificationService } from '../../app/GlobalNotifications';
import { createLogger } from '@/lib/logger';

const logger = createLogger('FileTreeData');

type FileTreeNode = z.infer<typeof FileTreeNodeSchema>;

type UseFileTreeDataResult = {
  files: FileTreeNode[];
  loading: boolean;
  refreshFiles: () => void;
};

export function useFileTreeData(selectedProject: Project | null): UseFileTreeDataResult {
  const [files, setFiles] = useState<FileTreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const refreshFiles = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const projectName = selectedProject?.name;

    if (!projectName) {
      setFiles([]);
      setLoading(false);
      return;
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Track mount state so aborted or late responses do not enqueue stale state updates.
    let isActive = true;

    const fetchFiles = async () => {
      if (isActive) {
        setLoading(true);
      }
      try {
        const response = await api.getFiles(projectName, { signal: abortControllerRef.current!.signal });

        if (!response.ok) {
          const errorText = await response.text();
          logger.error('File fetch failed', { status: response.status, error: errorText });
          if (isActive) {
            setFiles([]);
          }
          return;
        }

        const json = await response.json();
        const result = FileTreeResponseSchema.safeParse(json);

        if (!result.success) {
          logger.error('Invalid file tree response:', result.error);
          notificationService.error('数据格式错误', '文件列表响应格式不正确');
          if (isActive) {
            setFiles([]);
          }
          return;
        }

        if (isActive) {
          setFiles(result.data.files);
        }
      } catch (error) {
        if ((error as { name?: string }).name === 'AbortError') {
          return;
        }

        logger.error('Error fetching files:', error);
        if (isActive) {
          setFiles([]);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void fetchFiles();

    return () => {
      isActive = false;
      abortControllerRef.current?.abort();
    };
  }, [selectedProject?.name, refreshKey]);

  return {
    files,
    loading,
    refreshFiles,
  };
}
