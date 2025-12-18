package com.nuevosser.coleccion

import android.content.Intent
import android.os.Build
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * Plugin de Capacitor para controlar el Foreground Service de audio.
 *
 * Permite que JavaScript inicie y detenga el servicio que mantiene
 * el audio activo cuando la pantalla está apagada.
 */
@CapacitorPlugin(name = "BackgroundAudio")
class BackgroundAudioPlugin : Plugin() {

    /**
     * Inicia el Foreground Service para audio en segundo plano.
     *
     * Debe llamarse cuando comienza la reproducción de audio.
     */
    @PluginMethod
    fun start(call: PluginCall) {
        try {
            val context = activity.applicationContext
            val intent = Intent(context, AudioForegroundService::class.java).apply {
                action = AudioForegroundService.ACTION_START
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }

            val result = JSObject()
            result.put("success", true)
            result.put("message", "Background audio service started")
            call.resolve(result)
        } catch (e: Exception) {
            call.reject("Failed to start background audio service", e)
        }
    }

    /**
     * Detiene el Foreground Service de audio.
     *
     * Debe llamarse cuando termina la reproducción de audio.
     */
    @PluginMethod
    fun stop(call: PluginCall) {
        try {
            val context = activity.applicationContext
            val intent = Intent(context, AudioForegroundService::class.java).apply {
                action = AudioForegroundService.ACTION_STOP
            }

            context.startService(intent)

            val result = JSObject()
            result.put("success", true)
            result.put("message", "Background audio service stopped")
            call.resolve(result)
        } catch (e: Exception) {
            call.reject("Failed to stop background audio service", e)
        }
    }

    /**
     * Verifica si el servicio está actualmente ejecutándose.
     *
     * Retorna: { running: boolean }
     */
    @PluginMethod
    fun isRunning(call: PluginCall) {
        val result = JSObject()
        result.put("running", AudioForegroundService.isServiceRunning())
        call.resolve(result)
    }
}
