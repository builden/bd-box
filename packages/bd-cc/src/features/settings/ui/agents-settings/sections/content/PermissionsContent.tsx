import ClaudePermissions from './ClaudePermissions';
import CursorPermissions from './CursorPermissions';
import CodexPermissions from './CodexPermissions';
import GeminiPermissions from './GeminiPermissions';
import type { CodexPermissionMode, GeminiPermissionMode } from '@/components/settings/types/types';

export type ClaudePermissionsProps = {
  agent: 'claude';
  skipPermissions: boolean;
  onSkipPermissionsChange: (value: boolean) => void;
  allowedTools: string[];
  onAllowedToolsChange: (value: string[]) => void;
  disallowedTools: string[];
  onDisallowedToolsChange: (value: string[]) => void;
};

export type CursorPermissionsProps = {
  agent: 'cursor';
  skipPermissions: boolean;
  onSkipPermissionsChange: (value: boolean) => void;
  allowedCommands: string[];
  onAllowedCommandsChange: (value: string[]) => void;
  disallowedCommands: string[];
  onDisallowedCommandsChange: (value: string[]) => void;
};

export type CodexPermissionsProps = {
  agent: 'codex';
  permissionMode: CodexPermissionMode;
  onPermissionModeChange: (value: CodexPermissionMode) => void;
};

export type GeminiPermissionsProps = {
  agent: 'gemini';
  permissionMode: GeminiPermissionMode;
  onPermissionModeChange: (value: GeminiPermissionMode) => void;
};

export type PermissionsContentProps =
  | ClaudePermissionsProps
  | CursorPermissionsProps
  | CodexPermissionsProps
  | GeminiPermissionsProps;

export default function PermissionsContent(props: PermissionsContentProps) {
  if (props.agent === 'claude') {
    const { agent: _, ...rest } = props;
    return <ClaudePermissions {...rest} />;
  }

  if (props.agent === 'cursor') {
    const { agent: _, ...rest } = props;
    return <CursorPermissions {...rest} />;
  }

  if (props.agent === 'gemini') {
    const { agent: _, ...rest } = props;
    return <GeminiPermissions {...rest} />;
  }

  const { agent: _, ...codexRest } = props;
  return <CodexPermissions {...codexRest} />;
}
