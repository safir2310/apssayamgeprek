import fs from 'fs'
import path from 'path'

const logFile = path.join(process.cwd(), 'dev.log')

export function logToDevServer(message: string, data?: any) {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] ${message}${data ? ' ' + JSON.stringify(data) : ''}\n`

  // Log to console
  console.log(logMessage.trim())

  // Also append to file
  try {
    fs.appendFileSync(logFile, logMessage)
  } catch (error) {
    console.error('Error writing to log file:', error)
  }
}
