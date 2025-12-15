package com.nuevosser.coleccion

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import android.app.PendingIntent
import android.net.Uri

/**
 * Widget de Progreso de Lectura
 * Muestra el libro actual, progreso y racha de días
 */
class ReadingProgressWidget : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        // Actualizar todos los widgets activos
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onEnabled(context: Context) {
        // Widget añadido por primera vez
        super.onEnabled(context)
    }

    override fun onDisabled(context: Context) {
        // Último widget removido
        super.onDisabled(context)
    }

    companion object {
        fun updateWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            // Leer datos de SharedPreferences (sincronizados desde JavaScript)
            val prefs = context.getSharedPreferences("NuevoSerWidgetData", Context.MODE_PRIVATE)

            val currentBook = prefs.getString("currentBook", "Sin libro activo") ?: "Sin libro activo"
            val progress = prefs.getInt("progress", 0)
            val streak = prefs.getInt("streak", 0)
            val totalChapters = prefs.getInt("totalChapters", 0)
            val chaptersRead = prefs.getInt("chaptersRead", 0)
            val lastUpdate = prefs.getLong("lastUpdate", 0)

            // Crear RemoteViews con el layout del widget
            val views = RemoteViews(context.packageName, R.layout.widget_reading_progress)

            // Actualizar textos
            views.setTextViewText(R.id.widget_book_title, currentBook)
            views.setTextViewText(R.id.widget_progress_text, "$chaptersRead/$totalChapters capítulos")
            views.setProgressBar(R.id.widget_progress_bar, 100, progress, false)
            views.setTextViewText(R.id.widget_streak_text, "🔥 $streak días")

            // Mostrar última actualización
            if (lastUpdate > 0) {
                val updateTime = formatTimeAgo(lastUpdate)
                views.setTextViewText(R.id.widget_last_update, updateTime)
            }

            // PendingIntent para abrir la app al tocar el widget
            val intent = Intent(context, MainActivity::class.java).apply {
                action = Intent.ACTION_VIEW
                data = Uri.parse("nuevosser://continue-reading")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }

            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)

            // PendingIntent para el botón de refresh
            val refreshIntent = Intent(context, ReadingProgressWidget::class.java).apply {
                action = "android.appwidget.action.APPWIDGET_UPDATE"
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, intArrayOf(appWidgetId))
            }

            val refreshPendingIntent = PendingIntent.getBroadcast(
                context,
                appWidgetId,
                refreshIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            views.setOnClickPendingIntent(R.id.widget_refresh_btn, refreshPendingIntent)

            // Actualizar el widget
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        /**
         * Actualizar todos los widgets desde JavaScript
         */
        fun updateAllWidgets(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val widgetComponent = android.content.ComponentName(context, ReadingProgressWidget::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(widgetComponent)

            for (appWidgetId in appWidgetIds) {
                updateWidget(context, appWidgetManager, appWidgetId)
            }
        }

        /**
         * Formatear tiempo relativo (hace X minutos/horas)
         */
        private fun formatTimeAgo(timestamp: Long): String {
            val now = System.currentTimeMillis()
            val diff = now - timestamp
            val minutes = diff / (1000 * 60)
            val hours = diff / (1000 * 60 * 60)
            val days = diff / (1000 * 60 * 60 * 24)

            return when {
                minutes < 1 -> "Ahora"
                minutes < 60 -> "Hace ${minutes}m"
                hours < 24 -> "Hace ${hours}h"
                days < 7 -> "Hace ${days}d"
                else -> "Hace tiempo"
            }
        }
    }
}
