import React, { useRef, useEffect, useCallback } from 'react';
import EditorComponent from '@monaco-editor/react';

export default function Editor({ code = '', language = 'javascript', onChange, onCursorChange, cursors = {} }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.onDidChangeCursorPosition(() => {
      if (!editorRef.current || !onCursorChange) return;
      const position = editorRef.current.getPosition();
      if (position) {
        onCursorChange({ line: position.lineNumber, column: position.column });
      }
    });

    updateCursorDecorations();
  }, [onCursorChange]);

  const updateCursorDecorations = useCallback(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const monaco = monacoRef.current;
    
    const safeCursors = cursors || {};
    const cursorEntries = Object.entries(safeCursors);
    
    const decorations = cursorEntries.map(([userId, cursorData]) => {
      const { pos, name } = cursorData || {};
      if (!pos || !pos.line || !pos.column) return null;

      return {
        range: new monaco.Range(pos.line, pos.column, pos.line, pos.column),
        options: {
          className: 'remote-cursor',
          afterContentClassName: 'remote-cursor-label',
          after: {
            contentText: ` ${name || 'User'}`,
            inlineClassName: 'remote-cursor-name',
          },
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      };
    }).filter(Boolean);

    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current || [],
      decorations
    );
  }, [cursors]);

  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      updateCursorDecorations();
    }
  }, [cursors, updateCursorDecorations]);

  useEffect(() => {
    return () => {
      if (editorRef.current && decorationsRef.current) {
        editorRef.current.deltaDecorations(decorationsRef.current, []);
      }
    };
  }, []);

  return (
    <EditorComponent
      height="80vh"
      language={language}
      value={code}
      onChange={onChange}
      onMount={handleEditorDidMount}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        cursorBlinking: 'smooth',
        renderWhitespace: 'all',
      }}
    />
  );
}
