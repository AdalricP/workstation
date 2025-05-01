// main.js - Main Process
const { app, BrowserWindow, session, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

let mainWindow;



// Configuration file path
const configPath = path.join(app.getPath('userData'), 'whitelist-config.json')

// Default configuration
const defaultConfig = {
  whitelist: [
    'chatgpt.com'
  ]
}

// Load or create config
function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(configPath))
  } catch (e) {
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))
    return defaultConfig
  }
}

// Save config
function saveConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
}

// Set up request blocking
function setupRequestBlocking() {
  const config = loadConfig()
  
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    try {
      // Skip blocking for devtools and local files
      if (details.url.startsWith('devtools://') || details.url.startsWith('file://')) {
        return callback({ cancel: false })
      }

      const url = new URL(details.url)
      const hostname = url.hostname
      
      const isAllowed = config.whitelist.some(allowedDomain => {
        return hostname === allowedDomain || 
               hostname.endsWith(`.${allowedDomain}`)
      })
      
      if (!isAllowed) {
        console.log(`Blocked: ${details.url}`)
        return callback({ cancel: true })
      }
      
      callback({ requestHeaders: details.requestHeaders })
    } catch (e) {
      callback({ requestHeaders: details.requestHeaders })
    }
  })
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 400,
    height: 300,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // Load the index.html file using proper path resolution
  const indexPath = path.join(__dirname, 'index.html')
  console.log('Loading:', indexPath) // Debugging
  mainWindow.loadFile(indexPath).catch(err => {
    console.error('Failed to load index.html:', err)
    // Fallback or error handling
    mainWindow.loadURL(`data:text/html,<h1>Error loading app</h1><p>${err.message}</p>`)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  setupIPC()
}

function setupIPC() {
  ipcMain.handle('get-whitelist', () => {
    return loadConfig().whitelist
  })

  ipcMain.handle('add-to-whitelist', (event, domain) => {
    const config = loadConfig()
    if (!config.whitelist.includes(domain)) {
      config.whitelist.push(domain)
      saveConfig(config)
      return true
    }
    return false
  })

  ipcMain.handle('remove-from-whitelist', (event, domain) => {
    const config = loadConfig()
    const index = config.whitelist.indexOf(domain)
    if (index > -1) {
      config.whitelist.splice(index, 1)
      saveConfig(config)
      return true
    }
    return false
  })
}

app.whenReady().then(() => {
  setupRequestBlocking()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})