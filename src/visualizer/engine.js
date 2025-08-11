const PIXI = require('pixi.js');
const FFT = require('fft.js');

class VisualizerEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.options = {
      width: options.width || 1920,
      height: options.height || 1080,
      fps: options.fps || 60,
      ...options
    };
    
    this.app = null;
    this.layers = [];
    this.audioData = null;
    this.fft = null;
    this.animationFrame = null;
  }

  async init() {
    // Initialize PIXI application
    this.app = new PIXI.Application({
      view: this.canvas,
      width: this.options.width,
      height: this.options.height,
      backgroundColor: 0x000000,
      antialias: true
    });

    this.setupLayers();
  }

  setupLayers() {
    // Background layer
    this.backgroundLayer = new PIXI.Container();
    this.app.stage.addChild(this.backgroundLayer);

    // Visualizer layer
    this.visualizerLayer = new PIXI.Container();
    this.app.stage.addChild(this.visualizerLayer);

    // Overlay layer
    this.overlayLayer = new PIXI.Container();
    this.app.stage.addChild(this.overlayLayer);
  }

  setAudioContext(audioContext, sourceNode) {
    this.audioContext = audioContext;
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    sourceNode.connect(this.analyser);

    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeData = new Uint8Array(this.analyser.fftSize);
  }

  addWaveform(type = 'line', options = {}) {
    const waveform = new PIXI.Graphics();
    waveform.type = type;
    waveform.options = {
      color: 0x00ff00,
      lineWidth: 2,
      amplitude: 100,
      ...options
    };
    
    this.visualizerLayer.addChild(waveform);
    this.layers.push({ type: 'waveform', graphics: waveform, options: waveform.options });
    
    return waveform;
  }

  addSpectrum(type = 'bars', options = {}) {
    const spectrum = new PIXI.Container();
    spectrum.type = type;
    spectrum.options = {
      barCount: 64,
      color: 0xff0000,
      gap: 2,
      ...options
    };

    // Create bars
    spectrum.bars = [];
    for (let i = 0; i < spectrum.options.barCount; i++) {
      const bar = new PIXI.Graphics();
      spectrum.addChild(bar);
      spectrum.bars.push(bar);
    }

    this.visualizerLayer.addChild(spectrum);
    this.layers.push({ type: 'spectrum', container: spectrum, options: spectrum.options });
    
    return spectrum;
  }

  updateVisualization() {
    if (!this.analyser) return;

    // Get audio data
    this.analyser.getByteFrequencyData(this.frequencyData);
    this.analyser.getByteTimeDomainData(this.timeData);

    // Update each layer
    this.layers.forEach(layer => {
      if (layer.type === 'waveform') {
        this.updateWaveform(layer);
      } else if (layer.type === 'spectrum') {
        this.updateSpectrum(layer);
      }
    });
  }

  updateWaveform(layer) {
    const { graphics, options } = layer;
    graphics.clear();
    graphics.lineStyle(options.lineWidth, options.color);

    const width = this.app.screen.width;
    const height = this.app.screen.height;
    const centerY = height / 2;
    const sliceWidth = width / this.timeData.length;

    let x = 0;
    for (let i = 0; i < this.timeData.length; i++) {
      const v = this.timeData[i] / 128.0;
      const y = centerY + (v - 1) * options.amplitude;

      if (i === 0) {
        graphics.moveTo(x, y);
      } else {
        graphics.lineTo(x, y);
      }

      x += sliceWidth;
    }
  }

  updateSpectrum(layer) {
    const { container, options } = layer;
    const { bars, barCount } = container;
    
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    const barWidth = (width - (barCount - 1) * options.gap) / barCount;
    const binSize = Math.floor(this.frequencyData.length / barCount);

    bars.forEach((bar, i) => {
      let sum = 0;
      for (let j = 0; j < binSize; j++) {
        sum += this.frequencyData[i * binSize + j];
      }
      const average = sum / binSize;
      const barHeight = (average / 255) * height * 0.7;

      bar.clear();
      bar.beginFill(options.color);
      bar.drawRect(
        i * (barWidth + options.gap),
        height - barHeight,
        barWidth,
        barHeight
      );
      bar.endFill();
    });
  }

  start() {
    const animate = () => {
      this.updateVisualization();
      this.animationFrame = requestAnimationFrame(animate);
    };
    animate();
  }

  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  async exportFrame() {
    // For offline rendering
    const renderTexture = PIXI.RenderTexture.create({
      width: this.options.width,
      height: this.options.height
    });
    
    this.app.renderer.render(this.app.stage, { renderTexture });
    
    const canvas = this.app.renderer.extract.canvas(renderTexture);
    return canvas.toDataURL('image/png');
  }

  destroy() {
    this.stop();
    if (this.app) {
      this.app.destroy(true);
    }
  }
}

module.exports = VisualizerEngine;