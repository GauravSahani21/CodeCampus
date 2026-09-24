'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Files,
  Play,
  RotateCcw,
  Terminal as TerminalIcon,
  Settings,
  GitBranch,
  AlertCircle,
  CheckCircle2,
  Code2,
  Save,
  FolderTree,
  X,
  FileCode2,
  FileText,
  FilePlus,
  Trash2,
  Pencil,
  Download,
  DownloadCloud,
  MoreVertical,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Group, Panel, Separator } from 'react-resizable-panels';
import VsCodeTerminal from '@/components/Editor/VsCodeTerminal';
import FileLanguageIcon from '@/components/Editor/FileLanguageIcon';
import { useInteractiveTerminal } from '@/lib/useInteractiveTerminal';
import styles from './page.module.css';

const CodeEditor = dynamic(() => import('@/components/Editor/CodeEditor'), { ssr: false });

interface WorkspaceFile {
  id: string;
  name: string;
  content: string;
  language: string;
  iconColor?: string;
  isFolder?: boolean;
  parentId?: string | null;
}

function detectLanguage(filename: string): { language: string; color: string } {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'py':
      return { language: 'python', color: '#3572A5' };
    case 'js':
    case 'jsx':
    case 'mjs':
      return { language: 'javascript', color: '#f1e05a' };
    case 'ts':
    case 'tsx':
      return { language: 'typescript', color: '#3178c6' };
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'hpp':
    case 'h':
      return { language: 'cpp', color: '#f34b7d' };
    case 'c':
      return { language: 'c', color: '#555555' };
    case 'java':
      return { language: 'java', color: '#b07219' };
    case 'go':
      return { language: 'go', color: '#00ADD8' };
    case 'rs':
      return { language: 'rust', color: '#dea584' };
    case 'cs':
      return { language: 'csharp', color: '#178600' };
    case 'php':
      return { language: 'php', color: '#4F5D95' };
    case 'rb':
      return { language: 'ruby', color: '#701516' };
    case 'html':
    case 'htm':
      return { language: 'html', color: '#e34c26' };
    case 'css':
      return { language: 'css', color: '#563d7c' };
    case 'json':
      return { language: 'json', color: '#cbcb41' };
    case 'md':
      return { language: 'markdown', color: '#083fa1' };
    default:
      return { language: 'plaintext', color: '#8b949e' };
  }
}

function getDefaultContentForFile(filename: string, language: string): string {
  if (language === 'python') {
    return `# ${filename}
def main():
    print("Welcome to CodeCampus IDE")
    name = input("Enter your name: ")
    print(f"Hello, {name}! Your Python program is running.")

if __name__ == "__main__":
    main()
`;
  }
  if (language === 'javascript') {
    return `// ${filename}
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log("Welcome to CodeCampus IDE");
rl.question('Enter your name: ', (name) => {
  console.log(\`Hello, \${name}! Your Node.js program executed successfully.\`);
  rl.close();
});
`;
  }
  if (language === 'typescript') {
    return `// ${filename}
interface Developer {
  name: string;
  language: string;
}

const dev: Developer = {
  name: "CodeCampus Developer",
  language: "TypeScript",
};

console.log(\`Welcome \${dev.name}, coding in \${dev.language}!\`);
`;
  }
  if (language === 'java') {
    const match = filename.match(/^(\w+)\.java$/i);
    const className = match ? match[1] : 'Main';
    return `import java.util.Scanner;

public class ${className} {
    public static void main(String[] args) {
        System.out.println("Welcome to CodeCampus IDE");
        Scanner scanner = new Scanner(System.in);
        System.out.print("Enter your name: ");
        if (scanner.hasNextLine()) {
            String name = scanner.nextLine();
            System.out.println("Hello, " + name + "! Java program executed successfully.");
        }
    }
}
`;
  }
  if (language === 'cpp') {
    return `#include <iostream>
#include <string>
using namespace std;

int main() {
    cout << "Welcome to CodeCampus IDE" << endl;
    cout << "Enter your name: ";
    string name;
    if (cin >> name) {
        cout << "Hello, " << name << "! C++ program executed successfully." << endl;
    }
    return 0;
}
`;
  }
  if (language === 'c') {
    return `#include <stdio.h>

int main() {
    printf("Welcome to CodeCampus IDE\\n");
    printf("Enter your name: ");
    char name[100];
    if (scanf("%99s", name) == 1) {
        printf("Hello, %s! C program executed successfully.\\n", name);
    }
    return 0;
}
`;
  }
  if (language === 'go') {
    return `package main
import (
    "bufio"
    "fmt"
    "os"
)

func main() {
    fmt.Println("Welcome to CodeCampus IDE")
    fmt.Print("Enter your name: ")
    scanner := bufio.NewScanner(os.Stdin)
    if scanner.Scan() {
        fmt.Printf("Hello, %s! Go program executed successfully.\\n", scanner.Text())
    }
}
`;
  }
  return `// ${filename}\n`;
}

