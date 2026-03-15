import Editor, { Monaco, DiffEditor } from '@monaco-editor/react';
import type * as MonacoEditor from 'monaco-editor';
import { useCallback, useRef, useEffect, useMemo } from 'react';
import MarkdownPreview from './markdown/MarkdownPreview';

// 语言映射表
const LANGUAGE_MAP: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  json: 'json',
  md: 'markdown',
  markdown: 'markdown',
  env: 'shell',
  sh: 'shell',
  bash: 'shell',
  yaml: 'yaml',
  yml: 'yaml',
  xml: 'xml',
  sql: 'sql',
  go: 'go',
  rs: 'rust',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  h: 'c',
  hpp: 'cpp',
};

type MonacoEditorSurfaceProps = {
  content: string;
  originalContent?: string;
  onChange?: (value: string) => void;
  markdownPreview: boolean;
  isMarkdownFile: boolean;
  isDarkMode: boolean;
  fontSize: number;
  showLineNumbers: boolean;
  minimapEnabled: boolean;
  wordWrap: boolean;
  fileName: string;
  isDiffMode?: boolean;
  editorKey?: string;
};

function getLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (fileName === '.env' || fileName.startsWith('.env.')) {
    return 'shell';
  }
  return LANGUAGE_MAP[ext] || 'plaintext';
}

export default function MonacoEditorSurface({
  content,
  originalContent,
  onChange,
  markdownPreview,
  isMarkdownFile,
  isDarkMode,
  fontSize,
  showLineNumbers,
  minimapEnabled,
  wordWrap,
  fileName,
  isDiffMode = false,
  editorKey,
}: MonacoEditorSurfaceProps) {
  const editorRef = useRef<MonacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);

  // 判断渲染模式
  const isMarkdownPreview = markdownPreview && isMarkdownFile;
  const isDiffView = isDiffMode && originalContent;

  // hooks 必须始终调用（在条件返回之前）
  const handleEditorDidMount = useCallback(
    (editor: MonacoEditor.editor.IStandaloneCodeEditor, monaco: Monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // 配置编辑器
      editor.updateOptions({
        fontSize,
        lineNumbers: showLineNumbers ? 'on' : 'off',
        minimap: { enabled: minimapEnabled },
        wordWrap: wordWrap ? 'on' : 'off',
      });
    },
    [fontSize, showLineNumbers, minimapEnabled, wordWrap]
  );

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontSize,
        lineNumbers: showLineNumbers ? 'on' : 'off',
        minimap: { enabled: minimapEnabled },
        wordWrap: wordWrap ? 'on' : 'off',
      });
    }
  }, [fontSize, showLineNumbers, minimapEnabled, wordWrap]);

  // 基础选项
  const baseOptions = useMemo(
    (): MonacoEditor.editor.IStandaloneEditorConstructionOptions => ({
      fontSize,
      lineNumbers: showLineNumbers ? 'on' : 'off',
      minimap: { enabled: minimapEnabled },
      wordWrap: wordWrap ? 'on' : 'off',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      folding: true,
      bracketPairColorization: { enabled: true },
      formatOnPaste: true,
      formatOnType: true,
      tabSize: 2,
      insertSpaces: true,
      renderWhitespace: 'selection',
      quickSuggestions: true,
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      snippetSuggestions: 'top',
    }),
    [fontSize, showLineNumbers, minimapEnabled, wordWrap]
  );

  // Markdown 预览模式
  if (isMarkdownPreview) {
    return (
      <div className="h-full overflow-y-auto bg-white dark:bg-gray-900">
        <div className="prose prose-sm mx-auto max-w-4xl max-w-none px-8 py-6 dark:prose-invert prose-headings:font-semibold prose-a:text-blue-600 prose-code:text-sm prose-pre:bg-gray-900 prose-img:rounded-lg dark:prose-a:text-blue-400">
          <MarkdownPreview content={content} />
        </div>
      </div>
    );
  }

  // Diff 模式
  if (isDiffView) {
    return (
      <DiffEditor
        key={`diff-${editorKey}`}
        height="100%"
        language={getLanguage(fileName)}
        theme={isDarkMode ? 'vs-dark' : 'vs'}
        original={originalContent}
        modified={content}
        options={{
          readOnly: true,
          renderSideBySide: true,
          minimap: { enabled: minimapEnabled },
          fontSize,
          lineNumbers: showLineNumbers ? 'on' : 'off',
          wordWrap: wordWrap ? 'on' : 'off',
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    );
  }

  // 普通编辑模式
  return (
    <Editor
      key={editorKey}
      height="100%"
      language={getLanguage(fileName)}
      value={content}
      onChange={(value) => onChange?.(value || '')}
      onMount={handleEditorDidMount}
      theme={isDarkMode ? 'vs-dark' : 'vs'}
      options={baseOptions}
      loading={
        <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-gray-500 dark:text-gray-400">Loading editor...</div>
        </div>
      }
    />
  );
}
