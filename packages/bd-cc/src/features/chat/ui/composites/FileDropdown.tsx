interface MentionableFile {
  name: string;
  path: string;
}

interface FileDropdownProps {
  filteredFiles: MentionableFile[];
  selectedFileIndex: number;
  onSelectFile: (file: MentionableFile) => void;
}

export default function FileDropdown({ filteredFiles, selectedFileIndex, onSelectFile }: FileDropdownProps) {
  return (
    <div className="absolute bottom-full left-0 right-0 z-50 mb-2 max-h-48 overflow-y-auto rounded-xl border border-border/50 bg-card/95 shadow-lg backdrop-blur-md">
      {filteredFiles.map((file, index) => (
        <div
          key={file.path}
          className={`cursor-pointer touch-manipulation border-b border-border/30 px-4 py-3 last:border-b-0 ${
            index === selectedFileIndex ? 'bg-primary/8 text-primary' : 'text-foreground hover:bg-accent/50'
          }`}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onSelectFile(file);
          }}
        >
          <div className="text-sm font-medium">{file.name}</div>
          <div className="font-mono text-xs text-muted-foreground">{file.path}</div>
        </div>
      ))}
    </div>
  );
}
