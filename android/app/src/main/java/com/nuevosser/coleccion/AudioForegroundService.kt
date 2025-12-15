package com.nuevosser.coleccion

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat

/**
 * Foreground Service para mantener el audio TTS activo cuando la pantalla está apagada.
 *
 * Este servicio crea una notificación persistente que mantiene el proceso vivo
 * incluso cuando el dispositivo entra en suspensión.
 */
class AudioForegroundService : Service() {

    companion object {
        const val CHANNEL_ID = "audio_playback_channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START = "com.nuevosser.coleccion.action.START_AUDIO_SERVICE"
        const val ACTION_STOP = "com.nuevosser.coleccion.action.STOP_AUDIO_SERVICE"

        private var isRunning = false

        fun isServiceRunning(): Boolean = isRunning
    }

    private var wakeLock: PowerManager.WakeLock? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> startForegroundService()
            ACTION_STOP -> stopForegroundService()
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun startForegroundService() {
        if (isRunning) return

        isRunning = true

        // Adquirir WakeLock para mantener CPU activo
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "NuevoSer:AudioWakeLock"
        ).apply {
            acquire(60 * 60 * 1000L) // Máximo 1 hora
        }

        // Crear la notificación
        val notification = createNotification()

        // Iniciar como Foreground Service
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun stopForegroundService() {
        isRunning = false

        // Liberar WakeLock
        wakeLock?.let {
            if (it.isHeld) {
                it.release()
            }
        }
        wakeLock = null

        // Detener el servicio
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Reproducción de Audio",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Notificación para reproducción de audio en segundo plano"
                setShowBadge(false)
            }

            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        // Intent para abrir la app al tocar la notificación
        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingOpenIntent = PendingIntent.getActivity(
            this, 0, openAppIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Intent para detener el audio
        val stopIntent = Intent(this, AudioForegroundService::class.java).apply {
            action = ACTION_STOP
        }
        val pendingStopIntent = PendingIntent.getService(
            this, 0, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Reproduciendo audiolibro")
            .setContentText("La lectura continúa en segundo plano")
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(pendingOpenIntent)
            .addAction(
                android.R.drawable.ic_media_pause,
                "Detener",
                pendingStopIntent
            )
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .build()
    }

    override fun onDestroy() {
        isRunning = false
        wakeLock?.let {
            if (it.isHeld) {
                it.release()
            }
        }
        super.onDestroy()
    }
}
