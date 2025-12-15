package com.nuevosser.coleccion;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Registrar plugins personalizados
        registerPlugin(WidgetBridgePlugin.class);
        registerPlugin(DynamicColorsPlugin.class);
        registerPlugin(FCMPlugin.class);

        // Aplicar Material You dynamic colors si está disponible (Android 12+)
        // DynamicColorsHelper es un objeto Kotlin (singleton)
        com.nuevosser.coleccion.DynamicColorsHelper.INSTANCE.applyIfAvailable(this);
    }
}
