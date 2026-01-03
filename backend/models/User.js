// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  recentRooms: [
    {
      roomId: String,
      projectName: String,
      joinedAt: Date,
      files: [String],
    },
  ],
});

// IMPORTANT: export the model itself
module.exports = mongoose.model('User', userSchema);
