import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// Types
export type OutputDetailLevel = 'compact' | 'standard' | 'detailed' | 'forensic';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export type Settings = {
  outputDetail: OutputDetailLevel;
  autoClearAfterCopy: boolean;
  annotationColorId: string;
  blockInteractions: boolean;
  reactEnabled: boolean;
  webhookUrl: string;
  webhooksEnabled: boolean;
};

// Default settings
export const DEFAULT_SETTINGS: Settings = {
  outputDetail: 'standard',
  autoClearAfterCopy: false,
  annotationColorId: 'blue',
  blockInteractions: true,
  reactEnabled: true,
  webhookUrl: '',
  webhooksEnabled: true,
};

// Color options
export const COLOR_OPTIONS = [
  { id: 'indigo', label: 'Indigo', srgb: '#6155F5' },
  { id: 'blue', label: 'Blue', srgb: '#0088FF' },
  { id: 'cyan', label: 'Cyan', srgb: '#00C3D0' },
  { id: 'green', label: 'Green', srgb: '#34C759' },
  { id: 'yellow', label: 'Yellow', srgb: '#FFCC00' },
  { id: 'orange', label: 'Orange', srgb: '#FF8D28' },
  { id: 'red', label: 'Red', srgb: '#FF383C' },
] as const;

// Output detail options
export const OUTPUT_DETAIL_OPTIONS: { value: OutputDetailLevel; label: string }[] = [
  { value: 'compact', label: '简洁' },
  { value: 'standard', label: '标准' },
  { value: 'detailed', label: '详细' },
  { value: 'forensic', label: '取证' },
];

// Settings atom with persistence
export const settingsAtom = atomWithStorage<Settings>('aivis-next-settings', DEFAULT_SETTINGS);

// Panel visibility
export const showSettingsAtom = atom(false);

// Settings page: 'main' | 'automations'
export const settingsPageAtom = atom<'main' | 'automations'>('main');

// MCP connection status (would be set by MCP provider)
export const connectionStatusAtom = atom<ConnectionStatus>('disconnected');

// Endpoint (would be set by MCP provider)
export const endpointAtom = atom<string | undefined>(undefined);
