package com.nuevosser.coleccion

import android.content.Intent
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService

/**
 * Quick Settings Tile para acceso rápido a la app desde el panel de notificaciones
 *
 * Permite al usuario abrir Colección Nuevo Ser directamente desde Quick Settings
 * sin necesidad de buscar el ícono de la app en el launcher.
 */
class ReadingTileService : TileService() {

    /**
     * Se ejecuta cuando el usuario toca el tile en Quick Settings
     */
    override fun onClick() {
        super.onClick()

        // Crear intent para abrir MainActivity
        val intent = Intent(this, MainActivity::class.java).apply {
            // FLAG_ACTIVITY_NEW_TASK: Necesario para iniciar actividad desde servicio
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

            // Añadir deep link para abrir directamente en última lectura
            data = android.net.Uri.parse("nuevosser://continue-reading")
        }

        // Iniciar actividad y colapsar panel de Quick Settings
        startActivityAndCollapse(intent)
    }

    /**
     * Se ejecuta cuando el tile es añadido o se vuelve visible
     */
    override fun onStartListening() {
        super.onStartListening()

        // Configurar el tile
        val tile = qsTile
        if (tile != null) {
            // Estado activo (tile visible y clickeable)
            tile.state = Tile.STATE_ACTIVE

            // Etiqueta visible en el tile
            tile.label = getString(R.string.tile_label)

            // Descripción para accesibilidad
            tile.contentDescription = getString(R.string.tile_description)

            // Aplicar cambios
            tile.updateTile()
        }
    }

    /**
     * Se ejecuta cuando el tile deja de ser visible
     */
    override fun onStopListening() {
        super.onStopListening()
        // Opcionalmente limpiar recursos si fuera necesario
    }

    /**
     * Se ejecuta cuando el tile es removido por el usuario
     */
    override fun onTileRemoved() {
        super.onTileRemoved()
        // Limpieza final si es necesario
    }
}
