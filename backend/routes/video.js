const express = require('express');
const router = express.Router();
const { generateUploadUrl, confirmUpload } = require('../controllers/video');

router.post('/upload-url', generateUploadUrl);
router.post('/confirm-upload', confirmUpload);

module.exports = router;
