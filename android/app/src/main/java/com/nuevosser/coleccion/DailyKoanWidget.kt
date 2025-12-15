package com.nuevosser.coleccion

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import android.app.PendingIntent
import android.net.Uri

/**
 * Widget de Koan Diario
 * Muestra el koan del día para reflexión
 */
class DailyKoanWidget : AppWidgetProvider() {

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
        super.onEnabled(context)
    }

    override fun onDisabled(context: Context) {
        super.onDisabled(context)
    }

    companion object {
        fun updateWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            // Leer koan del día desde SharedPreferences
            val prefs = context.getSharedPreferences("NuevoSerWidgetData", Context.MODE_PRIVATE)

            val koanText = prefs.getString("dailyKoan", "La mente que pregunta ya conoce la respuesta.")
                ?: "La mente que pregunta ya conoce la respuesta."
            val koanDate = prefs.getString("koanDate", "") ?: ""

            // Crear RemoteViews
            val views = RemoteViews(context.packageName, R.layout.widget_daily_koan)

            // Actualizar contenido
            views.setTextViewText(R.id.widget_koan_text, koanText)
            views.setTextViewText(R.id.widget_koan_date, koanDate)

            // PendingIntent para abrir koan modal
            val intent = Intent(context, MainActivity::class.java).apply {
                action = Intent.ACTION_VIEW
                data = Uri.parse("nuevosser://daily-koan")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }

            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            views.setOnClickPendingIntent(R.id.widget_koan_container, pendingIntent)

            // PendingIntent para el botón de refresh
            val refreshIntent = Intent(context, DailyKoanWidget::class.java).apply {
                action = "android.appwidget.action.APPWIDGET_UPDATE"
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, intArrayOf(appWidgetId))
            }

            val refreshPendingIntent = PendingIntent.getBroadcast(
                context,
                appWidgetId,
                refreshIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            views.setOnClickPendingIntent(R.id.widget_koan_refresh_btn, refreshPendingIntent)

            // Actualizar widget
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        /**
         * Actualizar todos los widgets desde JavaScript
         */
        fun updateAllWidgets(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val widgetComponent = android.content.ComponentName(context, DailyKoanWidget::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(widgetComponent)

            for (appWidgetId in appWidgetIds) {
                updateWidget(context, appWidgetManager, appWidgetId)
            }
        }
    }
}
