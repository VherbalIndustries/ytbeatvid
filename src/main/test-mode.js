const path = require('path');
const fs = require('fs');

class TestMode {
  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development' || process.env.TEST_MODE === 'true';
    this.mockFiles = this.createMockFiles();
  }

  createMockFiles() {
    return {
      audio: {
        'test-beat.mp3': {
          duration: 180, // 3 minutes
          sampleRate: 44100,
          channels: 2,
          bitrate: 320000,
          format: 'mp3'
        },
        'demo-track.wav': {
          duration: 240, // 4 minutes
          sampleRate: 48000,
          channels: 2,
          bitrate: 1536000,
          format: 'wav'
        }
      },
      video: {
        'test-output.mp4': {
          duration: 180,
          resolution: '1920x1080',
          fps: 30,
          codec: 'h264'
        }
      }
    };
  }

  async processAudioFile(filePath) {
    if (!this.isEnabled) {
      throw new Error('Test mode not enabled');
    }

    const fileName = path.basename(filePath);
    const mockData = this.mockFiles.audio[fileName] || this.mockFiles.audio['test-beat.mp3'];

    console.log(`[TEST MODE] Processing audio file: ${fileName}`);

    // Simulate processing delay
    await this.delay(1000);

    // Generate mock audio data (sine wave for testing)
    const sampleCount = mockData.sampleRate * mockData.duration;
    const audioData = [];
    
    for (let i = 0; i < sampleCount; i++) {
      // Generate a simple sine wave with some variation
      const time = i / mockData.sampleRate;
      const frequency = 440 + Math.sin(time * 0.5) * 220; // Varying frequency
      const amplitude = 0.3 * Math.sin(time * 2 * Math.PI * 0.1); // Varying amplitude
      const sample = amplitude * Math.sin(2 * Math.PI * frequency * time);
      audioData.push(sample);
    }

    return {
      success: true,
      filePath,
      metadata: mockData,
      audioData,
      duration: mockData.duration,
      sampleRate: mockData.sampleRate
    };
  }

  async generateMockVideo(options) {
    if (!this.isEnabled) {
      throw new Error('Test mode not enabled');
    }

    console.log('[TEST MODE] Generating mock video with options:', options);

    // Simulate video rendering progress
    const totalFrames = (options.duration || 180) * (options.fps || 30);
    
    for (let frame = 0; frame <= totalFrames; frame += Math.floor(totalFrames / 10)) {
      const progress = (frame / totalFrames) * 100;
      
      if (options.onProgress) {
        options.onProgress({
          current: frame,
          total: totalFrames,
          percent: progress,
          phase: frame < totalFrames ? 'rendering' : 'finalizing'
        });
      }
      
      await this.delay(200); // Simulate frame rendering time
    }

    const outputPath = options.outputPath || path.join(process.cwd(), 'test-output.mp4');
    
    // Create a mock output file (empty file for testing)
    fs.writeFileSync(outputPath, 'Mock video file content');

    return {
      success: true,
      outputPath,
      duration: options.duration || 180,
      resolution: options.resolution || '1920x1080',
      fps: options.fps || 30,
      fileSize: 1024 * 1024 * 50 // 50MB mock size
    };
  }

  async mockYouTubeUpload(videoPath, metadata) {
    if (!this.isEnabled) {
      throw new Error('Test mode not enabled');
    }

    console.log('[TEST MODE] Mock YouTube upload:', { videoPath, metadata });

    // Simulate upload progress
    const steps = ['Preparing upload', 'Uploading video', 'Processing', 'Publishing'];
    
    for (let i = 0; i < steps.length; i++) {
      console.log(`[TEST MODE] ${steps[i]}...`);
      await this.delay(1500);
    }

    const mockVideoId = 'dQw4w9WgXcQ'; // Rick Roll video ID for testing
    
    return {
      success: true,
      videoId: mockVideoId,
      url: `https://www.youtube.com/watch?v=${mockVideoId}`,
      title: metadata.title,
      status: 'published',
      uploadTime: new Date().toISOString()
    };
  }

  async mockFFmpegCheck() {
    return {
      installed: true,
      version: 'Mock FFmpeg v4.4.0 (Test Mode)',
      path: '/mock/path/to/ffmpeg',
      testMode: true
    };
  }

  async mockGetEncoders() {
    return {
      cpu: ['libx264', 'libx265'],
      gpu: [
        { name: 'h264_videotoolbox', type: 'macOS' },
        { name: 'hevc_videotoolbox', type: 'macOS' }
      ],
      testMode: true
    };
  }

  generateMockBeatMetadata(fileName) {
    const mockGenres = ['Hip Hop', 'Trap', 'R&B', 'Pop', 'Lo-Fi'];
    const mockKeys = ['C Major', 'G Major', 'D Major', 'A Minor', 'E Minor'];
    const mockBPMs = [70, 80, 90, 100, 110, 120, 130, 140, 150];

    return {
      beatName: fileName.replace(/\.[^/.]+$/, ''), // Remove extension
      producerName: 'Test Producer',
      genre: mockGenres[Math.floor(Math.random() * mockGenres.length)],
      key: mockKeys[Math.floor(Math.random() * mockKeys.length)],
      bpm: mockBPMs[Math.floor(Math.random() * mockBPMs.length)],
      year: new Date().getFullYear(),
      tags: ['beat', 'instrumental', 'test'],
      testMode: true
    };
  }

  async createTestJob(jobData) {
    const mockJob = {
      id: Date.now(),
      ...jobData,
      status: 'pending',
      progress: 0,
      created_at: new Date().toISOString(),
      testMode: true
    };

    console.log('[TEST MODE] Created test job:', mockJob);
    return mockJob;
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isTestModeEnabled() {
    return this.isEnabled;
  }

  getTestNotice() {
    return this.isEnabled ? '🧪 Running in Test Mode - No actual uploads will occur' : null;
  }
}

module.exports = TestMode;