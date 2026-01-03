import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import Editor from './Editor';
import Chat from './Chat';
import '../styles/room.css';

const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export default function Room({
  roomId: propRoomId,
  userName, 
  projectName,
  isAdmin = false,
}) {
  const navigate = useNavigate();

  const [files, setFiles] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set(['root']));
  const [activeFile, setActiveFile] = useState(null);
  const [users, setName] = useState([]);
  const [filesContent, setFilesContent] = useState({});
  const [editingUser, setEditingUser] = useState(null);
  const [currentRoomId, setCurrentRoomId] = useState(propRoomId || '');
  const [currentRoomPassword, setCurrentRoomPassword] = useState('');
  const [stripNotifications, setStripNotifications] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [projectFolderName, setProjectFolderName] = useState(projectName || propRoomId);

  const lastEditingTimeoutRef = useRef(null);

  const addStripNotification = useCallback((msg) => {
    const id = Date.now();
    setStripNotifications([{ id, message: msg }]);
    setTimeout(
      () => setStripNotifications((prev) => prev.filter((n) => n.id !== id)),
      4000
    );
  }, []);

  const resetEditingUserTimeout = () => {
    clearTimeout(lastEditingTimeoutRef.current);
    lastEditingTimeoutRef.current = setTimeout(
      () => setEditingUser(null),
      3000
    );
  };

  const handleLeaveRoom = useCallback(() => {
    socket.emit('leave-room', { roomId: propRoomId });
    navigate('/');
  }, [propRoomId, navigate]);

  const emitCodeChange = useCallback(
    debounce((path, code) => {
      socket.emit('code-change', {
        roomId: propRoomId,
        filename: path,
        code,
      });
    }, 200),
    [propRoomId]
  );

  useEffect(() => {
    if (!propRoomId) return;

    socket.emit('join-room', { roomId: propRoomId, isAdmin, projectName });

    socket.on('room-data', ({
      fileTree,
      activeFile: af,
      users: us,
      files,
      roomId,
      roomPassword,
      projectName,
    }) => {
      if (fileTree) setFiles(fileTree);
      if (af) setActiveFile(af);
      if (us) setName(us);
      if (files) setFilesContent(files);
      if (roomId) setCurrentRoomId(roomId);
      if (roomPassword) setCurrentRoomPassword(roomPassword);
      if (projectName) setProjectFolderName(projectName);
    });


    socket.on('user-list', (us) => setName(us || []));

    socket.on('user-editing', ({ users }) => {
      setEditingUser(users);
      resetEditingUserTimeout();
    });

    socket.on('user-joined', ({ users }) => {
      addStripNotification(`${users} joined the room`);
    });

    socket.on('user-left', ({ users }) => {
      addStripNotification(`${users} left the room`);
    });


    return () => {
      socket.off('user-editing');
      socket.off('user-joined');
      socket.off('user-left');
    };
  }, [propRoomId, isAdmin, addStripNotification, projectName, navigate]);

  const handleCodeChange = useCallback(
    (code) => {
      if (!activeFile) return;

      setFilesContent((prev) => ({
        ...prev,
        [activeFile]: { ...prev[activeFile], code },
      }));

      emitCodeChange(activeFile, code);

      socket.emit('user-editing', { roomId: propRoomId });
    },
    [activeFile, emitCodeChange, propRoomId]
  );

  const toggleFolder = (folderPath) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) next.delete(folderPath);
      else next.add(folderPath);
      return next;
    });
  };

  const handleCreateFolder = () => {
    const name = prompt('Folder name?');
    if (!name) return;
    socket.emit('create-folder', { roomId: propRoomId, path: name.trim() });
  };

  const handleCreateFile = () => {
    const folder = prompt('In which folder? (leave empty for project root)');
    const name = prompt('File name? (e.g. index.js)');
    if (!name) return;
    const fullPath = folder?.trim()
      ? `${folder.trim()}/${name.trim()}`
      : `${projectFolderName}/${name.trim()}`;
    socket.emit('create-file', { roomId: propRoomId, path: fullPath });
  };

  const handleFileSwitch = (path) => {
    setActiveFile(path);
    socket.emit('switch-file', { roomId: propRoomId, path });
  };

  const currentFile =
    filesContent[activeFile] || { code: '', language: 'javascript' };

  const renderTree = (node, expandedFoldersSet) => {
    if (!node) return null;

    const isRoot = node.path === root;
    const isExpanded = expandedFoldersSet.has(node.path);
    const shouldShowChildren = isRoot || isExpanded;

    if (node.type === 'file') {
      return (
        <div
          key={node.path}
          className={`tree-item file ${
            activeFile === node.path ? 'active' : ''
          }`}
          onClick={() => handleFileSwitch(node.path)}
        >
          {node.name}
        </div>
      );
    }

    return (
      <div
        key={node.path}
        className={`tree-folder ${isExpanded ? 'expanded' : ''}`}
      >
        <div
          className="tree-folder-header"
          onClick={() => !isRoot && toggleFolder(node.path)}
        >
          <span className="tree-toggle">
            {isRoot ? '' : isExpanded ? '▾' : '▸'}
          </span>
          <span className="tree-folder-name">{node.name}</span>
        </div>
        {shouldShowChildren &&
          node.children?.map((child) =>
            renderTree(child, expandedFoldersSet)
          )}
      </div>
    );
  };

  return (
    <div className="room">
      <div className="room-strip">
        <div className="room-strip-left">
          <div className="jr-logo">
          <span className="jr-logo-mark">◼</span>
          <span className="jr-logo-text">code-collab</span>
        </div>
          <button className="strip-link">File</button>
          <button className="strip-link" onClick={handleCreateFolder}>
            Create folder
          </button>
          <button className="strip-link" onClick={handleCreateFile}>
            Create file
          </button>
          <span className="room-details">
            Room: <strong>{currentRoomId || propRoomId}</strong>
            {currentRoomPassword && (
              <>
                {' '}
                • Pass: <strong>{currentRoomPassword}</strong>
              </>
            )}
          </span>
        </div>

        <div className="room-strip-center">
          <span className="room-strip-project">{projectFolderName}</span>
        </div>

        <div className="room-strip-right">
          <button
            className="leave-room-btn"
            onClick={handleLeaveRoom}
            title="Leave room"
          >
            Leave
          </button>

          <button
            className={`chat-toggle-btn ${isChatOpen ? 'open' : ''}`}
            onClick={() => setIsChatOpen(!isChatOpen)}
            title="Toggle chat"
          >
            💬
          </button>

          {stripNotifications.map(({ id, message }) => (
            <div key={id} className="strip-notification">
              {message}
            </div>
          ))}
        </div>
      </div>

      <div className="room-body">
        <aside className="room-sidebar">
          <div className="tree-root">
            {files && renderTree(files, expandedFolders)}
          </div>
        </aside>

        <main className="room-editor-area">
          <div className="room-editor-card">
            <div className="room-editor-toolbar">
              <span className="room-editor-title">
                {activeFile || 'No file selected'}
              </span>
            </div>
            <div className="room-editor-body">
              <Editor
                code={currentFile.code}
                language={currentFile.language}
                onChange={handleCodeChange}
              />
            </div>
          </div>
        </main>
      </div>

      {isChatOpen && (
        <aside className={`room-chat-overlay ${isChatOpen ? 'open' : ''}`}>
          <Chat roomId={propRoomId} userName={userName} />
        </aside>
      )}

      {editingUser && (
        <div className="editing-popup-strip-style">
          <span>{editingUser} is editing…</span>
        </div>
      )}
    </div>
  );
}
