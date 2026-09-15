'use client';

import React from 'react';
import {
  SiPython,
  SiJavascript,
  SiTypescript,
  SiCplusplus,
  SiC,
  SiGo,
  SiRust,
  SiPhp,
  SiRuby,
  SiKotlin,
  SiSwift,
  SiHtml5,
  SiJson,
  SiMarkdown,
} from 'react-icons/si';
import { FaJava, FaCss3Alt } from 'react-icons/fa';
import { TbBrandCSharp } from 'react-icons/tb';
import { FileCode2 } from 'lucide-react';

export interface FileLanguageIconProps {
  filename?: string;
  language?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function getLanguageKey(filename?: string, language?: string): string {
  if (language) {
    const l = language.toLowerCase();
    if (l === 'js' || l === 'node') return 'javascript';
    if (l === 'ts') return 'typescript';
    if (l === 'py') return 'python';
    if (l === 'cs') return 'csharp';
    if (l === 'rb') return 'ruby';
    if (l === 'md') return 'markdown';
    return l;
  }
  if (!filename) return 'plaintext';

  const ext = filename.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'py':
    case 'pyw':
      return 'python';
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'ts':
    case 'tsx':
    case 'mts':
    case 'cts':
      return 'typescript';
    case 'java':
      return 'java';
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'hpp':
    case 'hxx':
    case 'h':
      return 'cpp';
    case 'c':
      return 'c';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'cs':
      return 'csharp';
    case 'php':
      return 'php';
    case 'rb':
      return 'ruby';
    case 'kt':
    case 'kts':
      return 'kotlin';
    case 'swift':
      return 'swift';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
    case 'scss':
    case 'less':
      return 'css';
    case 'json':
      return 'json';
    case 'md':
    case 'markdown':
      return 'markdown';
    default:
      return 'plaintext';
  }
}

export default function FileLanguageIcon({
  filename,
  language,
  size = 14,
  className,
  style,
}: FileLanguageIconProps) {
  const langKey = getLanguageKey(filename, language);

  const wrapperStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: size,
    height: size,
    ...style,
  };

  switch (langKey) {
    case 'python':
      return (
        <span style={wrapperStyle} className={className} title="Python">
          <SiPython size={size} color="#3776AB" />
        </span>
      );
    case 'javascript':
      return (
        <span style={wrapperStyle} className={className} title="JavaScript">
          <SiJavascript size={size} color="#F7DF1E" />
        </span>
      );
    case 'typescript':
      return (
        <span style={wrapperStyle} className={className} title="TypeScript">
          <SiTypescript size={size} color="#3178C6" />
        </span>
      );
    case 'java':
      return (
        <span style={wrapperStyle} className={className} title="Java">
          <FaJava size={size} color="#ED8B00" />
        </span>
      );
    case 'cpp':
      return (
        <span style={wrapperStyle} className={className} title="C++">
          <SiCplusplus size={size} color="#00599C" />
        </span>
      );
    case 'c':
      return (
        <span style={wrapperStyle} className={className} title="C">
          <SiC size={size} color="#A8B9CC" />
        </span>
      );
    case 'go':
      return (
        <span style={wrapperStyle} className={className} title="Go">
          <SiGo size={size} color="#00ADD8" />
        </span>
      );
    case 'rust':
      return (
        <span style={wrapperStyle} className={className} title="Rust">
          <SiRust size={size} color="#DEA584" />
        </span>
      );
    case 'csharp':
      return (
        <span style={wrapperStyle} className={className} title="C#">
          <TbBrandCSharp size={size} color="#239120" />
        </span>
      );
    case 'php':
      return (
        <span style={wrapperStyle} className={className} title="PHP">
          <SiPhp size={size} color="#777BB4" />
        </span>
      );
    case 'ruby':
      return (
        <span style={wrapperStyle} className={className} title="Ruby">
          <SiRuby size={size} color="#CC342D" />
        </span>
      );
    case 'kotlin':
      return (
        <span style={wrapperStyle} className={className} title="Kotlin">
          <SiKotlin size={size} color="#7F52FF" />
        </span>
      );
    case 'swift':
      return (
        <span style={wrapperStyle} className={className} title="Swift">
          <SiSwift size={size} color="#F05138" />
        </span>
      );
    case 'html':
      return (
        <span style={wrapperStyle} className={className} title="HTML">
          <SiHtml5 size={size} color="#E34F26" />
        </span>
      );
    case 'css':
      return (
        <span style={wrapperStyle} className={className} title="CSS">
          <FaCss3Alt size={size} color="#1572B6" />
        </span>
      );
    case 'json':
      return (
        <span style={wrapperStyle} className={className} title="JSON">
          <SiJson size={size} color="#CBCB41" />
        </span>
      );
    case 'markdown':
      return (
        <span style={wrapperStyle} className={className} title="Markdown">
          <SiMarkdown size={size} color="#42A5F5" />
        </span>
      );
    default:
      return (
        <span style={wrapperStyle} className={className} title="Code">
          <FileCode2 size={size} color="#8b949e" />
        </span>
      );
  }
}
