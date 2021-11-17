const { Schema, model } = require('mongoose');

const ReminderSchema = Schema({
  name: {
    type: String,
    required: true
  },
  channelId: {
    type: String,
    required: true
  },
  channel: String,
  message: String,
  timer: {
    type: Number,
    default: 2
  },
  savedName: String,
  savedAvatar: String,
  date: {
    type: Date,
    default: Date.now()
  }
});

module.exports = model('Twitch', ReminderSchema);
