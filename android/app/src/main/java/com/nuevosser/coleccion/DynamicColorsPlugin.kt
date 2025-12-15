package com.nuevosser.coleccion

import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * Plugin de Capacitor para exponer Material You Dynamic Colors a JavaScript
 *
 * Permite que la capa web acceda a los colores del sistema generados
 * dinámicamente por Material You (Android 12+)
 */
@CapacitorPlugin(name = "DynamicColors")
class DynamicColorsPlugin : Plugin() {

    /**
     * Verifica si Material You está disponible en el dispositivo
     *
     * Retorna: { available: boolean }
     */
    @PluginMethod
    fun isAvailable(call: PluginCall) {
        val available = DynamicColorsHelper.isAvailable()

        val result = JSObject()
        result.put("available", available)

        call.resolve(result)
    }

    /**
     * Obtiene los colores del sistema en formato hexadecimal
     *
     * Retorna: { 
     *   accent1: string,
     *   accent2: string,
     *   accent3: string 
     * }
     */
    @PluginMethod
    fun getSystemColors(call: PluginCall) {
        val context = activity.applicationContext
        val colors = DynamicColorsHelper.getSystemColors(context)

        val result = JSObject()
        colors.forEach { (key, value) ->
            result.put(key, value)
        }

        call.resolve(result)
    }

    /**
     * Obtiene solo el color de acento principal
     *
     * Retorna: { color: string }
     */
    @PluginMethod
    fun getAccentColor(call: PluginCall) {
        val context = activity.applicationContext
        
        if (!DynamicColorsHelper.isAvailable()) {
            call.reject("Material You not available")
            return
        }
        
        val color = DynamicColorsHelper.getSystemAccentColor(context)

        if (color != null) {
            val hexColor = String.format("#%06X", (0xFFFFFF and color))
            val result = JSObject()
            result.put("color", hexColor)
            call.resolve(result)
        } else {
            call.reject("Could not get accent color")
        }
    }
}
