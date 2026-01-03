import React, { useEffect, useState } from 'react';
import { socket } from '../socket';

export default function Chat({ roomId, userName }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!roomId || !userName) return;

    const handleMessage = (msg) => {
      if (msg.roomId !== roomId) return;
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('chat-message', handleMessage);

    return () => {
      socket.off('chat-message', handleMessage);
    };
  }, [roomId, userName]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;

    const msg = {
      roomId,
      userName,
      text,
      createdAt: Date.now(),
    };

    socket.emit('chat-message', msg);
    setMessages((prev) => [...prev, msg]);
    setMessage('');
  };

  return (
    <div className="chat">
      <div className="chat-messages">
  {messages.map((m, index) => (
    <div
      key={index}
      className={`chat-message-row ${m.userName === userName ? 'me' : 'other'}`}
    >
      <div className="chat-message-meta">
        <span className="chat-username">{m.userName}</span>
      </div>
      <div className={`chat-bubble ${m.userName === userName ? 'me' : 'other'}`}>
        {m.text}
      </div>
    </div>
  ))}
</div>


      <form className="chat-input-bar" onSubmit={handleSend}>
        <input
          type="text"
          className="chat-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" className="chat-send-btn">
          ➤
        </button>
      </form>
    </div>
  );
}
