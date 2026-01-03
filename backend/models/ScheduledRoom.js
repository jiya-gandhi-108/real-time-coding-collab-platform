const mongoose = require('mongoose');

const scheduledRoomSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roomId: { type: String, required: true },
  projectName: { type: String, required: true },
  scheduledAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ScheduledRoom', scheduledRoomSchema);
