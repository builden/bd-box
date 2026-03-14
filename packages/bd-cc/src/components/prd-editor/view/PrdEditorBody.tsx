import Editor from '@monaco-editor/react';
import MarkdownPreview from '../../code-editor/view/subcomponents/markdown/MarkdownPreview';

type PrdEditorBodyProps = {
  content: string;
  onContentChange: (nextContent: string) => void;
  previewMode: boolean;
  isDarkMode: boolean;
  wordWrap: boolean;
};

export default function PrdEditorBody({
  content,
  onContentChange,
  previewMode,
  isDarkMode,
  wordWrap,
}: PrdEditorBodyProps) {
  if (previewMode) {
    return (
      <div className="prose prose-gray h-full max-w-none overflow-y-auto p-6 dark:prose-invert">
        <MarkdownPreview content={content} />
      </div>
    );
  }

  return (
    <Editor
      height="100%"
      language="markdown"
      value={content}
      onChange={(value) => onContentChange(value || '')}
      theme={isDarkMode ? 'vs-dark' : 'vs'}
      options={{
        fontSize: 14,
        lineNumbers: 'on',
        minimap: { enabled: false },
        wordWrap: wordWrap ? 'on' : 'off',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        folding: true,
        formatOnPaste: true,
        formatOnType: true,
        tabSize: 2,
        insertSpaces: true,
        renderWhitespace: 'selection',
        quickSuggestions: true,
        suggestOnTriggerCharacters: true,
      }}
      loading={
        <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="text-gray-500 dark:text-gray-400">Loading editor...</div>
        </div>
      }
    />
  );
}
