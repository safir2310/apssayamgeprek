'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Activity, CheckCircle2, XCircle, RefreshCw, Trash2, Shield,
  Settings, Zap, FileText, Terminal, Download, Upload, Cpu, Database, Server, AlertTriangle
} from 'lucide-react'

interface SystemHealth {
  status: 'healthy' | 'warning' | 'error'
  database: boolean
  api: boolean
  server: boolean
  uptime: string
  memory: string
  cpu: string
}

interface AppConfig {
  maintenanceMode: boolean
  debugMode: boolean
  apiRateLimit: boolean
  cacheEnabled: boolean
  notificationsEnabled: boolean
  autoBackup: boolean
}

export default function DevelopmentPage() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: 'healthy',
    database: true,
    api: true,
    server: true,
    uptime: '99.9%',
    memory: '45%',
    cpu: '23%'
  })
  const [appConfig, setAppConfig] = useState<AppConfig>({
    maintenanceMode: false,
    debugMode: false,
    apiRateLimit: true,
    cacheEnabled: true,
    notificationsEnabled: true,
    autoBackup: true
  })
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/admin/development/logs')
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    }
  }

  const handleCheckHealth = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/development/health-check')
      if (response.ok) {
        const data = await response.json()
        setSystemHealth(data)
      }
    } catch (error) {
      console.error('Error checking health:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClearCache = async () => {
    if (!confirm('Yakin ingin menghapus semua cache?')) return

    setLoading(true)
    try {
      const response = await fetch('/api/admin/development/clear-cache', {
        method: 'POST'
      })
      if (response.ok) {
        alert('Cache berhasil dihapus!')
      }
    } catch (error) {
      console.error('Error clearing cache:', error)
      alert('Gagal menghapus cache!')
    } finally {
      setLoading(false)
    }
  }

  const handleClearLogs = async () => {
    if (!confirm('Yakin ingin menghapus semua logs?')) return

    setLoading(true)
    try {
      const response = await fetch('/api/admin/development/clear-logs', {
        method: 'POST'
      })
      if (response.ok) {
        setLogs([])
        alert('Logs berhasil dihapus!')
      }
    } catch (error) {
      console.error('Error clearing logs:', error)
      alert('Gagal menghapus logs!')
    } finally {
      setLoading(false)
    }
  }

  const handleBackupDatabase = async () => {
    if (!confirm('Yakin ingin membuat backup database?')) return

    setLoading(true)
    try {
      const response = await fetch('/api/admin/development/backup', {
        method: 'POST'
      })
      if (response.ok) {
        const data = await response.json()
        alert(`Backup berhasil dibuat! ID: ${data.backupId}`)
      }
    } catch (error) {
      console.error('Error creating backup:', error)
      alert('Gagal membuat backup!')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/development/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appConfig)
      })
      if (response.ok) {
        alert('Konfigurasi berhasil diupdate!')
      } else {
        alert('Gagal mengupdate konfigurasi!')
      }
    } catch (error) {
      console.error('Error updating config:', error)
      alert('Terjadi kesalahan saat mengupdate konfigurasi!')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: boolean) => {
    return status ? 'text-green-500' : 'text-red-500'
  }

  const getStatusIcon = (status: boolean) => {
    return status ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Settings className="h-10 w-10 text-orange-500" />
            Pengembangan Aplikasi
          </h1>
          <p className="text-gray-600">
            Kelola dan pantau kesehatan, konfigurasi, dan maintenance aplikasi secara mandiri
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Health Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-500" />
                Kesehatan Sistem
              </CardTitle>
              <CardDescription>Pantau status sistem secara real-time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Database className={`h-5 w-5 ${getStatusColor(systemHealth.database)}`} />
                    <span>Database</span>
                  </div>
                  {getStatusIcon(systemHealth.database)}
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Server className={`h-5 w-5 ${getStatusColor(systemHealth.api)}`} />
                    <span>API Server</span>
                  </div>
                  {getStatusIcon(systemHealth.api)}
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Cpu className={`h-5 w-5 ${getStatusColor(systemHealth.server)}`} />
                    <span>Application Server</span>
                  </div>
                  {getStatusIcon(systemHealth.server)}
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-gray-500">Uptime</p>
                    <p className="font-bold text-lg">{systemHealth.uptime}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Memory</p>
                    <p className="font-bold text-lg">{systemHealth.memory}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">CPU</p>
                    <p className="font-bold text-lg">{systemHealth.cpu}</p>
                  </div>
                </div>
                <Button
                  onClick={handleCheckHealth}
                  disabled={loading}
                  className="w-full"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Cek Kesehatan Sistem
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Configuration Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-500" />
                Konfigurasi Aplikasi
              </CardTitle>
              <CardDescription>Kelola pengaturan aplikasi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Maintenance Mode</p>
                    <p className="text-xs text-gray-500">Matikan aplikasi untuk maintenance</p>
                  </div>
                  <Switch
                    checked={appConfig.maintenanceMode}
                    onCheckedChange={(checked) =>
                      setAppConfig({ ...appConfig, maintenanceMode: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Debug Mode</p>
                    <p className="text-xs text-gray-500">Tampilkan detail error</p>
                  </div>
                  <Switch
                    checked={appConfig.debugMode}
                    onCheckedChange={(checked) =>
                      setAppConfig({ ...appConfig, debugMode: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">API Rate Limit</p>
                    <p className="text-xs text-gray-500">Batas request API</p>
                  </div>
                  <Switch
                    checked={appConfig.apiRateLimit}
                    onCheckedChange={(checked) =>
                      setAppConfig({ ...appConfig, apiRateLimit: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Cache Enabled</p>
                    <p className="text-xs text-gray-500">Aktifkan caching</p>
                  </div>
                  <Switch
                    checked={appConfig.cacheEnabled}
                    onCheckedChange={(checked) =>
                      setAppConfig({ ...appConfig, cacheEnabled: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Notifications</p>
                    <p className="text-xs text-gray-500">Notifikasi sistem</p>
                  </div>
                  <Switch
                    checked={appConfig.notificationsEnabled}
                    onCheckedChange={(checked) =>
                      setAppConfig({ ...appConfig, notificationsEnabled: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Auto Backup</p>
                    <p className="text-xs text-gray-500">Backup otomatis harian</p>
                  </div>
                  <Switch
                    checked={appConfig.autoBackup}
                    onCheckedChange={(checked) =>
                      setAppConfig({ ...appConfig, autoBackup: checked })
                    }
                  />
                </div>
                <Button
                  onClick={handleUpdateConfig}
                  disabled={loading}
                  className="w-full"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Update Konfigurasi
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Tools Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-orange-500" />
                Maintenance Tools
              </CardTitle>
              <CardDescription>Alat maintenance dan optimasi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button
                  onClick={handleClearCache}
                  disabled={loading || !appConfig.cacheEnabled}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus Cache
                </Button>
                <Button
                  onClick={handleBackupDatabase}
                  disabled={loading}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Backup Database
                </Button>
                <Button
                  onClick={() => alert('Fitur restore database akan segera tersedia')}
                  disabled={loading}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Restore Database
                </Button>
                <Button
                  onClick={handleClearLogs}
                  disabled={loading}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Hapus Logs
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Logs Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5 text-orange-500" />
                System Logs
              </CardTitle>
              <CardDescription>Log aktivitas sistem terbaru</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 w-full rounded-lg border p-4 bg-black text-green-400 font-mono text-xs">
                {logs.length > 0 ? (
                  logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      <span className="text-gray-400">[{new Date().toLocaleTimeString()}]</span> {log}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">Tidak ada log tersedia</p>
                )}
              </ScrollArea>
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={fetchLogs}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  onClick={handleClearLogs}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Hapus
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Banner */}
        {appConfig.maintenanceMode && (
          <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-800">Mode Maintenance Aktif</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Aplikasi sedang dalam mode maintenance. Hanya admin yang dapat mengakses.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
