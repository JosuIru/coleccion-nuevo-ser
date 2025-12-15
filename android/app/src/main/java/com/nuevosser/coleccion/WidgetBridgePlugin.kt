package com.nuevosser.coleccion

import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import android.content.Context

/**
 * Plugin Capacitor para actualizar widgets desde JavaScript
 */
@CapacitorPlugin(name = "WidgetBridge")
class WidgetBridgePlugin : Plugin() {

    /**
     * Actualizar datos del widget
     * Guarda datos en SharedPreferences y actualiza los widgets
     */
    @PluginMethod
    fun updateWidgetData(call: PluginCall) {
        try {
            val context = this.context.applicationContext

            // Leer datos desde JavaScript
            val currentBook = call.getString("currentBook", "Sin libro activo") ?: "Sin libro activo"
            val progress = call.getInt("progress", 0) ?: 0
            val streak = call.getInt("streak", 0) ?: 0
            val totalChapters = call.getInt("totalChapters", 0) ?: 0
            val chaptersRead = call.getInt("chaptersRead", 0) ?: 0
            val dailyKoan = call.getString("dailyKoan", "") ?: ""
            val koanDate = call.getString("koanDate", "") ?: ""

            // Guardar en SharedPreferences
            val prefs = context.getSharedPreferences("NuevoSerWidgetData", Context.MODE_PRIVATE)
            val editor = prefs.edit()

            editor.putString("currentBook", currentBook)
            editor.putInt("progress", progress)
            editor.putInt("streak", streak)
            editor.putInt("totalChapters", totalChapters)
            editor.putInt("chaptersRead", chaptersRead)
            editor.putString("dailyKoan", dailyKoan)
            editor.putString("koanDate", koanDate)
            editor.putLong("lastUpdate", System.currentTimeMillis())

            editor.apply()

            // Actualizar widgets
            ReadingProgressWidget.updateAllWidgets(context)
            DailyKoanWidget.updateAllWidgets(context)

            call.resolve()

        } catch (e: Exception) {
            call.reject("Error updating widget data: ${e.message}")
        }
    }

    /**
     * Forzar actualización de todos los widgets
     */
    @PluginMethod
    fun updateWidgets(call: PluginCall) {
        try {
            val context = this.context.applicationContext

            ReadingProgressWidget.updateAllWidgets(context)
            DailyKoanWidget.updateAllWidgets(context)

            call.resolve()

        } catch (e: Exception) {
            call.reject("Error updating widgets: ${e.message}")
        }
    }
}
