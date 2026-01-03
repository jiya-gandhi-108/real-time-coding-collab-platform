// src/pages/RoomWrapper.js
import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Room from '../components/Room';

export default function RoomWrapper() {
  const { roomId } = useParams();
  const location = useLocation();
  const projectName = location.state?.projectName || 'Untitled Project';
  const userName = location.state?.userName || 'User';

  return (
    <Room
      roomId={roomId}
      userName={userName}
      projectName={projectName}
      isAdmin={false}
    />
  );
}
