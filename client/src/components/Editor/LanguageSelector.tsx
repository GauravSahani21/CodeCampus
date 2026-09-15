'use client';
import { useState, useRef, useEffect } from 'react';
import styles from './LanguageSelector.module.css';
import { Check, ChevronDown } from 'lucide-react';
import { 
  SiPython, SiJavascript, SiTypescript, SiCplusplus, 
  SiC, SiGo, SiRust, SiPhp, SiRuby, SiKotlin, SiSwift 
} from 'react-icons/si';
import { FaJava } from 'react-icons/fa';
import { TbBrandCSharp } from 'react-icons/tb';

const LANGUAGES = [
  { id: 'java', label: 'Java', icon: <FaJava color="#ED8B00" /> },
  { id: 'python', label: 'Python 3', icon: <SiPython color="#3776AB" /> },
  { id: 'javascript', label: 'JavaScript', icon: <SiJavascript color="#F7DF1E" /> },
  { id: 'typescript', label: 'TypeScript', icon: <SiTypescript color="#3178C6" /> },
  { id: 'cpp', label: 'C++', icon: <SiCplusplus color="#00599C" /> },
  { id: 'c', label: 'C', icon: <SiC color="#A8B9CC" /> },
  { id: 'go', label: 'Go', icon: <SiGo color="#00ADD8" /> },
  { id: 'rust', label: 'Rust', icon: <SiRust color="#DEA584" /> },
  { id: 'csharp', label: 'C#', icon: <TbBrandCSharp color="#239120" /> },
  { id: 'php', label: 'PHP', icon: <SiPhp color="#777BB4" /> },
  { id: 'ruby', label: 'Ruby', icon: <SiRuby color="#CC342D" /> },
  { id: 'kotlin', label: 'Kotlin', icon: <SiKotlin color="#7F52FF" /> },
  { id: 'swift', label: 'Swift', icon: <SiSwift color="#F05138" /> },
];

interface Props { value: string; onChange: (lang: string) => void; }

export default function LanguageSelector({ value, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const current = LANGUAGES.find((l) => l.id === value) || LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button 
        className={styles.trigger} 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select programming language"
      >
        <span className={styles.icon}>{current.icon}</span>
        <span className={styles.label}>{current.label}</span>
        <ChevronDown size={14} className={styles.chevron} />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              className={`${styles.option} ${value === lang.id ? styles.selected : ''}`}
              onClick={() => {
                onChange(lang.id);
                setIsOpen(false);
              }}
            >
              <div className={styles.optionLeft}>
                <span className={styles.checkIcon}>
                  {value === lang.id && <Check size={14} />}
                </span>
                <span className={styles.optionIcon}>{lang.icon}</span>
                <span className={styles.optionLabel}>{lang.label}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { LANGUAGES };
