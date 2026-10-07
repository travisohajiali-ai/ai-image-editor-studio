const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('app', {
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  }
});
