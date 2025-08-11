const { ipcMain, dialog, shell } = require('electron');
const db = require('./db');
const { checkFFmpeg, getEncoders } = require('../ffmpeg/utils');
const { renderVideo } = require('../ffmpeg/encode');
// Use mock uploader in development, real uploader in production
const YouTubeUploader = process.env.NODE_ENV === 'development' 
  ? require('./mock-uploader') 
  : require('./youtube-uploader');
const SeoTemplateManager = require('./seo-templates');
const BatchQueue = require('./batch-queue');
const SettingsManager = require('./settings-manager');

// Initialize services
const settingsManager = new SettingsManager();
const youtubeUploader = new YouTubeUploader();
const seoManager = new SeoTemplateManager();
const batchQueue = new BatchQueue();

// Database operations
ipcMain.handle('db:execute', (event, query, params) => {
  try {
    const stmt = db.prepare(query);
    return stmt.run(params);
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
});

ipcMain.handle('db:get', (event, query, params) => {
  try {
    const stmt = db.prepare(query);
    return stmt.get(params);
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
});

ipcMain.handle('db:all', (event, query, params) => {
  try {
    const stmt = db.prepare(query);
    return stmt.all(params);
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
});

// Settings operations
ipcMain.handle('settings:get', (event, key) => {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? JSON.parse(row.value) : null;
});

ipcMain.handle('settings:set', (event, key, value) => {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(
    key,
    JSON.stringify(value)
  );
  return true;
});

ipcMain.handle('settings:setYouTubeCredentials', (event, clientId, clientSecret) => {
  return settingsManager.setYouTubeCredentials(clientId, clientSecret);
});

ipcMain.handle('settings:getYouTubeCredentials', () => {
  return settingsManager.getYouTubeCredentials();
});

ipcMain.handle('settings:isFirstRun', () => {
  return settingsManager.isFirstRun();
});

ipcMain.handle('settings:getConfig', () => {
  return settingsManager.getConfig();
});

// External links
ipcMain.handle('shell:openExternal', (event, url) => {
  return shell.openExternal(url);
});

// Dialog operations
ipcMain.handle('dialog:selectFile', async (event, options) => {
  const result = await dialog.showOpenDialog(options);
  return result;
});

ipcMain.handle('dialog:saveFile', async (event, options) => {
  const result = await dialog.showSaveDialog(options);
  return result;
});

// FFmpeg operations
ipcMain.handle('ffmpeg:check', async () => {
  return await checkFFmpeg();
});

ipcMain.handle('ffmpeg:encoders', async () => {
  return await getEncoders();
});

ipcMain.handle('ffmpeg:render', async (event, options) => {
  return await renderVideo(options, (progress) => {
    event.sender.send('ffmpeg:progress', progress);
  });
});

// YouTube operations
ipcMain.handle('youtube:getAuthUrl', () => {
  return youtubeUploader.getAuthUrl();
});

ipcMain.handle('youtube:handleCallback', async (event, code) => {
  return await youtubeUploader.handleAuthCallback(code);
});

ipcMain.handle('youtube:upload', async (event, videoPath, metadata, accountId) => {
  return await youtubeUploader.uploadVideo(videoPath, metadata, accountId);
});

ipcMain.handle('youtube:getAccounts', async () => {
  return await youtubeUploader.getAccounts();
});

// SEO Template operations
ipcMain.handle('seo:getTemplates', () => {
  return seoManager.getAllTemplates();
});

ipcMain.handle('seo:getTemplate', (event, id) => {
  return seoManager.getTemplate(id);
});

ipcMain.handle('seo:createTemplate', (event, data) => {
  return seoManager.createTemplate(data);
});

ipcMain.handle('seo:updateTemplate', (event, id, data) => {
  return seoManager.updateTemplate(id, data);
});

ipcMain.handle('seo:deleteTemplate', (event, id) => {
  return seoManager.deleteTemplate(id);
});

ipcMain.handle('seo:validateTemplate', (event, template) => {
  return seoManager.validateTemplate(template);
});

// Batch Queue operations
ipcMain.handle('queue:addJob', (event, jobData) => {
  return batchQueue.addJob(jobData);
});

ipcMain.handle('queue:getStatus', () => {
  return batchQueue.getQueueStatus();
});

ipcMain.handle('queue:getHistory', (event, limit) => {
  return batchQueue.getJobHistory(limit);
});

ipcMain.handle('queue:pauseQueue', () => {
  batchQueue.pauseQueue();
});

ipcMain.handle('queue:resumeQueue', () => {
  batchQueue.resumeQueue();
});

ipcMain.handle('queue:cancelJob', (event, jobId) => {
  return batchQueue.cancelJob(jobId);
});

ipcMain.handle('queue:retryJob', (event, jobId) => {
  return batchQueue.retryJob(jobId);
});

// Forward queue events to renderer
batchQueue.on('jobStarted', (data) => {
  // Send to all renderer processes
  const { webContents } = require('electron');
  webContents.getAllWebContents().forEach(wc => {
    wc.send('queue:jobStarted', data);
  });
});

batchQueue.on('jobProgress', (data) => {
  const { webContents } = require('electron');
  webContents.getAllWebContents().forEach(wc => {
    wc.send('queue:jobProgress', data);
  });
});

batchQueue.on('jobCompleted', (data) => {
  const { webContents } = require('electron');
  webContents.getAllWebContents().forEach(wc => {
    wc.send('queue:jobCompleted', data);
  });
});

batchQueue.on('jobFailed', (data) => {
  const { webContents } = require('electron');
  webContents.getAllWebContents().forEach(wc => {
    wc.send('queue:jobFailed', data);
  });
});

module.exports = { setupIpcHandlers: () => {} };