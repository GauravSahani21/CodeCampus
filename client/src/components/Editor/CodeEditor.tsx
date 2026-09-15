'use client';
import dynamic from 'next/dynamic';
import { useRef, useCallback } from 'react';
import type * as Monaco from 'monaco-editor';
import toast from 'react-hot-toast';
import styles from './CodeEditor.module.css';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  height?: string;
  readOnly?: boolean;
  minimap?: boolean;
  borderless?: boolean;
  onCursorChange?: (line: number, column: number) => void;
}

const MONACO_LANG_MAP: Record<string, string> = {
  python: 'python', javascript: 'javascript', typescript: 'typescript',
  cpp: 'cpp', c: 'c', java: 'java', go: 'go', rust: 'rust',
  csharp: 'csharp', php: 'php', ruby: 'ruby', kotlin: 'kotlin', swift: 'swift',
};

export default function CodeEditor({
  value,
  onChange,
  language,
  height = '500px',
  readOnly = false,
  minimap = false,
  borderless = false,
  onCursorChange,
}: CodeEditorProps) {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleMount = useCallback(
    (editor: Monaco.editor.IStandaloneCodeEditor, monaco: any) => {
      editorRef.current = editor;

      editor.updateOptions({
        contextmenu: true,
        readOnly,
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
        fontSize: 14,
        lineHeight: 22,
        minimap: { enabled: minimap },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        tabSize: 2,
        renderLineHighlight: 'all',
        smoothScrolling: true,
        cursorBlinking: 'phase',
        cursorSmoothCaretAnimation: 'on',
        padding: { top: 12, bottom: 12 },
        lineNumbers: 'on',
        glyphMargin: true,
        folding: true,
        bracketPairColorization: { enabled: true },
      });

      if (onCursorChange) {
        editor.onDidChangeCursorPosition((e) => {
          onCursorChange(e.position.lineNumber, e.position.column);
        });
      }
    },
    [readOnly, minimap, onCursorChange]
  );

  return (
    <div
      className={`${styles.editorWrapper} ${borderless ? styles.editorWrapperBorderless : ''}`}
      style={{ height }}
    >
      <MonacoEditor
        height={height}
        language={MONACO_LANG_MAP[language] || 'plaintext'}
        value={value}
        onChange={(val) => onChange(val || '')}
        theme="vs-dark"
        onMount={handleMount}
        options={{ automaticLayout: true }}
        loading={
          <div className={styles.editorLoading}>
            <div className="spinner" />
            <span>Loading editor...</span>
          </div>
        }
      />
    </div>
  );
}
