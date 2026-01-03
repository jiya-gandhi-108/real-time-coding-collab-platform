import React, { useState } from 'react';

export default function FileTabs({ files = { name: '', type: 'folder', children: [] }, activeFile = '', onFileSwitch, onCreateFile, onDeleteFile, isAdmin }) {
  const [newFolderName, setNewFolderName] = useState('');
  const [newFileName, setNewFileName] = useState('');

  const renderTree = (node, parentPath = '') => {
    if (!node) return null;
    const currentPath = parentPath ? parentPath + '/' + node.name : node.name;

    if (node.type === 'folder') {
      return (
        <div key={currentPath} className="folder-container">
          <div className="folder-name">{node.name}</div>
          <div className="folder-children">
            {node.children.map(child => renderTree(child, currentPath))}
          </div>
        </div>
      );
    } else if (node.type === 'file') {
      return (
        <div
          key={currentPath}
          className={`file-tab ${activeFile === currentPath ? 'active' : ''}`}
          onClick={() => onFileSwitch(currentPath)}
        >
          {node.name}
          {isAdmin && (
            <button
              className="delete-file-btn"
              onClick={e => {
                e.stopPropagation();
                onDeleteFile(currentPath);
              }}
            >
              ×
            </button>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="file-tabs-container">
      <div className="file-tabs">{renderTree(files)}</div>
      <div className="file-actions">
        <input
          type="text"
          placeholder="New folder name"
          className="new-folder-input"
          value={newFolderName}
          onChange={e => setNewFolderName(e.target.value)}
          onKeyPress={e => {
            if (e.key === 'Enter' && newFolderName.trim()) {
              onCreateFile(newFolderName.trim(), 'folder');
              setNewFolderName('');
            }
          }}
        />
        <input
          type="text"
          placeholder="New file name"
          className="new-file-input"
          value={newFileName}
          onChange={e => setNewFileName(e.target.value)}
          onKeyPress={e => {
            if (e.key === 'Enter' && newFileName.trim()) {
              onCreateFile(newFileName.trim(), 'file');
              setNewFileName('');
            }
          }}
        />
        {isAdmin && <span className="admin-badge">ADMIN</span>}
      </div>
    </div>
  );
}
