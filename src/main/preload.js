const { contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    saveKey: (key) => ipcRenderer.send('save-api-key', key),
    loadKey: () => ipcRenderer.invoke('get-api-key'),
    openLink: (url) => ipcRenderer.send('open-external-link', url),

    saveChat: (chatData) => ipcRenderer.invoke('save-chat', chatData),
    loadChats: () => ipcRenderer.invoke('load-chats'),
    loadChat: (chatId) => ipcRenderer.invoke('load-chat', chatId),
    deleteChat: (chatId) => ipcRenderer.invoke('delete-chat', chatId),

});
