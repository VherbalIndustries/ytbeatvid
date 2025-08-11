const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const FFT = require('fft.js');
const { storeMemory } = require('../utils/memory');

class OfflineRenderer {
  constructor(options = {}) {
    this.width = options.width || 1920;
    this.height = options.height || 1080;
    this.fps = options.fps || 60;
    this.duration = 0;
    this.audioData = null;
    this.sampleRate = 44100;
    this.frames = [];
    this.tempDir = null;
  }

  async init(audioPath) {
    // Extract audio data for offline processing
    const { extractAudioData } = require('../ffmpeg/audio-extract');
    this.audioData = await extractAudioData(audioPath);
    this.duration = this.audioData.length / this.sampleRate;
    
    // Create temp directory for frames
    this.tempDir = path.join(require('os').tmpdir(), `ytbeat-${Date.now()}`);
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  calculateFFT(frameIndex) {
    const samplesPerFrame = Math.floor(this.sampleRate / this.fps);
    const startSample = frameIndex * samplesPerFrame;
    const fftSize = 2048;
    
    // Get audio window for this frame
    const window = this.audioData.slice(startSample, startSample + fftSize);
    
    // Pad with zeros if needed
    while (window.length < fftSize) {
      window.push(0);
    }
    
    // Perform FFT
    const fft = new FFT(fftSize);
    const spectrum = fft.createComplexArray();
    fft.realTransform(spectrum, window);
    
    // Convert to magnitude
    const magnitudes = [];
    for (let i = 0; i < spectrum.length; i += 2) {
      const real = spectrum[i];
      const imag = spectrum[i + 1];
      magnitudes.push(Math.sqrt(real * real + imag * imag));
    }
    
    return {
      waveform: window,
      spectrum: magnitudes
    };
  }

  renderFrame(frameIndex, visualConfig) {
    const canvas = createCanvas(this.width, this.height);
    const ctx = canvas.getContext('2d');
    
    // Black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, this.width, this.height);
    
    // Get audio analysis for this frame
    const { waveform, spectrum } = this.calculateFFT(frameIndex);
    
    // Render waveform
    if (visualConfig.waveform) {
      this.renderWaveform(ctx, waveform, visualConfig.waveform);
    }
    
    // Render spectrum
    if (visualConfig.spectrum) {
      this.renderSpectrum(ctx, spectrum, visualConfig.spectrum);
    }
    
    // Render overlays
    if (visualConfig.overlays) {
      this.renderOverlays(ctx, frameIndex, visualConfig.overlays);
    }
    
    return canvas;
  }

  renderWaveform(ctx, waveform, config) {
    const centerY = this.height / 2;
    const amplitude = config.amplitude || 100;
    
    ctx.strokeStyle = config.color || '#00ff00';
    ctx.lineWidth = config.lineWidth || 2;
    ctx.beginPath();
    
    const sliceWidth = this.width / waveform.length;
    let x = 0;
    
    for (let i = 0; i < waveform.length; i++) {
      const v = waveform[i] / 32768; // Normalize to -1 to 1
      const y = centerY + v * amplitude;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      
      x += sliceWidth;
    }
    
    ctx.stroke();
  }

  renderSpectrum(ctx, spectrum, config) {
    const barCount = config.barCount || 64;
    const barWidth = (this.width - (barCount - 1) * 2) / barCount;
    const maxHeight = this.height * 0.7;
    
    ctx.fillStyle = config.color || '#ff0000';
    
    const binSize = Math.floor(spectrum.length / barCount);
    
    for (let i = 0; i < barCount; i++) {
      // Average bins for this bar
      let sum = 0;
      for (let j = 0; j < binSize; j++) {
        sum += spectrum[i * binSize + j];
      }
      const average = sum / binSize;
      
      // Normalize and scale
      const normalized = Math.min(average / 1000, 1); // Adjust scale as needed
      const barHeight = normalized * maxHeight;
      
      ctx.fillRect(
        i * (barWidth + 2),
        this.height - barHeight,
        barWidth,
        barHeight
      );
    }
  }

  renderOverlays(ctx, frameIndex, overlays) {
    // Render text overlays, logos, etc.
    overlays.forEach(overlay => {
      if (overlay.type === 'text') {
        ctx.font = overlay.font || '30px Arial';
        ctx.fillStyle = overlay.color || '#ffffff';
        ctx.fillText(
          overlay.text,
          overlay.x || 50,
          overlay.y || 50
        );
      }
      // Add more overlay types as needed
    });
  }

  async exportFrames(visualConfig, onProgress) {
    const totalFrames = Math.floor(this.duration * this.fps);
    
    for (let i = 0; i < totalFrames; i++) {
      const canvas = this.renderFrame(i, visualConfig);
      const framePath = path.join(this.tempDir, `frame_${String(i).padStart(6, '0')}.png`);
      
      // Save frame as PNG
      const buffer = canvas.toBuffer('image/png');
      fs.writeFileSync(framePath, buffer);
      
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: totalFrames,
          percent: ((i + 1) / totalFrames) * 100
        });
      }
    }
    
    return {
      frameDir: this.tempDir,
      frameCount: totalFrames,
      fps: this.fps
    };
  }

  async cleanup() {
    if (this.tempDir && fs.existsSync(this.tempDir)) {
      fs.rmSync(this.tempDir, { recursive: true, force: true });
    }
  }
}

module.exports = OfflineRenderer;