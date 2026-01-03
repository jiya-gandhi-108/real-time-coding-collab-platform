import React from 'react';

export default function Notification({ message }) {
  return (
    <div className="notification">
      <span>{message}</span>
    </div>
  );
}
