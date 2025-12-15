package com.nuevosser.coleccion

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/**
 * Servicio de Firebase Cloud Messaging para Colección Nuevo Ser
 *
 * Maneja notificaciones push recibidas desde Firebase y crea notificaciones
 * locales en el dispositivo con acciones personalizadas según el tipo de mensaje.
 *
 * Tipos de notificación soportados:
 * - reading_reminder: Recordatorio de lectura diaria
 * - achievement: Notificación de logro desbloqueado
 * - new_content: Nuevo contenido disponible (libro, capítulo, etc.)
 * - daily_koan: Koan del día
 * - general: Notificación general
 */
class NuevoSerFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "FCMService"
        private const val CHANNEL_ID = "nuevosser_fcm"
        private const val CHANNEL_NAME = "Colección Nuevo Ser"
        private const val CHANNEL_DESCRIPTION = "Notificaciones de lectura y logros"
    }

    /**
     * Se llama cuando se recibe un nuevo token FCM
     * Este token identifica de forma única este dispositivo para enviar notificaciones
     */
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "Nuevo token FCM: $token")

        // Guardar token en SharedPreferences
        val sharedPref = getSharedPreferences("NuevoSerSettings", Context.MODE_PRIVATE)
        with(sharedPref.edit()) {
            putString("fcm_token", token)
            apply()
        }

        // TODO: Enviar token al backend (Supabase) si el usuario está autenticado
        // Esto permitiría enviar notificaciones personalizadas por usuario
    }

    /**
     * Se llama cuando llega un mensaje push
     * Aquí procesamos el mensaje y creamos una notificación local
     */
    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)

        Log.d(TAG, "Mensaje recibido de: ${remoteMessage.from}")

        // Procesar datos del mensaje
        remoteMessage.data.let { data ->
            Log.d(TAG, "Datos del mensaje: $data")

            val notificationType = data["type"] ?: "general"
            val title = data["title"] ?: "Colección Nuevo Ser"
            val body = data["body"] ?: "Tienes una nueva notificación"
            val deepLink = data["deepLink"] ?: "nuevosser://library"

            sendNotification(title, body, notificationType, deepLink)
        }

        // También procesar notificación si viene en el payload
        remoteMessage.notification?.let { notification ->
            Log.d(TAG, "Notificación: ${notification.title} - ${notification.body}")
            sendNotification(
                notification.title ?: "Colección Nuevo Ser",
                notification.body ?: "Tienes una nueva notificación",
                "general",
                "nuevosser://library"
            )
        }
    }

    /**
     * Crea y muestra una notificación local
     *
     * @param title Título de la notificación
     * @param messageBody Cuerpo del mensaje
     * @param notificationType Tipo de notificación (reading_reminder, achievement, etc.)
     * @param deepLink Deep link para abrir cuando se toca la notificación
     */
    private fun sendNotification(
        title: String,
        messageBody: String,
        notificationType: String,
        deepLink: String
    ) {
        // Intent para abrir la app cuando se toca la notificación
        val intent = Intent(Intent.ACTION_VIEW).apply {
            data = android.net.Uri.parse(deepLink)
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }

        val pendingIntentFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_ONE_SHOT
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            pendingIntentFlags
        )

        // Icono y sonido según el tipo de notificación
        val iconResId = getIconForType(notificationType)
        val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)

        // Crear notificación
        val notificationBuilder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(iconResId)
            .setContentTitle(title)
            .setContentText(messageBody)
            .setStyle(NotificationCompat.BigTextStyle().bigText(messageBody))
            .setAutoCancel(true)
            .setSound(defaultSoundUri)
            .setContentIntent(pendingIntent)
            .setPriority(getPriorityForType(notificationType))

        // Añadir acciones específicas según el tipo
        when (notificationType) {
            "reading_reminder" -> {
                // Acción: Abrir último libro
                val continueIntent = Intent(Intent.ACTION_VIEW).apply {
                    data = android.net.Uri.parse("nuevosser://continue-reading")
                }
                val continuePendingIntent = PendingIntent.getActivity(
                    this,
                    1,
                    continueIntent,
                    pendingIntentFlags
                )
                notificationBuilder.addAction(
                    android.R.drawable.ic_media_play,
                    "Continuar leyendo",
                    continuePendingIntent
                )
            }
            "achievement" -> {
                // Acción: Ver logros
                val achievementsIntent = Intent(Intent.ACTION_VIEW).apply {
                    data = android.net.Uri.parse("nuevosser://progress")
                }
                val achievementsPendingIntent = PendingIntent.getActivity(
                    this,
                    2,
                    achievementsIntent,
                    pendingIntentFlags
                )
                notificationBuilder.addAction(
                    android.R.drawable.ic_menu_view,
                    "Ver logros",
                    achievementsPendingIntent
                )
            }
            "daily_koan" -> {
                // Acción: Abrir koan
                val koanIntent = Intent(Intent.ACTION_VIEW).apply {
                    data = android.net.Uri.parse("nuevosser://daily-koan")
                }
                val koanPendingIntent = PendingIntent.getActivity(
                    this,
                    3,
                    koanIntent,
                    pendingIntentFlags
                )
                notificationBuilder.addAction(
                    android.R.drawable.ic_menu_search,
                    "Leer koan",
                    koanPendingIntent
                )
            }
        }

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Crear canal de notificación para Android 8.0+ (API 26+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = CHANNEL_DESCRIPTION
            }
            notificationManager.createNotificationChannel(channel)
        }

        // Mostrar notificación con ID único basado en timestamp
        val notificationId = System.currentTimeMillis().toInt()
        notificationManager.notify(notificationId, notificationBuilder.build())

        Log.d(TAG, "Notificación mostrada: $title")
    }

    /**
     * Obtiene el icono apropiado según el tipo de notificación
     */
    private fun getIconForType(type: String): Int {
        return when (type) {
            "reading_reminder" -> android.R.drawable.ic_menu_agenda
            "achievement" -> android.R.drawable.ic_menu_info_details
            "new_content" -> android.R.drawable.ic_menu_add
            "daily_koan" -> android.R.drawable.ic_menu_compass
            else -> android.R.drawable.ic_dialog_info
        }
    }

    /**
     * Obtiene la prioridad según el tipo de notificación
     */
    private fun getPriorityForType(type: String): Int {
        return when (type) {
            "achievement" -> NotificationCompat.PRIORITY_HIGH
            "new_content" -> NotificationCompat.PRIORITY_DEFAULT
            "reading_reminder" -> NotificationCompat.PRIORITY_DEFAULT
            "daily_koan" -> NotificationCompat.PRIORITY_LOW
            else -> NotificationCompat.PRIORITY_DEFAULT
        }
    }

    /**
     * Se llama cuando el mensaje no pudo ser entregado
     */
    override fun onDeletedMessages() {
        super.onDeletedMessages()
        Log.w(TAG, "Mensajes eliminados en el servidor")
    }
}
