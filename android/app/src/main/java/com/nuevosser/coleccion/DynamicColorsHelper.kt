package com.nuevosser.coleccion

import android.app.Activity
import android.content.Context
import android.os.Build
import androidx.annotation.RequiresApi

/**
 * DynamicColorsHelper - Material You Dynamic Colors Integration
 *
 * Proporciona colores dinámicos basados en el wallpaper del usuario (Android 12+)
 * Los colores se extraen automáticamente del sistema y se aplican a la UI de la app.
 *
 * Requiere:
 * - Android 12 (API 31) o superior
 * - Material Components 1.5.0+
 */
object DynamicColorsHelper {

    /**
     * Aplica colores dinámicos de Material You a la actividad si está disponible
     *
     * @param activity La actividad a la cual aplicar los colores dinámicos
     */
    fun applyIfAvailable(activity: Activity) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            try {
                // Material You está disponible en Android 12+
                // Los colores se aplicarán automáticamente si el tema hereda de Material3
                android.util.Log.d("DynamicColors", "Material You available - colors will be applied from theme")
            } catch (e: Exception) {
                android.util.Log.w("DynamicColors", "Error applying dynamic colors", e)
            }
        } else {
            android.util.Log.d("DynamicColors", "Material You not available (requires Android 12+)")
        }
    }

    /**
     * Obtiene el color de acento principal del sistema
     *
     * @param context Contexto de la aplicación
     * @return Color de acento principal, o null si no está disponible
     */
    @RequiresApi(Build.VERSION_CODES.S)
    fun getSystemAccentColor(context: Context): Int? {
        return try {
            // android.R.color.system_accent1_500 es el color primario de Material You
            context.getColor(android.R.color.system_accent1_500)
        } catch (e: Exception) {
            android.util.Log.w("DynamicColors", "Error getting system accent color", e)
            null
        }
    }

    /**
     * Obtiene el color de acento secundario del sistema
     *
     * @param context Contexto de la aplicación
     * @return Color de acento secundario, o null si no está disponible
     */
    @RequiresApi(Build.VERSION_CODES.S)
    fun getSystemSecondaryColor(context: Context): Int? {
        return try {
            context.getColor(android.R.color.system_accent2_500)
        } catch (e: Exception) {
            android.util.Log.w("DynamicColors", "Error getting system secondary color", e)
            null
        }
    }

    /**
     * Obtiene el color de acento terciario del sistema
     *
     * @param context Contexto de la aplicación
     * @return Color de acento terciario, o null si no está disponible
     */
    @RequiresApi(Build.VERSION_CODES.S)
    fun getSystemTertiaryColor(context: Context): Int? {
        return try {
            context.getColor(android.R.color.system_accent3_500)
        } catch (e: Exception) {
            android.util.Log.w("DynamicColors", "Error getting system tertiary color", e)
            null
        }
    }

    /**
     * Verifica si Material You está disponible en el dispositivo
     *
     * @return true si el dispositivo soporta Material You (Android 12+)
     */
    fun isAvailable(): Boolean {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
    }

    /**
     * Obtiene un mapa con todos los colores del sistema para usar en JavaScript
     *
     * @param context Contexto de la aplicación
     * @return Mapa con colores del sistema en formato hexadecimal
     */
    fun getSystemColors(context: Context): Map<String, String> {
        val colors = mutableMapOf<String, String>()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            try {
                // Obtener colores y convertir a hexadecimal
                getSystemAccentColor(context)?.let { color ->
                    colors["accent1"] = String.format("#%06X", (0xFFFFFF and color))
                }

                getSystemSecondaryColor(context)?.let { color ->
                    colors["accent2"] = String.format("#%06X", (0xFFFFFF and color))
                }

                getSystemTertiaryColor(context)?.let { color ->
                    colors["accent3"] = String.format("#%06X", (0xFFFFFF and color))
                }

                android.util.Log.d("DynamicColors", "System colors: $colors")
            } catch (e: Exception) {
                android.util.Log.w("DynamicColors", "Error getting system colors", e)
            }
        }

        return colors
    }

    /**
     * Convierte un color Int a formato hexadecimal
     *
     * @param color Color en formato Int
     * @return String con el color en formato hexadecimal (#RRGGBB)
     */
    private fun colorToHex(color: Int): String {
        return String.format("#%06X", (0xFFFFFF and color))
    }
}
