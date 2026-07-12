require('dotenv').config();

const { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

const HOTKEY = 'CommandOrControl+Shift+Space';
const MODEL = 'claude-opus-4-8';

let mainWindow = null;
let tray = null;

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

function toggleWindow() {
  if (!mainWindow) return;
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 420,
    alwaysOnTop: true,
    resizable: true,
    minimizable: false,
    fullscreenable: false,
    title: 'Dispatch',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Keep it around instead of destroying it when closed, so the hotkey
  // and tray icon can bring it back instantly.
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAKklEQVQ4jWNgGAWjYBSMglEwCkbBKBgFo2AUjIJRMApGwSgYBaNgFAADAAaAAAG5rBQAAAAAAElFTkSuQmCC'
  );
  tray = new Tray(icon);
  tray.setToolTip('Dispatch — click to toggle, or press ' + HOTKEY);
  tray.on('click', toggleWindow);

  const menu = Menu.buildFromTemplate([
    { label: 'Toggle Dispatch', click: toggleWindow },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(menu);
}

ipcMain.handle('send-message', async (_event, text) => {
  if (!anthropic) {
    return {
      error:
        'No ANTHROPIC_API_KEY found. Copy .env.example to .env and add your key, then restart Dispatch.',
    };
  }
  if (!text || !text.trim()) {
    return { error: 'Type a message first.' };
  }

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: text }],
    });
    const textBlock = response.content.find((block) => block.type === 'text');
    return { reply: textBlock ? textBlock.text : '(no text response)' };
  } catch (err) {
    return { error: err.message || 'Something went wrong calling the Anthropic API.' };
  }
});

app.whenReady().then(() => {
  createWindow();
  createTray();

  globalShortcut.register(HOTKEY, toggleWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // Don't quit — this is a background utility app. Quit via the tray menu.
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
