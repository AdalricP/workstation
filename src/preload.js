// preload.js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getWhitelist: () => ipcRenderer.invoke('get-whitelist'),
  addToWhitelist: (domain) => ipcRenderer.invoke('add-to-whitelist', domain),
  removeFromWhitelist: (domain) => ipcRenderer.invoke('remove-from-whitelist', domain),
  openTimer: () => ipcRenderer.send('open-timer')
})