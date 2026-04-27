import qz from 'qz-tray'

let connected = false

export const connectQZ = async () => {
  if (connected) return true
  try {
    await qz.websocket.connect()
    connected = true
    console.log('QZ Tray connected')
    return true
  } catch (err) {
    console.error('QZ Tray connection failed:', err)
    connected = false
    return false
  }
}

export const disconnectQZ = () => {
  if (connected) {
    qz.websocket.disconnect()
    connected = false
  }
}

export const printDocket = async (htmlContent, printerName = null) => {
  try {
    const ok = await connectQZ()
    if (!ok) {
      // Fallback to browser print
      const win = window.open('', '_blank', 'width=400,height=600')
      win.document.write(htmlContent)
      win.document.close()
      setTimeout(() => win.print(), 500)
      return
    }

    const config = qz.configs.create(printerName || null)
    const data = [{
      type: 'pixel',
      format: 'html',
      flavor: 'plain',
      data: htmlContent,
    }]
    await qz.print(config, data)
  } catch (err) {
    console.error('Print error:', err)
    // Fallback to browser print
    const win = window.open('', '_blank', 'width=400,height=600')
    win.document.write(htmlContent)
    win.document.close()
    setTimeout(() => win.print(), 500)
  }
}

export const getAvailablePrinters = async () => {
  try {
    const ok = await connectQZ()
    if (!ok) return []
    return await qz.printers.find()
  } catch {
    return []
  }
}