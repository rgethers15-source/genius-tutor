import { contextBridge, ipcRenderer } from 'electron';

// Secure bridge: renderer never touches Node/fs directly.
contextBridge.exposeInMainWorld('geniusTutor', {
  loadData: () => ipcRenderer.invoke('data:load'),
  saveData: (data: unknown) => ipcRenderer.invoke('data:save', data),
});
