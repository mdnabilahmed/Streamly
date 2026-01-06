const express = require('express');
const router = express.Router();
const { generateUploadUrl, confirmUpload, getAllVideos, streamVideo } = require('../controllers/video');
const checkRole = require('../middlewares/checkRole');

router.get('/', getAllVideos);
router.get('/:videoId/stream', streamVideo);
router.post('/upload-url', checkRole(['editor', 'admin']), generateUploadUrl);
router.post('/confirm-upload', checkRole(['editor', 'admin']), confirmUpload);

module.exports = router;
