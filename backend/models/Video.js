const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  fileName: {
    type: String,
    required: true
  },
  s3Key: {
    type: String,
    required: true,
    unique: true
  },
  s3Bucket: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  size: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'uploaded', 'processing', 'safe', 'flagged', 'failed'],
    default: 'pending'
  },
  analysisResult: {
    type: Object,
    default: null
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Video', videoSchema);
