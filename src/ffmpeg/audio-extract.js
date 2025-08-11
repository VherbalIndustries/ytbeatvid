const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function extractAudioData(audioPath) {
  return new Promise((resolve, reject) => {
    const tempFile = path.join(os.tmpdir(), `audio_${Date.now()}.f32le`);
    const audioData = [];
    
    ffmpeg(audioPath)
      .outputOptions([
        '-f f32le',  // 32-bit float PCM
        '-ac 1',     // Mono
        '-ar 44100'  // 44.1kHz sample rate
      ])
      .on('error', reject)
      .on('end', () => {
        // Read the raw PCM data
        const buffer = fs.readFileSync(tempFile);
        
        // Convert to float array
        for (let i = 0; i < buffer.length; i += 4) {
          audioData.push(buffer.readFloatLE(i));
        }
        
        // Cleanup temp file
        fs.unlinkSync(tempFile);
        
        resolve(audioData);
      })
      .save(tempFile);
  });
}

async function getAudioDuration(audioPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        resolve(metadata.format.duration);
      }
    });
  });
}

async function getAudioMetadata(audioPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
        resolve({
          duration: metadata.format.duration,
          sampleRate: audioStream.sample_rate,
          channels: audioStream.channels,
          bitrate: metadata.format.bit_rate,
          codec: audioStream.codec_name
        });
      }
    });
  });
}

module.exports = {
  extractAudioData,
  getAudioDuration,
  getAudioMetadata
};