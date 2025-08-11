const { ipcMain, dialog } = require('electron');
const db = require('./db');
const { checkFFmpeg, getEncoders } = require('../ffmpeg/utils');
const { renderVideo } = require('../ffmpeg/encode');

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

module.exports = { setupIpcHandlers: () => {} };