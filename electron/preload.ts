import { contextBridge, ipcRenderer } from 'electron';

// Secure bridge: renderer never touches Node/fs directly.
contextBridge.exposeInMainWorld('geniusTutor', {
  loadData: () => ipcRenderer.invoke('data:load'),
  saveData: (data: unknown) => ipcRenderer.invoke('data:save', data),
  // Talking-head video cache
  saveVideo: (key: string, bytes: ArrayBuffer) => ipcRenderer.invoke('video:save', key, bytes),
  getVideo: (key: string) => ipcRenderer.invoke('video:get', key),
  listVideos: () => ipcRenderer.invoke('video:list'),
});
