#!/bin/bash
# Launcher para Brave con soporte TTS mejorado en Linux

echo "🚀 Iniciando Brave con configuración TTS optimizada..."

# Asegurar que speech-dispatcher esté corriendo
systemctl --user start speech-dispatcher 2>/dev/null
sleep 1

# Flags para habilitar TTS en Linux
FLAGS=(
  # Habilitar Speech Dispatcher
  --enable-speech-dispatcher

  # Habilitar Web Speech API
  --enable-features=WebSpeech

  # Usar implementación de speech dispatcher
  --use-speech-dispatcher

  # Deshabilitar sandbox para speech (puede ayudar)
  --disable-speech-api-sandboxing

  # Forzar uso de PulseAudio (mejora compatibilidad)
  --enable-features=PulseaudioLoopbackForScreenShare

  # Logging para debugging (opcional)
  --enable-logging=stderr
  --vmodule=speech*=2
)

# URL a abrir (pasar como argumento o usar localhost por defecto)
URL="${1:-http://localhost:8001/www/index.html}"

echo "🔊 Flags habilitados:"
for flag in "${FLAGS[@]}"; do
  echo "   $flag"
done

echo ""
echo "🌐 Abriendo: $URL"
echo "⏳ Espera 5-10 segundos para que las voces se carguen..."
echo ""

# Lanzar Brave con los flags
/usr/bin/brave-browser "${FLAGS[@]}" "$URL" 2>&1 | grep -i "speech" &

# Dar tiempo para que cargue
sleep 3

echo "✅ Brave iniciado"
echo ""
echo "📋 Para verificar en la consola del navegador (F12):"
echo "   speechSynthesis.getVoices().length"
echo ""