const INITIAL_WORKSPACE: WorkspaceFile[] = [
  {
    id: 'py-1',
    name: 'main.py',
    language: 'python',
    iconColor: '#3572A5',
    content: `# main.py
def main():
    print("Welcome to CodeCampus VS Code IDE")
    name = input("Enter your name: ")
    print(f"Hello, {name}! Your Python program is running.")

if __name__ == "__main__":
    main()
`,
  },
  {
    id: 'java-1',
    name: 'Main.java',
    language: 'java',
    iconColor: '#b07219',
    content: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        System.out.println("Welcome to CodeCampus VS Code IDE (Java)");
        Scanner scanner = new Scanner(System.in);
        System.out.print("Enter your name: ");
        if (scanner.hasNextLine()) {
            String name = scanner.nextLine();
            System.out.println("Hello, " + name + "!");
        }
    }
}
`,
  },
  {
    id: 'cpp-1',
    name: 'main.cpp',
    language: 'cpp',
    iconColor: '#f34b7d',
    content: `#include <iostream>
#include <string>
using namespace std;

int main() {
    cout << "Welcome to CodeCampus VS Code IDE (C++)" << endl;
    cout << "Enter your name: ";
    string name;
    if (cin >> name) {
        cout << "Hello, " << name << "!" << endl;
    }
    return 0;
}
`,
  },
  {
    id: 'c-1',
    name: 'main.c',
    language: 'c',
    iconColor: '#555555',
    content: `#include <stdio.h>

