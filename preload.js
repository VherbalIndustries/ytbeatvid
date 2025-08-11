const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getName: () => ipcRenderer.invoke('app:getName'),
  
  // File operations
  selectFile: (options) => ipcRenderer.invoke('dialog:selectFile', options),
  saveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options),
  
  // Database operations
  db: {
    execute: (query, params) => ipcRenderer.invoke('db:execute', query, params),
    get: (query, params) => ipcRenderer.invoke('db:get', query, params),
    all: (query, params) => ipcRenderer.invoke('db:all', query, params)
  },
  
  // FFmpeg operations
  ffmpeg: {
    checkInstallation: () => ipcRenderer.invoke('ffmpeg:check'),
    getEncoders: () => ipcRenderer.invoke('ffmpeg:encoders'),
    render: (options) => ipcRenderer.invoke('ffmpeg:render', options),
    onProgress: (callback) => {
      ipcRenderer.on('ffmpeg:progress', (event, data) => callback(data));
    }
  },
  
  // YouTube operations
  youtube: {
    authenticate: () => ipcRenderer.invoke('youtube:auth'),
    upload: (videoPath, metadata) => ipcRenderer.invoke('youtube:upload', videoPath, metadata),
    getAccounts: () => ipcRenderer.invoke('youtube:accounts')
  },
  
  // Settings
  settings: {
    get: (key) => ipcRenderer.invoke('settings:get', key),
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value)
  }
});