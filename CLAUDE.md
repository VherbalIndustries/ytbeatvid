# YT Beat Video Creator

A cross-platform desktop application that transforms beats into high-quality, SEO-optimized, visualized videos for YouTube with minimal effort.

## Project Overview

- **Stack**: Electron + React + TypeScript + Tailwind CSS + ShadCN UI
- **Visualizer**: PixiJS/Three.js with Web Audio API
- **Backend**: Node.js + SQLite + FFmpeg
- **Platform**: Windows 10+, macOS 12+

## Key Features

1. **Visualizer Engine**: Waveforms, spectrums, beat-reactive overlays
2. **YouTube Integration**: Direct upload with OAuth 2.0
3. **SEO Automation**: Templates with placeholders
4. **Batch Processing**: Queue multiple videos
5. **GPU Acceleration**: NVENC, VAAPI, Metal support

## Development Sprints

1. App shell and storage
2. Media I/O and FFmpeg base  
3. Visualizer preview engine
4. Offline visualizer export
5. SEO and templates
6. YouTube integration
7. Batch queue and job orchestration
8. Branding and reactive overlays
9. Free tier and licensing
10. Polish and release

## Project Structure

```
yt-beat-video-creator/
├── src/
│   ├── main/           # Electron main process
│   ├── renderer/       # React UI
│   ├── visualizer/     # Visualizer engine
│   ├── ffmpeg/         # FFmpeg integration
│   └── utils/          # Shared utilities
├── build/              # Compiled output
└── dist/               # Final installers
```

# 🧠 MEMORY SYSTEM INTEGRATION

**CRITICAL**: Use global memory system for ALL interactions.

## Memory Commands:
- `claude-memory context "<request>"` - Check BEFORE any task
- `claude-memory log "<request>" "<solution>" [files]` - Log AFTER completion
- `claude-memory status` - Check system health
- `claude-memory summary` - Get session summary

## Memory Workflow:

1. **BEFORE CODING**: Always check memory for similar solutions
   ```bash
   claude-memory context "electron app setup"
   claude-memory context "audio processing patterns"
   claude-memory context "FFmpeg integration"
   ```

2. **AFTER COMPLETING**: Always log solutions
   ```bash
   claude-memory log "Electron React setup" "Created main process with secure IPC" "electron-main.js preload.js"
   ```

## Memory Contains:
- Solutions from previous Electron projects
- Audio processing patterns (Auto Master project)
- Production build fixes
- Cross-platform development knowledge
- FFmpeg integration patterns
- React component patterns
- TypeScript configurations

## Development Rules:

1. **ALWAYS** check memory before implementing features
2. **ALWAYS** log completed work to memory
3. **BUILD ON** previous solutions rather than starting over
4. **REFERENCE** patterns from memory when applicable
5. **DOCUMENT** project-specific context in logs

## Performance Targets:
- Preview latency: <15ms
- 3-min 1080p60 render: <90 sec
- Export drift: <100ms over 10 min
- Render success rate: 99.5%

## Security:
- Secure IPC only (no Node access in renderer)
- Encrypted OAuth tokens
- No PII in logs
- Schema validation on all IPC messages

## Testing Strategy:
- Unit tests for pure functions
- Integration tests for FFmpeg pipeline
- Visual/audio sync tests with metronome
- E2E tests for full workflow
- Performance benchmarks

## Key Commands:

```bash
# Development
npm run dev         # Start Electron with Vite
npm run build       # Production build
npm run lint        # ESLint check
npm run typecheck   # TypeScript check
npm run test        # Run tests

# Packaging
npm run pack:mac    # Build macOS DMG
npm run pack:win    # Build Windows installer

# Memory
claude-memory context "visualizer implementation"
claude-memory log "task" "solution" [files]
```

## Critical Files:
- `electron-main.js` - Main process entry
- `preload.js` - Secure IPC bridge
- `src/main/youtube-uploader.js` - YouTube API integration
- `src/visualizer/engine.js` - Visualizer orchestration
- `src/ffmpeg/encode.js` - Video encoding pipeline

📖 **See CLAUDE-MEMORY.md for complete memory workflow.**

---

**REMEMBER**: Check memory BEFORE coding, log solutions AFTER completion!