const { app, BrowserWindow, Menu, ipcMain,shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const store = new Store();

const chatsDir = path.join(app.getPath('userData'), 'chats');
app.setName('Complex');

const isMac = process.platform === 'darwin';

const template1 = [
    ...(isMac ? [{
        label: app.name,
        submenu: [
            { role: 'about' },
            { type: 'separator' },
            {role: 'hideOthers' },
            {role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' }
        ]
    }] : [])
];

const template2 = [
    {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'selectAll' }
        ]
    }
];

const template3 = [
    {
        label: 'Window',
        submenu: [
            { role: 'minimize' },
            { role: 'zoom'},
            { type: 'separator' },
            { role: 'front' },
            { role: 'close'},
        ]
    },
]

const template4 = [
    {
        label: 'View',
        submenu: [
            { role: 'forceReload'},
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn'},
            { role: 'zoomOut'}
        ]
    },
]

const combinedTemplate = [
    ...template1,
    { type: 'separator' },
    ...template2,
    {type: 'separator'},
     ...template3,
    {type: 'separator'},
    ...template4
];

const mainMenu = Menu.buildFromTemplate(combinedTemplate);
Menu.setApplicationMenu(mainMenu);

function createWindow() {
    const win = new BrowserWindow({

        icon: path.join(__dirname, '../assets/ComplexIcon.png'),


        width: 1000,
        height: 800,
        minWidth: 1000,
        minHeight: 800,

        backgroundColor: '#000000',
        titleBarStyle: 'hiddenInset',
        resizable: true,
        movable: true,
        smartResizing: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    win.on('will-resize', (event) => {

    });

    ipcMain.on('save-api-key', (event, key) => {
        store.set('openrouter_key', key);

    });

    ipcMain.handle('get-api-key', () => {
        return store.get('openrouter_key');
    });

    ipcMain.on('open-external-link', (event,url) => {
        shell.openExternal(url);
    })

    win.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(() => {

    if (!fs.existsSync(chatsDir)) {
        fs.mkdirSync(chatsDir, { recursive: true });
    }

    ipcMain.handle('save-chat', (event, chatData) => {
        console.log('save-chat aufgerufen:', chatData.id);
        const filePath = path.join(chatsDir, `${chatData.id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(chatData, null, 2));
    });

    ipcMain.handle('load-chats', () => {
        if (!fs.existsSync(chatsDir)) return [];
        const files = fs.readdirSync(chatsDir).filter(f => f.endsWith('.json'));
        return files.map(file => {
            const content = fs.readFileSync(path.join(chatsDir, file), 'utf8');
            return JSON.parse(content);
        });
    });

    ipcMain.handle('load-chat', (event, chatId) => {
        const filePath = path.join(chatsDir, `${chatId}.json`);
        if (!fs.existsSync(filePath)) return null;
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    });

    ipcMain.handle('delete-chat', (event, chatId) => {
        const filePath = path.join(chatsDir, `${chatId}.json`);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    createWindow();
});