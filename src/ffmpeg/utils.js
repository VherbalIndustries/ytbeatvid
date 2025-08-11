const ffmpeg = require('fluent-ffmpeg');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function checkFFmpeg() {
  try {
    await execAsync('ffmpeg -version');
    return { installed: true, version: await getFFmpegVersion() };
  } catch (error) {
    return { installed: false, error: 'FFmpeg not found' };
  }
}

async function getFFmpegVersion() {
  try {
    const { stdout } = await execAsync('ffmpeg -version');
    const match = stdout.match(/ffmpeg version ([\d.]+)/);
    return match ? match[1] : 'unknown';
  } catch {
    return 'unknown';
  }
}

async function getEncoders() {
  const encoders = {
    cpu: ['libx264', 'libx265'],
    gpu: []
  };

  // Check for GPU encoders
  const gpuEncoders = [
    { name: 'h264_nvenc', type: 'NVIDIA' },
    { name: 'hevc_nvenc', type: 'NVIDIA' },
    { name: 'h264_videotoolbox', type: 'macOS' },
    { name: 'hevc_videotoolbox', type: 'macOS' },
    { name: 'h264_vaapi', type: 'Intel' }
  ];

  for (const encoder of gpuEncoders) {
    try {
      const { stdout } = await execAsync(`ffmpeg -hide_banner -encoders | grep ${encoder.name}`);
      if (stdout.includes(encoder.name)) {
        encoders.gpu.push({ name: encoder.name, type: encoder.type });
      }
    } catch {
      // Encoder not available
    }
  }

  return encoders;
}

function getOptimalEncoder(encoders) {
  // Prefer GPU encoders
  if (encoders.gpu.length > 0) {
    // Prefer platform-specific encoders
    if (process.platform === 'darwin') {
      const vtEncoder = encoders.gpu.find(e => e.name.includes('videotoolbox'));
      if (vtEncoder) return vtEncoder.name;
    }
    return encoders.gpu[0].name;
  }
  return 'libx264'; // Fallback to CPU
}

module.exports = {
  checkFFmpeg,
  getFFmpegVersion,
  getEncoders,
  getOptimalEncoder
};