const { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain, nativeImage, protocol } = require('electron');
const path = require('path');
const fs = require('fs/promises');

const HOTKEY = 'CommandOrControl+Shift+Space';

let mainWindow = null;
let tray = null;

function statePath() {
  return path.join(app.getPath('userData'), 'nink-saga-state.json');
}

// A plain file:// load treats the renderer as an opaque/null origin, which
// silently blocks `<script type="module">` (needed to load Three.js) under
// Chromium's CORS rules for module scripts. Serving the app over a
// privileged custom scheme instead makes it a normal same-origin page —
// this must be registered before the app is ready.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true },
  },
]);

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
    width: 980,
    height: 760,
    minWidth: 640,
    minHeight: 480,
    alwaysOnTop: true,
    resizable: true,
    minimizable: false,
    fullscreenable: false,
    title: 'The Nink Saga — Progress Tracker',
    backgroundColor: '#0c0f14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL('app://local/renderer/index.html');

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
  tray.setToolTip('The Nink Saga — click to toggle, or press ' + HOTKEY);
  tray.on('click', toggleWindow);

  const menu = Menu.buildFromTemplate([
    { label: 'Toggle The Nink Saga', click: toggleWindow },
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

ipcMain.handle('load-state', async () => {
  try {
    const raw = await fs.readFile(statePath(), 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    console.error('Failed to load state:', err);
    return null;
  }
});

ipcMain.handle('save-state', async (_event, state) => {
  try {
    await fs.mkdir(path.dirname(statePath()), { recursive: true });
    await fs.writeFile(statePath(), JSON.stringify(state, null, 2), 'utf8');
    return { ok: true };
  } catch (err) {
    console.error('Failed to save state:', err);
    return { ok: false, error: err.message };
  }
});

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
};

app.whenReady().then(() => {
  protocol.handle('app', async (request) => {
    const { pathname } = new URL(request.url);
    const filePath = path.join(__dirname, decodeURIComponent(pathname));
    // Module scripts strictly enforce Content-Type (unlike classic scripts),
    // and net.fetch() on a file:// URL doesn't reliably set it — read the
    // file directly and set the header ourselves.
    try {
      const data = await fs.readFile(filePath);
      const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
      return new Response(data, { headers: { 'Content-Type': contentType } });
    } catch (err) {
      return new Response('Not found', { status: 404 });
    }
  });

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