int main() {
    printf("Welcome to CodeCampus VS Code IDE (C)\\n");
    printf("Enter your name: ");
    char name[100];
    if (scanf("%99s", name) == 1) {
        printf("Hello, %s! C program executed successfully.\\n", name);
    }
    return 0;
}
`,
  },
  {
    id: 'js-1',
    name: 'main.js',
    language: 'javascript',
    iconColor: '#f1e05a',
    content: `// main.js
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log("Welcome to CodeCampus VS Code IDE (JavaScript)");
rl.question('Enter your name: ', (name) => {
  console.log(\`Hello, \${name}!\`);
  rl.close();
});
`,
  },
];

export default function IDEPage() {
  const [files, setFiles] = useState<WorkspaceFile[]>(INITIAL_WORKSPACE);
  const [activeFileId, setActiveFileId] = useState<string>('py-1');
  const [openTabIds, setOpenTabIds] = useState<string[]>(['py-1', 'js-1']);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  // Inline New File creation state
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const newFileInputRef = useRef<HTMLInputElement>(null);

  // File renaming state
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // 3-Dots context menu state
  const [openMenuFileId, setOpenMenuFileId] = useState<string | null>(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleDocClick = () => setOpenMenuFileId(null);
    window.addEventListener('click', handleDocClick);
    return () => window.removeEventListener('click', handleDocClick);
  }, []);

  // Interactive Terminal Hook
  const {
    outputStream,
    isRunning,
    startExecution,
    sendInput,
    killExecution,
    clear: clearTerminal,
    lastExitCode,
    lastRuntime,
  } = useInteractiveTerminal();

  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  useEffect(() => {
    if (isCreatingFile) {
      newFileInputRef.current?.focus();
    }
  }, [isCreatingFile]);

  const handleCodeChange = (newVal: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, content: newVal } : f))
    );
  };

  const handleOpenFile = (fileId: string) => {
    if (!openTabIds.includes(fileId)) {
      setOpenTabIds((prev) => [...prev, fileId]);
    }
    setActiveFileId(fileId);
  };

  const handleCloseTab = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    const remaining = openTabIds.filter((id) => id !== fileId);
    if (remaining.length === 0) return;
    setOpenTabIds(remaining);
    if (activeFileId === fileId) {
      setActiveFileId(remaining[remaining.length - 1]);
    }
  };

  // ─── File Creation ──────────────────────────────────────────────────────────
  const handleConfirmNewFile = () => {
    const trimmed = newFileName.trim();
    if (!trimmed) {
      setIsCreatingFile(false);
      setNewFileName('');
      return;
    }

    if (files.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`File "${trimmed}" already exists.`);
      return;
    }

    const { language, color } = detectLanguage(trimmed);
    const content = getDefaultContentForFile(trimmed, language);
    const newId = `file-${Date.now()}`;

    const newFile: WorkspaceFile = {
      id: newId,
      name: trimmed,
      language,
      iconColor: color,
      content,
    };

    setFiles((prev) => [...prev, newFile]);
    setOpenTabIds((prev) => [...prev, newId]);
    setActiveFileId(newId);
    setIsCreatingFile(false);
    setNewFileName('');
    toast.success(`Created ${trimmed}`);
  };

  // ─── File Deletion ──────────────────────────────────────────────────────────
  const handleDeleteFile = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    if (files.length <= 1) {
      toast.error('Cannot delete the only file in the workspace.');
      return;
    }

    const targetFile = files.find((f) => f.id === fileId);
    const remainingFiles = files.filter((f) => f.id !== fileId);
    const remainingTabs = openTabIds.filter((id) => id !== fileId);

    setFiles(remainingFiles);
    setOpenTabIds(remainingTabs.length > 0 ? remainingTabs : [remainingFiles[0].id]);

    if (activeFileId === fileId) {
      setActiveFileId(remainingTabs.length > 0 ? remainingTabs[0] : remainingFiles[0].id);
    }

    toast.success(`Deleted ${targetFile?.name || 'file'}`);
  };

  // ─── File Renaming ──────────────────────────────────────────────────────────
  const handleStartRename = (file: WorkspaceFile) => {
    setRenamingFileId(file.id);
    setRenameValue(file.name);
    setTimeout(() => {
      if (renameInputRef.current) {
        renameInputRef.current.focus();
        const dotIdx = file.name.lastIndexOf('.');
        if (dotIdx > 0) {
          renameInputRef.current.setSelectionRange(0, dotIdx);
        } else {
          renameInputRef.current.select();
        }
      }
    }, 50);
  };

  const handleCancelRename = () => {
    setRenamingFileId(null);
    setRenameValue('');
  };

  const handleConfirmRename = (fileId: string) => {
    const trimmed = renameValue.trim();
    const targetFile = files.find((f) => f.id === fileId);
    if (!targetFile) {
      setRenamingFileId(null);
      return;
    }

    // Cancel if empty or unchanged
    if (!trimmed || trimmed === targetFile.name) {
      setRenamingFileId(null);
      return;
    }

    // Check duplicate name
    if (files.some((f) => f.id !== fileId && f.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`A file named "${trimmed}" already exists.`);
      return;
    }

    const { language: newLang, color: newColor } = detectLanguage(trimmed);
    const oldLang = targetFile.language;

    // If content was untouched starter template for the old language, update to default for new language
    let updatedContent = targetFile.content;
    const oldDefault = getDefaultContentForFile(targetFile.name, oldLang);
    if (targetFile.content.trim() === oldDefault.trim() || !targetFile.content.trim()) {
      updatedContent = getDefaultContentForFile(trimmed, newLang);
    }

    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? {
              ...f,
              name: trimmed,
              language: newLang,
              iconColor: newColor,
              content: updatedContent,
            }
          : f
      )
    );

    setRenamingFileId(null);
    setRenameValue('');
    toast.success(`Renamed to ${trimmed} (${newLang})`);
  };

  // ─── File Download (Single) ─────────────────────────────────────────────────
  const handleDownloadFile = (e: React.MouseEvent, file: WorkspaceFile) => {
    e.stopPropagation();
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${file.name}`);
  };

  // ─── Download Entire Workspace ──────────────────────────────────────────────
  const handleDownloadAll = () => {
    files.forEach((file, index) => {
      setTimeout(() => {
        const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, index * 150);
    });
    toast.success(`Exporting ${files.length} workspace files`);
  };

  // ─── Run Program in Terminal ────────────────────────────────────────────────
  const handleRun = () => {
    if (!activeFile.content.trim()) {
      toast.error('Editor is empty');
      return;
    }

    // Automatically open the terminal when executing
    setIsTerminalOpen(true);
    startExecution(activeFile.language, activeFile.content, activeFile.name);
  };

  // Keyboard shortcut: Ctrl+Enter to Run
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile]);

  return (
    <div className={styles.ideContainer}>
      {/* VS Code Main Horizontal Body (Activity Bar + Sidebar + Editor/Terminal) */}
      <div className={styles.workspaceBody}>
        {/* 1. Leftmost VS Code Activity Bar */}
        <aside className={styles.activityBar}>
          <div className={styles.activityTop}>
            <button
              className={`${styles.activityBtn} ${isSidebarOpen ? styles.activityBtnActive : ''}`}
              title="Explorer (Files)"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Files size={22} />
            </button>

            <button
              className={`${styles.activityBtn} ${isTerminalOpen ? styles.activityBtnActive : ''}`}
              title="Toggle Integrated Terminal"
              onClick={() => setIsTerminalOpen(!isTerminalOpen)}
            >
              <TerminalIcon size={22} />
            </button>
          </div>

          <div className={styles.activityBottom}>
            <button className={styles.activityBtn} title="Settings">
              <Settings size={22} />
            </button>
          </div>
        </aside>

        {/* 2. VS Code File Explorer Sidebar */}
        {isSidebarOpen && (
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <span>EXPLORER</span>
              <div className={styles.explorerActions}>
                <button
                  className={styles.explorerActionBtn}
                  title="New File"
                  onClick={() => {
                    setIsCreatingFile(true);
                    setTimeout(() => newFileInputRef.current?.focus(), 50);
                  }}
                >
                  <FilePlus size={14} />
                </button>
              </div>
            </div>

            <div className={styles.fileList}>
              {/* Inline Input when creating a new file */}
              {isCreatingFile && (
                <div className={styles.newFileInputWrap}>
                  <FileLanguageIcon filename={newFileName || 'file.txt'} size={14} />
                  <input
                    ref={newFileInputRef}
                    type="text"
                    className={styles.newFileInput}
                    placeholder="filename.ext (e.g. app.py, index.js)"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirmNewFile();
                      if (e.key === 'Escape') {
                        setIsCreatingFile(false);
                        setNewFileName('');
                      }
                    }}
                    onBlur={handleConfirmNewFile}
                  />
                </div>
              )}

              {files.map((file) => {
                const isRenaming = renamingFileId === file.id;

                if (isRenaming) {
                  return (
                    <div
                      key={file.id}
                      className={styles.renameInputWrap}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FileLanguageIcon filename={renameValue || file.name} size={14} />
                      <input
                        ref={renameInputRef}
                        type="text"
                        className={styles.renameInput}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleConfirmRename(file.id);
                          if (e.key === 'Escape') handleCancelRename();
                        }}
                        onBlur={() => handleConfirmRename(file.id)}
                      />
                    </div>
                  );
                }

                return (
                  <div
                    key={file.id}
                    className={`${styles.fileItem} ${file.id === activeFileId ? styles.fileItemActive : ''}`}
                    onClick={() => handleOpenFile(file.id)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleStartRename(file);
                    }}
                  >
                    <FileLanguageIcon filename={file.name} language={file.language} size={14} />
                    <span className={styles.fileNameText} title={file.name}>
                      {file.name}
                    </span>

                    {/* 3-Dots Action Menu with Rename, Download and Delete */}
                    <div
                      className={`${styles.fileItemActions} ${openMenuFileId === file.id ? styles.fileItemActionsOpen : ''}`}
                    >
                      <button
                        className={`${styles.fileActionBtn} ${openMenuFileId === file.id ? styles.fileActionBtnActive : ''}`}
                        title="File Options"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuFileId((prev) => (prev === file.id ? null : file.id));
                        }}
                      >
                        <MoreVertical size={13} />
                      </button>

                      {openMenuFileId === file.id && (
                        <div
                          className={styles.fileContextMenu}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className={styles.contextMenuItem}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuFileId(null);
                              handleStartRename(file);
                            }}
                          >
                            <Pencil size={13} />
                            <span>Rename</span>
                          </button>
                          <button
                            className={styles.contextMenuItem}
                            onClick={(e) => {
                              setOpenMenuFileId(null);
                              handleDownloadFile(e, file);
                            }}
                          >
                            <Download size={13} />
                            <span>Download</span>
                          </button>
                          <button
                            className={`${styles.contextMenuItem} ${styles.contextMenuDelete}`}
                            onClick={(e) => {
                              setOpenMenuFileId(null);
                              if (files.length <= 1) {
                                toast.error('Cannot delete the only remaining file');
                                return;
                              }
                              handleDeleteFile(e, file.id);
                            }}
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* 3. Main Editor & Resizable Terminal Layout */}
        <main className={styles.mainContent}>
          {/* Editor Tabs Bar */}
          <div className={styles.tabsBar}>
            <div className={styles.tabsList}>
              {openTabIds.map((tabId) => {
                const file = files.find((f) => f.id === tabId);
                if (!file) return null;
                const isActive = file.id === activeFileId;
                return (
                  <div
                    key={file.id}
                    className={`${styles.editorTab} ${isActive ? styles.editorTabActive : ''}`}
                    onClick={() => setActiveFileId(file.id)}
                  >
                    <FileLanguageIcon filename={file.name} language={file.language} size={13} />
                    <span>{file.name}</span>
                    {openTabIds.length > 1 && (
                      <button
                        className={styles.tabCloseBtn}
                        onClick={(e) => handleCloseTab(e, file.id)}
                        title="Close Tab"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className={styles.tabBarActions}>
              <button
                className={styles.headerIconBtn}
                title="Reset File to Default Code"
                onClick={() => {
                  const def = getDefaultContentForFile(activeFile.name, activeFile.language);
                  handleCodeChange(def);
                  toast.success('Code reset to default');
                }}
              >
                <RotateCcw size={14} />
              </button>

              <button
                className={styles.headerIconBtn}
                title="Toggle Integrated Terminal"
                onClick={() => setIsTerminalOpen(!isTerminalOpen)}
                style={isTerminalOpen ? { color: '#007acc' } : undefined}
              >
                <TerminalIcon size={14} />
              </button>

              <button
                className={styles.runButton}
                onClick={handleRun}
                disabled={isRunning}
                title="Run Code in Integrated Terminal (Ctrl+Enter)"
              >
                <Play size={13} fill="currentColor" />
                <span>{isRunning ? 'Running...' : 'Run Code'}</span>
              </button>
            </div>
          </div>

          {/* Breadcrumbs Bar */}
          <div className={styles.breadcrumbsBar}>
            <span className={styles.breadcrumbItem}>workspace</span>
            <span>›</span>
            <span className={styles.breadcrumbItem}>src</span>
            <span>›</span>
            <span className={`${styles.breadcrumbItem} ${styles.breadcrumbActive}`}>
              <FileLanguageIcon filename={activeFile.name} language={activeFile.language} size={12} />
              {activeFile.name}
            </span>
          </div>

          {/* Resizable Code Editor & Integrated Terminal */}
          <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
            {isTerminalOpen ? (
              <Group orientation="vertical" style={{ height: '100%', width: '100%' }}>
                <Panel defaultSize={60} minSize={25} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1, minHeight: 0 }}>
                    <CodeEditor
                      value={activeFile.content}
                      onChange={handleCodeChange}
                      language={activeFile.language}
                      height="100%"
                      minimap={true}
                      borderless={true}
                      onCursorChange={(line, col) => setCursorPos({ line, col })}
                    />
                  </div>
                </Panel>

                <Separator className={styles.resizeHandleHorizontal}>
                  <div style={{ width: 32, height: 2, background: '#454545', borderRadius: 1 }} />
                </Separator>

                <Panel defaultSize={40} minSize={15} style={{ display: 'flex', flexDirection: 'column' }}>
                  <VsCodeTerminal
                    language={activeFile.language}
                    isRunning={isRunning}
                    outputStream={outputStream}
                    onSendInput={sendInput}
                    onKill={killExecution}
                    onClear={clearTerminal}
                    onRestart={handleRun}
                    onClose={() => setIsTerminalOpen(false)}
                  />
                </Panel>
              </Group>
            ) : (
              <div style={{ height: '100%', width: '100%' }}>
                <CodeEditor
                  value={activeFile.content}
                  onChange={handleCodeChange}
                  language={activeFile.language}
                  height="100%"
                  minimap={true}
                  borderless={true}
                  onCursorChange={(line, col) => setCursorPos({ line, col })}
                />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 4. VS Code Status Bar (At the bottom of IDE) */}
      <footer className={styles.statusBar}>
        <div className={styles.statusLeft}>
          <div className={styles.statusItem}>
            <GitBranch size={11} />
            <span>main*</span>
          </div>
          <div className={styles.statusItem}>
            <AlertCircle size={11} />
            <span>0</span>
          </div>
          <div
            className={`${styles.statusItem} ${styles.statusItemInteractive}`}
            onClick={() => setIsTerminalOpen(!isTerminalOpen)}
            title="Toggle Terminal"
          >
            <TerminalIcon size={11} />
            <span>Terminal</span>
          </div>
          {isRunning && <span>Executing {activeFile.name}...</span>}
        </div>

        <div className={styles.statusRight}>
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          <span>Spaces: 4</span>
          <span>UTF-8</span>
          <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{activeFile.language}</span>
        </div>
      </footer>
    </div>
  );
}
