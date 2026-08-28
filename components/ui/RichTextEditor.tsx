"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

type ToolbarState = {
  bold: boolean;
  underline: boolean;
  unorderedList: boolean;
  orderedList: boolean;
};

const defaultToolbarState: ToolbarState = {
  bold: false,
  underline: false,
  unorderedList: false,
  orderedList: false,
};

function toolbarButtonClass(active: boolean) {
  return `rounded px-2.5 py-1 text-sm font-semibold transition-colors ${
    active
      ? "bg-primary text-white"
      : "text-muted hover:bg-white hover:text-foreground"
  }`;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter description...",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);
  const [toolbar, setToolbar] = useState<ToolbarState>(defaultToolbarState);

  const isSelectionInsideEditor = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return false;
    const node = selection.anchorNode;
    return !!node && editor.contains(node);
  }, []);

  const updateToolbar = useCallback(() => {
    if (!isSelectionInsideEditor()) {
      setToolbar(defaultToolbarState);
      return;
    }

    setToolbar({
      bold: document.queryCommandState("bold"),
      underline: document.queryCommandState("underline"),
      unorderedList: document.queryCommandState("insertUnorderedList"),
      orderedList: document.queryCommandState("insertOrderedList"),
    });
  }, [isSelectionInsideEditor]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el || syncingRef.current) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value;
    }
  }, [value]);

  useEffect(() => {
    const onSelectionChange = () => {
      updateToolbar();
    };

    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, [updateToolbar]);

  const syncContent = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    syncingRef.current = true;
    onChange(el.innerHTML);
    syncingRef.current = false;
    updateToolbar();
  }, [onChange, updateToolbar]);

  const exec = (command: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();

    // Ensure there is a block to format when the editor is empty.
    if (!editor.textContent?.trim()) {
      document.execCommand("insertParagraph", false);
    }

    document.execCommand(command, false);
    syncContent();
  };

  const handleToolbarMouseDown = (event: React.MouseEvent) => {
    // Keep the editor selection when clicking toolbar buttons.
    event.preventDefault();
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex flex-wrap gap-1 border-b border-border bg-surface px-2 py-1.5">
        <button
          type="button"
          className={toolbarButtonClass(toolbar.bold)}
          onMouseDown={handleToolbarMouseDown}
          onClick={() => exec("bold")}
          aria-label="Bold"
          aria-pressed={toolbar.bold}
        >
          B
        </button>
        <button
          type="button"
          className={`${toolbarButtonClass(toolbar.underline)} ${
            toolbar.underline ? "" : "underline"
          }`}
          onMouseDown={handleToolbarMouseDown}
          onClick={() => exec("underline")}
          aria-label="Underline"
          aria-pressed={toolbar.underline}
        >
          U
        </button>
        <button
          type="button"
          className={toolbarButtonClass(toolbar.unorderedList)}
          onMouseDown={handleToolbarMouseDown}
          onClick={() => exec("insertUnorderedList")}
          aria-label="Bullet list"
          aria-pressed={toolbar.unorderedList}
        >
          • List
        </button>
        <button
          type="button"
          className={toolbarButtonClass(toolbar.orderedList)}
          onMouseDown={handleToolbarMouseDown}
          onClick={() => exec("insertOrderedList")}
          aria-label="Numbered list"
          aria-pressed={toolbar.orderedList}
        >
          1. List
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        onInput={syncContent}
        onKeyUp={updateToolbar}
        onMouseUp={updateToolbar}
        onFocus={updateToolbar}
        data-placeholder={placeholder}
        className="rich-text-editor min-h-[150px] px-3 py-2.5 text-sm text-foreground focus:outline-none [&:empty]:before:pointer-events-none [&:empty]:before:text-muted [&:empty]:before:content-[attr(data-placeholder)]"
      />
    </div>
  );
}
