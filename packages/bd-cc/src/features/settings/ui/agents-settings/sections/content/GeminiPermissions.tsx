import { AlertTriangle, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { GeminiPermissionMode } from '@/components/settings/types/types';

interface GeminiPermissionsProps {
  permissionMode: GeminiPermissionMode;
  onPermissionModeChange: (value: GeminiPermissionMode) => void;
}

export default function GeminiPermissions({ permissionMode, onPermissionModeChange }: GeminiPermissionsProps) {
  const { t } = useTranslation(['settings', 'chat']);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-medium text-foreground">{t('gemini.permissionMode')}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{t('gemini.description')}</p>

        {/* Default Mode */}
        <div
          className={`cursor-pointer rounded-lg border p-4 transition-all ${
            permissionMode === 'default'
              ? 'border-border bg-accent'
              : 'border-border bg-card/50 active:border-border active:bg-accent/50'
          }`}
          onClick={() => onPermissionModeChange('default')}
        >
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              name="geminiPermissionMode"
              checked={permissionMode === 'default'}
              onChange={() => onPermissionModeChange('default')}
              className="mt-1 h-4 w-4 text-green-600"
            />
            <div>
              <div className="font-medium text-foreground">{t('gemini.modes.default.title')}</div>
              <div className="text-sm text-muted-foreground">{t('gemini.modes.default.description')}</div>
            </div>
          </label>
        </div>

        {/* Auto Edit Mode */}
        <div
          className={`cursor-pointer rounded-lg border p-4 transition-all ${
            permissionMode === 'auto_edit'
              ? 'border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
              : 'border-border bg-card/50 active:border-border active:bg-accent/50'
          }`}
          onClick={() => onPermissionModeChange('auto_edit')}
        >
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              name="geminiPermissionMode"
              checked={permissionMode === 'auto_edit'}
              onChange={() => onPermissionModeChange('auto_edit')}
              className="mt-1 h-4 w-4 text-green-600"
            />
            <div>
              <div className="font-medium text-green-900 dark:text-green-100">{t('gemini.modes.autoEdit.title')}</div>
              <div className="text-sm text-green-700 dark:text-green-300">{t('gemini.modes.autoEdit.description')}</div>
            </div>
          </label>
        </div>

        {/* YOLO Mode */}
        <div
          className={`cursor-pointer rounded-lg border p-4 transition-all ${
            permissionMode === 'yolo'
              ? 'border-orange-400 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/20'
              : 'border-border bg-card/50 active:border-border active:bg-accent/50'
          }`}
          onClick={() => onPermissionModeChange('yolo')}
        >
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              name="geminiPermissionMode"
              checked={permissionMode === 'yolo'}
              onChange={() => onPermissionModeChange('yolo')}
              className="mt-1 h-4 w-4 text-orange-600"
            />
            <div>
              <div className="flex items-center gap-2 font-medium text-orange-900 dark:text-orange-100">
                {t('gemini.modes.yolo.title')}
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300">{t('gemini.modes.yolo.description')}</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
