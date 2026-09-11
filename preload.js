const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ninkSaga', {
  loadState: () => ipcRenderer.invoke('load-state'),
  saveState: (state) => ipcRenderer.invoke('save-state', state),
});
