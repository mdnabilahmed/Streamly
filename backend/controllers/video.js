const { s3Client, BUCKET_NAME, getSignedUrl, PutObjectCommand } = require('../utils/aws');
const { v4: uuidv4 } = require('uuid');
const Video = require('../models/Video');
const { HeadObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { processVideo } = require('../services/videoProcessing.service');

const generateUploadUrl = async (req, res) => {
    try {
        const { fileName, fileType, fileSize } = req.body;
        // JWT Middleware is adding this using JWT
        const userId = req.user ? req.user.id : 'default-user';

        // Validate file type
        const allowedTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
        if (!allowedTypes.includes(fileType)) {
            return res.status(400).json({ error: 'Invalid file type' });
        }

        // Validate file size (500MB max)
        const maxSize = 100 * 1024 * 1024;
        if (fileSize > maxSize) {
            return res.status(400).json({ error: 'File size exceeds 100MB limit' });
        }

        // Generate unique file key
        const fileExtension = fileName.split('.')[1] || 'mp4';
        const sanitizedFileName = fileName
            .replace(/\.[^/.]+$/, '') // Remove extension
            .replace(/[^a-zA-Z0-9]/g, '_') // Sanitize
            .substring(0, 50);
        
        const uniqueId = uuidv4();
        const timestamp = Date.now();
        const s3Key = `${uniqueId}_${timestamp}_${sanitizedFileName}.${fileExtension}`;

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            ContentType: fileType,
            Metadata: {
                'user-id': userId.toString(),
                'timestamp': timestamp.toString(),
                'original-filename': fileName
            }
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

        // Create video record in database with 'pending' status
        const video = new Video({
            title: sanitizedFileName,
            fileName: fileName,
            s3Key: s3Key,
            s3Bucket: BUCKET_NAME,
            userId,
            size: fileSize,
            mimeType: fileType,
            status: 'pending',
            uploadedAt: new Date()
        });

        await video.save();

        res.json({
            success: true,
            uploadUrl,
            videoId: video._id,
            s3Key,
            expiresIn: 300
        });
    } catch (error) {
        console.error('Generate upload URL error:', error);
        res.status(500).json({ message: 'Failed to generate upload URL', success: false });
    }
};

// Confirm upload completion
const confirmUpload = async (req, res) => {
  try {
    const { videoId } = req.body;
    const userId = req.user ? req.user.id : 'default-user';

    const video = await Video.findOne({ _id: videoId });

    if (!video) {
      return res.status(404).json({ message: 'Video not found', success: false });
    }

    // Verify file exists in S3
    try {
        const command = new HeadObjectCommand({
            Bucket: BUCKET_NAME,
            Key: video.s3Key
        });
        await s3Client.send(command);
    } catch (error) {
        console.error("S3 HeadObject Error:", error);
        return res.status(400).json({ message: 'Video not found in S3. Upload may have failed.', success: false });
    }

    // Update video metadata
    video.status = 'uploaded';
    await video.save();

    // Emit socket event for upload completion
    if (req.io) {
        req.io.to(`user-${userId}`).emit('upload-complete', {
            videoId: video._id,
            message: 'Video uploaded successfully. Processing will begin shortly.'
        });
    }

    // Start video processing (asynchronously)
    // Pass socket info or allow service to determine how to connect/emit
    // Since Python script connects independently, we just spawn it.
    processVideo(video._id, video.s3Key, userId).catch(err => {
        console.error('Processing error:', err);
    });

    res.json({
        success: true,
        message: 'Upload confirmed and analysis started',
        video: {
            id: video._id,
            title: video.title,
            status: video.status
        }
    });
    } catch (error) {
        console.error('Confirm upload error:', error);
        res.status(500).json({ message: 'Failed to confirm upload', success: false });
    }
};

const getAllVideos = async (req, res) => {
    try {
        const videos = await Video.find().sort({ createdAt: -1 });
        res.json({ success: true, videos });
    } catch (error) {
        console.error('Get all videos error:', error);
        res.status(500).json({ message: 'Failed to fetch videos', success: false });
    }
};

const streamVideo = async (req, res) => {
    try {
        const { videoId } = req.params;
        const video = await Video.findById(videoId);

        if (!video) {
            return res.status(404).json({ message: 'Video not found', success: false });
        }

        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: video.s3Key
        });

        const streamUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

        res.json({
            success: true,
            streamUrl,
            videoId: video._id,
            title: video.title
        });
    } catch (error) {
        console.error('Stream video error:', error);
        res.status(500).json({ message: 'Failed to generate stream URL', success: false });
    }
};

module.exports = { generateUploadUrl, confirmUpload, getAllVideos, streamVideo };