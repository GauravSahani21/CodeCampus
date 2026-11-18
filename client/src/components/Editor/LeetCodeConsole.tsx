'use client';
import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Terminal, 
  Play, 
  ChevronDown, 
  ChevronUp, 
  Maximize2, 
  Minimize2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Plus 
} from 'lucide-react';
import styles from './LeetCodeConsole.module.css';

interface TestResultItem {
  passed: boolean;
  input: string;
  expected?: string;
  expectedOutput?: string;
  actual?: string;
  actualOutput?: string;
  isHidden?: boolean;
  runtime?: number;
}

interface OutputData {
  stdout?: string;
  stderr?: string;
  status?: string;
  runtime?: number;
  testResults?: TestResultItem[];
  passedCount?: number;
  totalCount?: number;
}

interface Props {
  problem?: any;
  output: OutputData | null;
  isRunning: boolean;
  customInput: string;
  onCustomInputChange: (val: string) => void;
  onRun: () => void;
  onClose?: () => void;
  activeTab: 'testcase' | 'result';
  setActiveTab: (tab: 'testcase' | 'result') => void;
}

export default function LeetCodeConsole({
  problem,
  output,
  isRunning,
  customInput,
  onCustomInputChange,
  onRun,
  onClose,
  activeTab,
  setActiveTab,
}: Props) {
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [resultCaseIdx, setResultCaseIdx] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract initial example testcases from problem
  const initialCases: string[] = React.useMemo(() => {
    if (problem?.exampleTestCases && Array.isArray(problem.exampleTestCases) && problem.exampleTestCases.length > 0) {
      return problem.exampleTestCases.map((ex: any) => ex.input || '');
    }
    if (problem?.examples && Array.isArray(problem.examples) && problem.examples.length > 0) {
      return problem.examples.map((ex: any) => ex.input || '');
    }
    if (problem?.testCases && Array.isArray(problem.testCases) && problem.testCases.length > 0) {
      return problem.testCases.map((tc: any) => tc.input || '');
    }
    return [''];
  }, [problem]);

  const [testCasesList, setTestCasesList] = useState<string[]>(initialCases);

  useEffect(() => {
    if (initialCases.length > 0) {
      setTestCasesList(initialCases);
      if (!customInput && initialCases[0]) {
        onCustomInputChange(initialCases[0]);
      }
    }
  }, [initialCases]);

  const handleSelectCase = (idx: number) => {
    setSelectedCaseIdx(idx);
    const val = testCasesList[idx] || '';
    onCustomInputChange(val);
  };

  const handleAddCase = () => {
    const newIdx = testCasesList.length;
    const updated = [...testCasesList, ''];
    setTestCasesList(updated);
    setSelectedCaseIdx(newIdx);
    onCustomInputChange('');
  };

  const handleInputChange = (newVal: string) => {
    onCustomInputChange(newVal);
    const updated = [...testCasesList];
    updated[selectedCaseIdx] = newVal;
    setTestCasesList(updated);
  };

  const testResults = output?.testResults || [];
  const status = output?.status;
  const isAccepted = status === 'Accepted';
  const hasError = status === 'Runtime Error' || status === 'Compile Error' || (output?.stderr && output.stderr.length > 0);

  // Parse lines of input to show parameters like "nums =" "[2,7,11,15]" if applicable
  const currentInputValue = customInput || testCasesList[selectedCaseIdx] || '';
  const inputLines = currentInputValue.split('\n');

  return (
    <div 
      className={styles.consoleContainer}
      data-lenis-prevent="true"
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Console Tab Header */}
      <div className={styles.tabHeader}>
        <div className={styles.leftTabs}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'testcase' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('testcase')}
          >
            <CheckSquare size={13} />
            <span>Testcase</span>
          </button>

          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'result' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('result')}
          >
            <Terminal size={13} />
            <span>Test Result</span>
            {output && !isRunning && (
              <span className={`${styles.statusDot} ${isAccepted ? styles.dotGreen : styles.dotRed}`} />
            )}
          </button>
        </div>

        <div className={styles.rightControls}>
          {onClose && (
            <button
              type="button"
              className={styles.controlBtn}
              onClick={onClose}
              title="Close Console"
            >
              <ChevronDown size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Console Body */}
      <div 
        className={styles.consoleBody}
        data-lenis-prevent="true"
        onWheel={(e) => e.stopPropagation()}
      >
        {activeTab === 'testcase' ? (
          <div>
            {/* Case Selector Pills */}
            <div className={styles.casePillsRow}>
              {testCasesList.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`${styles.casePill} ${selectedCaseIdx === idx ? styles.casePillActive : ''}`}
                  onClick={() => handleSelectCase(idx)}
                >
                  Case {idx + 1}
                </button>
              ))}
              <button
                type="button"
                className={styles.addCaseBtn}
                onClick={handleAddCase}
                title="Add Testcase"
              >
                <Plus size={13} />
              </button>
            </div>

            {/* Input Param Fields */}
            {inputLines.length > 1 ? (
              inputLines.map((line, lIdx) => (
                <div key={lIdx} className={styles.paramGroup}>
                  <div className={styles.paramLabel}>param_{lIdx + 1} =</div>
                  <input
                    type="text"
                    className={styles.paramInput}
                    value={line}
                    onChange={(e) => {
                      const newLines = [...inputLines];
                      newLines[lIdx] = e.target.value;
                      handleInputChange(newLines.join('\n'));
                    }}
                  />
                </div>
              ))
            ) : (
              <div className={styles.paramGroup}>
                <div className={styles.paramLabel}>input =</div>
                <textarea
                  className={styles.paramInput}
                  rows={3}
                  value={currentInputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Enter testcase parameters or stdin..."
                />
              </div>
            )}
          </div>
        ) : (
          /* Test Result Tab */
          <div>
            {isRunning ? (
              <div className={styles.emptyState}>
                <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
                <span>Judging submission against test cases...</span>
              </div>
            ) : !output ? (
              <div className={styles.emptyState}>
                <span>You must run your code first.</span>
                <button type="button" className={styles.runNowBtn} onClick={onRun}>
                  <Play size={12} fill="currentColor" /> Run Code
                </button>
              </div>
            ) : (
              <div>
                {/* Result Status Header */}
                <div className={styles.resultStatusHeader}>
                  <div className={styles.resultTitleRow}>
                    {isAccepted ? (
                      <span className={styles.statusAccepted}>
                        <CheckCircle2 size={18} /> Accepted
                      </span>
                    ) : (
                      <span className={styles.statusFailed}>
                        <XCircle size={18} /> {status || 'Wrong Answer'}
                      </span>
                    )}
                  </div>

                  <div className={styles.resultMetaRow}>
                    {output.runtime !== undefined && (
                      <div className={styles.metaItem}>
                        <Clock size={12} />
                        <span>Runtime: <strong className={styles.metaValue}>{output.runtime} ms</strong></span>
                      </div>
                    )}
                    {output.passedCount !== undefined && output.totalCount !== undefined && (
                      <div className={styles.metaItem}>
                        <span>Passed: <strong className={styles.metaValue}>{output.passedCount}/{output.totalCount}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stderr / Error Box if present */}
                {output.stderr && (
                  <div className={styles.errorBox}>
                    <div className={styles.errorTitle}>
                      <AlertCircle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                      Compiler / Runtime Error
                    </div>
                    <pre className={styles.errorPre}>{output.stderr}</pre>
                  </div>
                )}

                {/* Individual Test Cases Selector (if testResults exist) */}
                {testResults.length > 0 && (
                  <>
                    <div className={styles.casePillsRow}>
                      {testResults.map((tc, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`${styles.casePill} ${resultCaseIdx === idx ? styles.casePillActive : ''} ${
                            tc.passed ? styles.casePillPassed : styles.casePillFailed
                          }`}
                          onClick={() => setResultCaseIdx(idx)}
                        >
                          <span
                            className={`${styles.statusDot} ${tc.passed ? styles.dotGreen : styles.dotRed}`}
                          />
                          Case {idx + 1}
                        </button>
                      ))}
                    </div>

                    {testResults[resultCaseIdx] && (
                      <div>
                        <div className={styles.ioBlock}>
                          <div className={styles.ioBlockLabel}>Input</div>
                          <div className={styles.ioBlockContent}>{testResults[resultCaseIdx].input || '(empty)'}</div>
                        </div>

                        <div className={styles.ioBlock}>
                          <div className={styles.ioBlockLabel}>Output</div>
                          <div
                            className={`${styles.ioBlockContent} ${
                              !testResults[resultCaseIdx].passed ? styles.ioBlockWrong : ''
                            }`}
                          >
                            {testResults[resultCaseIdx].actual ?? testResults[resultCaseIdx].actualOutput ?? '(no output)'}
                          </div>
                        </div>

                        <div className={styles.ioBlock}>
                          <div className={styles.ioBlockLabel}>Expected</div>
                          <div className={styles.ioBlockContent}>
                            {testResults[resultCaseIdx].expected ?? testResults[resultCaseIdx].expectedOutput ?? '(none)'}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* If stdout without testResults */}
                {testResults.length === 0 && output.stdout && (
                  <div className={styles.ioBlock}>
                    <div className={styles.ioBlockLabel}>Standard Output</div>
                    <div className={styles.ioBlockContent}>{output.stdout}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
