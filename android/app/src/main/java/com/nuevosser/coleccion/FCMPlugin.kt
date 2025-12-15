package com.nuevosser.coleccion

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.google.firebase.messaging.FirebaseMessaging

/**
 * Plugin de Capacitor para Firebase Cloud Messaging
 *
 * Expone funcionalidades FCM a JavaScript:
 * - Obtener token FCM
 * - Solicitar permisos de notificación
 * - Suscribirse/desuscribirse a topics
 * - Verificar disponibilidad de FCM
 *
 * Uso desde JavaScript:
 * ```javascript
 * const { FCMPlugin } = window.Capacitor.Plugins;
 *
 * // Obtener token
 * const { token } = await FCMPlugin.getToken();
 *
 * // Solicitar permisos
 * const { granted } = await FCMPlugin.requestPermission();
 *
 * // Suscribirse a topic
 * await FCMPlugin.subscribeToTopic({ topic: 'all_users' });
 * ```
 */
@CapacitorPlugin(
    name = "FCMPlugin",
    permissions = [
        Permission(strings = [Manifest.permission.POST_NOTIFICATIONS], alias = "notifications")
    ]
)
class FCMPlugin : Plugin() {

    companion object {
        private const val TAG = "FCMPlugin"
        private const val PERMISSION_REQUEST_CODE = 1001
    }

    /**
     * Verifica si Firebase Cloud Messaging está disponible
     *
     * Retorna: { available: boolean }
     */
    @PluginMethod
    fun isAvailable(call: PluginCall) {
        val result = JSObject()

        try {
            // Verificar si Google Play Services está disponible
            val available = com.google.android.gms.common.ConnectionResult.SUCCESS ==
                    com.google.android.gms.common.GoogleApiAvailability
                        .getInstance()
                        .isGooglePlayServicesAvailable(activity.applicationContext)

            result.put("available", available)
            call.resolve(result)
        } catch (e: Exception) {
            Log.e(TAG, "Error verificando disponibilidad FCM: ${e.message}")
            result.put("available", false)
            call.resolve(result)
        }
    }

    /**
     * Obtiene el token FCM actual del dispositivo
     *
     * Retorna: { token: string } o error si no se puede obtener
     */
    @PluginMethod
    fun getToken(call: PluginCall) {
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful) {
                Log.w(TAG, "Error obteniendo token FCM", task.exception)
                call.reject("Error obteniendo token FCM: ${task.exception?.message}")
                return@addOnCompleteListener
            }

            // Token obtenido exitosamente
            val token = task.result
            Log.d(TAG, "Token FCM: $token")

            // Guardar en SharedPreferences
            val sharedPref = activity.getSharedPreferences("NuevoSerSettings", Context.MODE_PRIVATE)
            with(sharedPref.edit()) {
                putString("fcm_token", token)
                apply()
            }

