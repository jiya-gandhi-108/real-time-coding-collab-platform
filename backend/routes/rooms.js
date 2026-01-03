const express = require('express');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const User = require('../models/User');
const ScheduledRoom = require('../models/ScheduledRoom');

const router = express.Router();

async function addRecentRoom(userId, { roomId, projectName, files = [] }) {
  const user = await User.findById(userId);
  if (!user) return;
  const entry = {
    roomId,
    projectName,
    joinedAt: new Date(),
    files,
  };
  user.recentRooms.unshift(entry);
  user.recentRooms = user.recentRooms.slice(0, 6);
  await user.save();
}

router.post('/create', auth, async (req, res) => {
  try {
    const { projectName, customRoomId } = req.body;
    if (!projectName) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const roomId = customRoomId && customRoomId.trim() !== ''
      ? customRoomId.trim()
      : uuidv4().slice(0, 8);

    await addRecentRoom(req.user.id, { roomId, projectName, files: [] });

    res.json({ roomId, projectName });
  } catch (err) {
    console.error('CREATE ROOM ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/schedule', auth, async (req, res) => {
  try {
    const { projectName, scheduledAt, customRoomId } = req.body;
    if (!projectName || !scheduledAt) {
      return res
        .status(400)
        .json({ message: 'Project name and date/time are required' });
    }

    const roomId = customRoomId && customRoomId.trim() !== ''
      ? customRoomId.trim()
      : uuidv4().slice(0, 8);

    const doc = await ScheduledRoom.create({
      owner: req.user.id,
      roomId,
      projectName,
      scheduledAt: new Date(scheduledAt),
    });

    res.json(doc);
  } catch (err) {
    console.error('SCHEDULE ROOM ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/scheduled', auth, async (req, res) => {
  try {
    const list = await ScheduledRoom.find({ owner: req.user.id })
      .sort({ scheduledAt: 1 });
    res.json(list);
  } catch (err) {
    console.error('GET SCHEDULED ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/recent', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('recentRooms');
    res.json(user?.recentRooms || []);
  } catch (err) {
    console.error('GET RECENT ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
