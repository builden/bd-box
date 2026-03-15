import { AlertTriangle, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CodexPermissionMode } from '@/components/settings/types/types';

interface CodexPermissionsProps {
  permissionMode: CodexPermissionMode;
  onPermissionModeChange: (value: CodexPermissionMode) => void;
}

export default function CodexPermissions({ permissionMode, onPermissionModeChange }: CodexPermissionsProps) {
  const { t } = useTranslation('settings');

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-medium text-foreground">{t('permissions.codex.permissionMode')}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{t('permissions.codex.description')}</p>

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
              name="codexPermissionMode"
              checked={permissionMode === 'default'}
              onChange={() => onPermissionModeChange('default')}
              className="mt-1 h-4 w-4 text-green-600"
            />
            <div>
              <div className="font-medium text-foreground">{t('permissions.codex.modes.default.title')}</div>
              <div className="text-sm text-muted-foreground">{t('permissions.codex.modes.default.description')}</div>
            </div>
          </label>
        </div>

        {/* Accept Edits Mode */}
        <div
          className={`cursor-pointer rounded-lg border p-4 transition-all ${
            permissionMode === 'acceptEdits'
              ? 'border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
              : 'border-border bg-card/50 active:border-border active:bg-accent/50'
          }`}
          onClick={() => onPermissionModeChange('acceptEdits')}
        >
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              name="codexPermissionMode"
              checked={permissionMode === 'acceptEdits'}
              onChange={() => onPermissionModeChange('acceptEdits')}
              className="mt-1 h-4 w-4 text-green-600"
            />
            <div>
              <div className="font-medium text-green-900 dark:text-green-100">
                {t('permissions.codex.modes.acceptEdits.title')}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                {t('permissions.codex.modes.acceptEdits.description')}
              </div>
            </div>
          </label>
        </div>

        {/* Bypass Permissions Mode */}
        <div
          className={`cursor-pointer rounded-lg border p-4 transition-all ${
            permissionMode === 'bypassPermissions'
              ? 'border-orange-400 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/20'
              : 'border-border bg-card/50 active:border-border active:bg-accent/50'
          }`}
          onClick={() => onPermissionModeChange('bypassPermissions')}
        >
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              name="codexPermissionMode"
              checked={permissionMode === 'bypassPermissions'}
              onChange={() => onPermissionModeChange('bypassPermissions')}
              className="mt-1 h-4 w-4 text-orange-600"
            />
            <div>
              <div className="flex items-center gap-2 font-medium text-orange-900 dark:text-orange-100">
                {t('permissions.codex.modes.bypassPermissions.title')}
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300">
                {t('permissions.codex.modes.bypassPermissions.description')}
              </div>
            </div>
          </label>
        </div>

        {/* Technical Details */}
        <details className="text-sm">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            {t('permissions.codex.technicalDetails')}
          </summary>
          <div className="mt-2 space-y-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <p>
              <strong>{t('permissions.codex.modes.default.title')}:</strong>{' '}
              {t('permissions.codex.technicalInfo.default')}
            </p>
            <p>
              <strong>{t('permissions.codex.modes.acceptEdits.title')}:</strong>{' '}
              {t('permissions.codex.technicalInfo.acceptEdits')}
            </p>
            <p>
              <strong>{t('permissions.codex.modes.bypassPermissions.title')}:</strong>{' '}
              {t('permissions.codex.technicalInfo.bypassPermissions')}
            </p>
            <p className="text-xs opacity-75">{t('permissions.codex.technicalInfo.overrideNote')}</p>
          </div>
        </details>
      </div>
    </div>
  );
}