            val result = JSObject()
            result.put("token", token)
            call.resolve(result)
        }
    }

    /**
     * Solicita permisos de notificación (Android 13+)
     *
     * En Android 12 y anteriores, los permisos se otorgan automáticamente.
     * En Android 13+ (API 33), se requiere solicitar permiso POST_NOTIFICATIONS.
     *
     * Retorna: { granted: boolean }
     */
    @PluginMethod
    fun requestPermission(call: PluginCall) {
        val result = JSObject()

        // Android 13+ requiere permiso POST_NOTIFICATIONS
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            when {
                ContextCompat.checkSelfPermission(
                    activity,
                    Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED -> {
                    // Permiso ya otorgado
                    result.put("granted", true)
                    call.resolve(result)
                }
                ActivityCompat.shouldShowRequestPermissionRationale(
                    activity,
                    Manifest.permission.POST_NOTIFICATIONS
                ) -> {
                    // Mostrar explicación al usuario sobre por qué se necesita el permiso
                    result.put("granted", false)
                    result.put("shouldShowRationale", true)
                    call.resolve(result)
                }
                else -> {
                    // Solicitar permiso
                    ActivityCompat.requestPermissions(
                        activity,
                        arrayOf(Manifest.permission.POST_NOTIFICATIONS),
                        PERMISSION_REQUEST_CODE
                    )

                    // Guardar call para responder después
                    bridge.saveCall(call)
                }
            }
        } else {
            // Android 12 y anteriores: permisos otorgados automáticamente
            result.put("granted", true)
            call.resolve(result)
        }
    }

    /**
     * Callback para el resultado de solicitud de permisos
     * Nota: En Capacitor moderno, esto se maneja automáticamente
     */

    /**
     * Suscribe el dispositivo a un topic de Firebase
     *
     * Los topics permiten enviar notificaciones a grupos de dispositivos
     * sin necesidad de gestionar tokens individuales.
     *
     * Ejemplos de topics:
     * - "all_users": Todos los usuarios
     * - "daily_reminders": Usuarios que quieren recordatorios diarios
     * - "new_content": Usuarios interesados en nuevo contenido
     *
     * Parámetros:
     * - topic: Nombre del topic (string)
     *
     * Retorna: { success: boolean }
     */
    @PluginMethod
    fun subscribeToTopic(call: PluginCall) {
        val topic = call.getString("topic")

        if (topic == null || topic.isEmpty()) {
            call.reject("Topic es requerido")
            return
        }

        FirebaseMessaging.getInstance().subscribeToTopic(topic)
            .addOnCompleteListener { task ->
                val result = JSObject()

                if (task.isSuccessful) {
                    Log.d(TAG, "Suscrito al topic: $topic")
                    result.put("success", true)
                    result.put("topic", topic)
                    call.resolve(result)
                } else {
                    Log.w(TAG, "Error suscribiendo al topic: $topic", task.exception)
                    call.reject("Error suscribiendo al topic: ${task.exception?.message}")
                }
            }
    }

    /**
     * Desuscribe el dispositivo de un topic de Firebase
     *
     * Parámetros:
     * - topic: Nombre del topic (string)
     *
     * Retorna: { success: boolean }
     */
    @PluginMethod
    fun unsubscribeFromTopic(call: PluginCall) {
        val topic = call.getString("topic")

        if (topic == null || topic.isEmpty()) {
            call.reject("Topic es requerido")
            return
        }

        FirebaseMessaging.getInstance().unsubscribeFromTopic(topic)
            .addOnCompleteListener { task ->
                val result = JSObject()

                if (task.isSuccessful) {
                    Log.d(TAG, "Desuscrito del topic: $topic")
                    result.put("success", true)
                    result.put("topic", topic)
                    call.resolve(result)
                } else {
                    Log.w(TAG, "Error desuscribiendo del topic: $topic", task.exception)
                    call.reject("Error desuscribiendo del topic: ${task.exception?.message}")
                }
            }
    }

    /**
     * Elimina el token FCM del dispositivo
     *
     * Útil para logout o cuando el usuario desactiva notificaciones.
     * Después de eliminar, se generará un nuevo token en el próximo inicio.
     *
     * Retorna: { success: boolean }
     */
    @PluginMethod
    fun deleteToken(call: PluginCall) {
        FirebaseMessaging.getInstance().deleteToken()
            .addOnCompleteListener { task ->
                val result = JSObject()

                if (task.isSuccessful) {
                    Log.d(TAG, "Token FCM eliminado")

                    // Eliminar de SharedPreferences
                    val sharedPref = activity.getSharedPreferences(
                        "NuevoSerSettings",
                        Context.MODE_PRIVATE
                    )
                    with(sharedPref.edit()) {
                        remove("fcm_token")
                        apply()
                    }

                    result.put("success", true)
                    call.resolve(result)
                } else {
                    Log.w(TAG, "Error eliminando token FCM", task.exception)
                    call.reject("Error eliminando token: ${task.exception?.message}")
                }
            }
    }

    /**
     * Obtiene el token guardado en SharedPreferences (sin llamar a Firebase)
     *
     * Útil para verificar si ya tenemos un token sin hacer una llamada de red.
     *
     * Retorna: { token: string | null }
     */
    @PluginMethod
    fun getSavedToken(call: PluginCall) {
        val sharedPref = activity.getSharedPreferences("NuevoSerSettings", Context.MODE_PRIVATE)
        val token = sharedPref.getString("fcm_token", null)

        val result = JSObject()
        result.put("token", token)
        call.resolve(result)
    }
}
