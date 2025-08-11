# YT Beat Video Creator

Transform beats into high-quality, SEO-optimized, visualized videos for YouTube.

## Features

- 🎵 **Music Visualizer**: Waveforms, spectrums, beat-reactive overlays
- 📤 **YouTube Integration**: Direct upload with OAuth 2.0
- 🔍 **SEO Automation**: Templates with placeholders
- ⚡ **GPU Acceleration**: NVENC, VideoToolbox, VAAPI support
- 📦 **Batch Processing**: Queue multiple videos

## Prerequisites

- Node.js 18+
- FFmpeg installed
- macOS 12+ or Windows 10+

## Installation

```bash
npm install
```

## Development

```bash
npm run electron:dev
```

## Build

```bash
# macOS
npm run pack:mac

# Windows
npm run pack:win
```

## Architecture

- **Frontend**: Electron + React + TypeScript
- **Visualizer**: PixiJS with Web Audio API
- **Video**: FFmpeg with GPU acceleration
- **Database**: SQLite for local storage
- **Memory**: Weaviate for pattern recognition

## Memory System

This project uses Weaviate for persistent memory across sessions. Patterns and solutions are stored and retrieved to improve development efficiency.

## License

MIT