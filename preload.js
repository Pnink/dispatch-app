const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dispatch', {
  sendMessage: (text) => ipcRenderer.invoke('send-message', text),
});
