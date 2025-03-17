"use client";

import { useState, useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";

interface PoetryEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  height?: string;
  readOnly?: boolean;
}

const PoetryEditor: React.FC<PoetryEditorProps> = ({
  value,
  onChange,
  placeholder = "Write your poetry here...",
  className,
  height = "200px",
  readOnly = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const isComposing = useRef(false);

  // Handle focus events
  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  // Handle content changes
  const handleInput = () => {
    if (editorRef.current && !isComposing.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Set initial content only once
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML === '') {
      editorRef.current.innerHTML = value;
    }
  }, []);

  // Format options
  const applyFormat = (command: string, value?: string) => {
    if (document) {
      document.execCommand(command, false, value);
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }
  };

  return (
    <div className="inline-block w-full">
      <div
        className={twMerge(
          "border border-slate-500 rounded-lg overflow-hidden",
          isFocused ? "ring-2 ring-slate-400" : "",
          className
        )}
      >
        {/* Simple toolbar */}
        <div className="flex flex-wrap gap-1 p-2 border-b border-slate-300 bg-slate-50">
          <button
            type="button"
            onClick={() => applyFormat("bold")}
            className="p-1 hover:bg-slate-200 rounded"
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => applyFormat("italic")}
            className="p-1 hover:bg-slate-200 rounded"
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => applyFormat("underline")}
            className="p-1 hover:bg-slate-200 rounded"
            title="Underline"
          >
            <u>U</u>
          </button>
          <div className="h-6 w-px bg-slate-300 mx-1"></div>
          <button
            type="button"
            onClick={() => applyFormat("formatBlock", "<h2>")}
            className="p-1 hover:bg-slate-200 rounded"
            title="Heading"
          >
            H
          </button>
          <div className="h-6 w-px bg-slate-300 mx-1"></div>
          <button
            type="button"
            onClick={() => applyFormat("justifyLeft")}
            className="p-1 hover:bg-slate-200 rounded"
            title="Align Left"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => applyFormat("justifyCenter")}
            className="p-1 hover:bg-slate-200 rounded"
            title="Align Center"
          >
            ↔
          </button>
          <button
            type="button"
            onClick={() => applyFormat("justifyRight")}
            className="p-1 hover:bg-slate-200 rounded"
            title="Align Right"
          >
            →
          </button>
          <div className="h-6 w-px bg-slate-300 mx-1"></div>
          <button
            type="button"
            onClick={() => applyFormat("indent")}
            className="p-1 hover:bg-slate-200 rounded"
            title="Indent"
          >
            →|
          </button>
          <button
            type="button"
            onClick={() => applyFormat("outdent")}
            className="p-1 hover:bg-slate-200 rounded"
            title="Outdent"
          >
            |←
          </button>
        </div>

        {/* Editable content area */}
        <div
          ref={editorRef}
          contentEditable={!readOnly}
          className="p-3 outline-none"
          style={{ height, minHeight: height, overflowY: "auto" }}
          onInput={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          data-placeholder={placeholder}
          onCompositionStart={() => { isComposing.current = true; }}
          onCompositionEnd={() => { 
            isComposing.current = false; 
            handleInput();
          }}
        />
      </div>
    </div>
  );
};

export default PoetryEditor;