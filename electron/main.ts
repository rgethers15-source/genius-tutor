import { app, BrowserWindow, ipcMain, protocol, net } from 'electron';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Vite injects these during dev
process.env.APP_ROOT = path.join(__dirname, '..');
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

// --- Local data storage (per-user, on-device only) ---
const DATA_DIR = app.getPath('userData');
const DATA_FILE = path.join(DATA_DIR, 'genius-tutor-data.json');
const VIDEO_DIR = path.join(DATA_DIR, 'videos');

function safeName(key: string): string {
  // Keep cache filenames filesystem-safe.
  return key.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 120) + '.mp4';
}

// Save a cached talking-head video. `bytes` is a Uint8Array (ArrayBuffer).
function saveVideo(key: string, bytes: Uint8Array): string | null {
  try {
    fs.mkdirSync(VIDEO_DIR, { recursive: true });
    const file = path.join(VIDEO_DIR, safeName(key));
    fs.writeFileSync(file, bytes);
    return `gtvideo://${encodeURIComponent(safeName(key))}`;
  } catch (err) {
    console.error('Failed to save video:', err);
    return null;
  }
}

function getVideo(key: string): string | null {
  const file = path.join(VIDEO_DIR, safeName(key));
  return fs.existsSync(file) ? `gtvideo://${encodeURIComponent(safeName(key))}` : null;
}

function listVideoKeys(): string[] {
  try {
    if (!fs.existsSync(VIDEO_DIR)) return [];
    return fs.readdirSync(VIDEO_DIR).map((f) => f.replace(/\.mp4$/, ''));
  } catch {
    return [];
  }
}

function readData(): unknown {
  try {
    if (!fs.existsSync(DATA_FILE)) return null;
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read data file:', err);
    return null;
  }
}

function writeData(data: unknown): boolean {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to write data file:', err);
    return false;
  }
}

let win: BrowserWindow | null = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 940,
    minHeight: 640,
    backgroundColor: '#1a1512',
    title: 'Genius Tutor',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

// --- IPC handlers ---
ipcMain.handle('data:load', () => readData());
ipcMain.handle('data:save', (_evt, data: unknown) => writeData(data));
ipcMain.handle('video:save', (_evt, key: string, bytes: ArrayBuffer) =>
  saveVideo(key, new Uint8Array(bytes))
);
ipcMain.handle('video:get', (_evt, key: string) => getVideo(key));
ipcMain.handle('video:list', () => listVideoKeys());

// Register the custom scheme as privileged BEFORE app ready so <video> can play it.
protocol.registerSchemesAsPrivileged([
  { scheme: 'gtvideo', privileges: { secure: true, supportFetchAPI: true, stream: true, bypassCSP: false } },
]);

app.whenReady().then(() => {
  // Serve cached videos from the gtvideo:// scheme.
  protocol.handle('gtvideo', (request) => {
    const name = decodeURIComponent(request.url.replace('gtvideo://', ''));
    const file = path.join(VIDEO_DIR, name);
    if (!fs.existsSync(file)) {
      return new Response('Not found', { status: 404 });
    }
    return net.fetch(pathToFileURL(file).toString());
  });
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
