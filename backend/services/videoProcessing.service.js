const { spawn } = require('child_process');
const path = require('path');
const Video = require('../models/Video');

const processVideo = async (videoId, s3Key, userId) => {
  return new Promise((resolve, reject) => {
    console.log(`Starting processing for video ${videoId}`);

    // Update status to processing
    Video.findByIdAndUpdate(videoId, { status: 'processing' }).exec();

    const scriptPath = path.join(__dirname, '../ml-services/sensitivity_analysis.py');
    const pythonProcess = spawn('python', [
        scriptPath,
        '--videoId', videoId,
        '--s3Key', s3Key,
        '--userId', userId,
        '--socketUrl', 'http://localhost:8080' // Assuming default local URL, should be env var in prod
    ]);

    pythonProcess.stdout.on('data', (data) => {
      console.log(`[Python Script]: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`[Python Error]: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      console.log(`Child process exited with code ${code}`);
      if (code === 0) {
        resolve();
      } else {
        Video.findByIdAndUpdate(videoId, { status: 'failed' }).exec();
        reject(new Error(`Process exited with code ${code}`));
      }
    });
  });
};

module.exports = { processVideo };
