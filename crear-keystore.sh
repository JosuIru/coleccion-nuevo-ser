#!/bin/bash

# Script para crear keystore de firma para APKs release
# Ejecutar solo UNA VEZ y guardar el archivo my-release-key.jks en lugar seguro

echo "📦 Creando keystore de firma para Colección Nuevo Ser"
echo ""
echo "IMPORTANTE: Guarda la contraseña que elijas en un lugar seguro."
echo "Si pierdes este archivo o la contraseña, NO podrás actualizar la app."
echo ""

keytool -genkey -v -keystore my-release-key.jks \
  -alias nuevosser \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

echo ""
echo "✅ Keystore creado: my-release-key.jks"
echo ""
echo "IMPORTANTE:"
echo "1. Haz BACKUP de este archivo (my-release-key.jks)"
echo "2. Guarda la contraseña en lugar seguro (password manager)"
echo "3. NUNCA subas este archivo a Git/GitHub"
echo ""
echo "Ahora configura android/app/build.gradle con la firma."
