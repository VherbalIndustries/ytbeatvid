const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const { getEncoders, getOptimalEncoder } = require('./utils');

async function renderVideo(options, onProgress) {
  const {
    audioPath,
    imagePath,
    outputPath,
    resolution = '1920x1080',
    fps = 30,
    bitrate = '8000k',
    audioCodec = 'aac',
    audioBitrate = '320k'
  } = options;

  const encoders = await getEncoders();
  const encoder = getOptimalEncoder(encoders);

  return new Promise((resolve, reject) => {
    const command = ffmpeg()
      .input(imagePath)
      .loop()
      .input(audioPath)
      .videoCodec(encoder)
      .videoBitrate(bitrate)
      .size(resolution)
      .fps(fps)
      .audioCodec(audioCodec)
      .audioBitrate(audioBitrate)
      .outputOptions([
        '-shortest',
        '-pix_fmt yuv420p',
        '-movflags +faststart'
      ]);

    // Add GPU-specific options
    if (encoder.includes('nvenc')) {
      command.outputOptions([
        '-preset p4',
        '-tune hq',
        '-rc vbr',
        '-cq 23'
      ]);
    } else if (encoder.includes('videotoolbox')) {
      command.outputOptions([
        '-profile:v high',
        '-level:v 4.2'
      ]);
    }

    command
      .on('progress', (progress) => {
        if (onProgress) {
          onProgress({
            percent: progress.percent,
            timemark: progress.timemark,
            fps: progress.currentFps
          });
        }
      })
      .on('end', () => {
        resolve({ success: true, outputPath });
      })
      .on('error', (err) => {
        reject(err);
      })
      .save(outputPath);
  });
}

async function renderFromFrames(frameDir, audioPath, outputPath, options = {}) {
  const {
    fps = 30,
    resolution = '1920x1080',
    bitrate = '8000k',
    audioCodec = 'aac',
    audioBitrate = '320k'
  } = options;

  const encoders = await getEncoders();
  const encoder = getOptimalEncoder(encoders);

  return new Promise((resolve, reject) => {
    const command = ffmpeg()
      .input(`${frameDir}/frame_%06d.png`)
      .inputFPS(fps)
      .input(audioPath)
      .videoCodec(encoder)
      .videoBitrate(bitrate)
      .size(resolution)
      .fps(fps)
      .audioCodec(audioCodec)
      .audioBitrate(audioBitrate)
      .outputOptions([
        '-shortest',
        '-pix_fmt yuv420p',
        '-movflags +faststart'
      ]);

    // Add GPU-specific options
    if (encoder.includes('nvenc')) {
      command.outputOptions([
        '-preset p4',
        '-tune hq',
        '-rc vbr',
        '-cq 23'
      ]);
    } else if (encoder.includes('videotoolbox')) {
      command.outputOptions([
        '-profile:v high',
        '-level:v 4.2'
      ]);
    }

    command
      .on('progress', (progress) => {
        console.log(`Encoding progress: ${progress.percent}%`);
      })
      .on('end', () => {
        resolve({ success: true, outputPath });
      })
      .on('error', (err) => {
        reject(err);
      })
      .save(outputPath);
  });
}

module.exports = {
  renderVideo,
  renderFromFrames
};