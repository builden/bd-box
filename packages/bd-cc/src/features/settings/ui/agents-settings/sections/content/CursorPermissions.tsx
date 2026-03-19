import { useState } from 'react';
import { AlertTriangle, Plus, Shield, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { COMMON_CURSOR_COMMANDS, addUnique, removeValue } from './permissionsConstants';
import { Button, Input } from '@/shared/view/ui';

interface CursorPermissionsProps {
  skipPermissions: boolean;
  onSkipPermissionsChange: (value: boolean) => void;
  allowedCommands: string[];
  onAllowedCommandsChange: (value: string[]) => void;
  disallowedCommands: string[];
  onDisallowedCommandsChange: (value: string[]) => void;
}

export default function CursorPermissions({
  skipPermissions,
  onSkipPermissionsChange,
  allowedCommands,
  onAllowedCommandsChange,
  disallowedCommands,
  onDisallowedCommandsChange,
}: CursorPermissionsProps) {
  const { t } = useTranslation('settings');
  const [newAllowedCommand, setNewAllowedCommand] = useState('');
  const [newDisallowedCommand, setNewDisallowedCommand] = useState('');

  const handleAddAllowedCommand = (command: string) => {
    const updated = addUnique(allowedCommands, command);
    if (updated.length === allowedCommands.length) {
      return;
    }
    onAllowedCommandsChange(updated);
    setNewAllowedCommand('');
  };

  const handleAddDisallowedCommand = (command: string) => {
    const updated = addUnique(disallowedCommands, command);
    if (updated.length === disallowedCommands.length) {
      return;
    }
    onDisallowedCommandsChange(updated);
    setNewDisallowedCommand('');
  };

  return (
    <div className="space-y-6">
      {/* Skip Permissions */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-medium text-foreground">{t('permissions.title')}</h3>
        </div>
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-900/20">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={skipPermissions}
              onChange={(event) => onSkipPermissionsChange(event.target.checked)}
              className="h-4 w-4 rounded border-input bg-card text-primary focus:ring-2 focus:ring-primary"
            />
            <div>
              <div className="font-medium text-orange-900 dark:text-orange-100">
                {t('permissions.skipPermissions.label')}
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300">
                {t('permissions.skipPermissions.cursorDescription')}
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Allowed Commands */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-green-500" />
          <h3 className="text-lg font-medium text-foreground">{t('permissions.allowedCommands.title')}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{t('permissions.allowedCommands.description')}</p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={newAllowedCommand}
            onChange={(event) => setNewAllowedCommand(event.target.value)}
            placeholder={t('permissions.allowedCommands.placeholder')}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleAddAllowedCommand(newAllowedCommand);
              }
            }}
            className="h-10 flex-1"
          />
          <Button
            onClick={() => handleAddAllowedCommand(newAllowedCommand)}
            disabled={!newAllowedCommand.trim()}
            size="sm"
            className="h-10 px-4"
          >
            <Plus className="mr-2 h-4 w-4 sm:mr-0" />
            <span className="sm:hidden">{t('permissions.actions.add')}</span>
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{t('permissions.allowedCommands.quickAdd')}</p>
          <div className="flex flex-wrap gap-2">
            {COMMON_CURSOR_COMMANDS.map((command) => (
              <Button
                key={command}
                variant="outline"
                size="sm"
                onClick={() => handleAddAllowedCommand(command)}
                disabled={allowedCommands.includes(command)}
                className="h-8 text-xs"
              >
                {command}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {allowedCommands.map((command) => (
            <div
              key={command}
              className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20"
            >
              <span className="font-mono text-sm text-green-800 dark:text-green-200">{command}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAllowedCommandsChange(removeValue(allowedCommands, command))}
                className="text-green-600 hover:text-green-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {allowedCommands.length === 0 && (
            <div className="py-6 text-center text-muted-foreground">{t('permissions.allowedCommands.empty')}</div>
          )}
        </div>
      </div>

      {/* Disallowed Commands */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-medium text-foreground">{t('permissions.blockedCommands.title')}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{t('permissions.blockedCommands.description')}</p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={newDisallowedCommand}
            onChange={(event) => setNewDisallowedCommand(event.target.value)}
            placeholder={t('permissions.blockedCommands.placeholder')}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleAddDisallowedCommand(newDisallowedCommand);
              }
            }}
            className="h-10 flex-1"
          />
          <Button
            onClick={() => handleAddDisallowedCommand(newDisallowedCommand)}
            disabled={!newDisallowedCommand.trim()}
            size="sm"
            className="h-10 px-4"
          >
            <Plus className="mr-2 h-4 w-4 sm:mr-0" />
            <span className="sm:hidden">{t('permissions.actions.add')}</span>
          </Button>
        </div>

        <div className="space-y-2">
          {disallowedCommands.map((command) => (
            <div
              key={command}
              className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20"
            >
              <span className="font-mono text-sm text-red-800 dark:text-red-200">{command}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDisallowedCommandsChange(removeValue(disallowedCommands, command))}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {disallowedCommands.length === 0 && (
            <div className="py-6 text-center text-muted-foreground">{t('permissions.blockedCommands.empty')}</div>
          )}
        </div>
      </div>

      {/* Shell Examples */}
      <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20">
        <h4 className="mb-2 font-medium text-purple-900 dark:text-purple-100">
          {t('permissions.shellExamples.title')}
        </h4>
        <ul className="space-y-1 text-sm text-purple-800 dark:text-purple-200">
          <li>
            <code className="rounded bg-purple-100 px-1 dark:bg-purple-800">"Shell(ls)"</code>{' '}
            {t('permissions.shellExamples.ls')}
          </li>
          <li>
            <code className="rounded bg-purple-100 px-1 dark:bg-purple-800">"Shell(git status)"</code>{' '}
            {t('permissions.shellExamples.gitStatus')}
          </li>
          <li>
            <code className="rounded bg-purple-100 px-1 dark:bg-purple-800">"Shell(npm install)"</code>{' '}
            {t('permissions.shellExamples.npmInstall')}
          </li>
          <li>
            <code className="rounded bg-purple-100 px-1 dark:bg-purple-800">"Shell(rm -rf)"</code>{' '}
            {t('permissions.shellExamples.rmRf')}
          </li>
        </ul>
      </div>
    </div>
  );
}
