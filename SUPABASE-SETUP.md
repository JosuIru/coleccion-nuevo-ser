# 🔧 Guía Rápida: Configurar Base de Datos Supabase

## ❌ Errores Actuales

Los siguientes errores en consola indican que las tablas no existen en Supabase:

```
❌ 406 Not Acceptable - reading_progress
❌ 406 Not Acceptable - achievements
❌ 404 Not Found - bookmarks
```

## ✅ Solución en 3 Pasos

### Paso 1: Abrir SQL Editor en Supabase

1. Ve a: https://supabase.com/dashboard/project/flxrilsxghiqfsfifxch/sql
2. Asegúrate de estar autenticado con tu cuenta

### Paso 2: Ejecutar el Schema SQL

1. Abre el archivo `SUPABASE-SCHEMA-COMPLETO-v2.8.6.sql` (en la raíz del proyecto)
2. Copia **TODO** el contenido (454 líneas)
3. Pégalo en el SQL Editor de Supabase
4. Haz clic en **"Run"** (esquina inferior derecha)

### Paso 3: Verificar Creación de Tablas

Después de ejecutar, deberías ver en la consola:

```
✅ Tablas creadas correctamente (9 tablas)
```

Verifica que existen estas tablas en tu proyecto:

- ✅ `profiles` - Perfiles de usuario
- ✅ `reading_progress` - Progreso de lectura
- ✅ `notes` - Notas de usuario
- ✅ `achievements` - Logros desbloqueados
- ✅ `bookmarks` - Marcadores
- ✅ `user_settings` - Configuración de usuario
- ✅ `reflections` - Reflexiones de capítulos
- ✅ `action_plans` - Planes de acción
- ✅ `koan_history` - Historial de koans

## 🔒 Seguridad (RLS)

El script configura automáticamente:

- ✅ Row Level Security (RLS) en todas las tablas
- ✅ Políticas para que cada usuario solo vea sus propios datos
- ✅ Triggers para actualizar `updated_at` automáticamente
- ✅ Función para crear perfil automáticamente al registrarse

## 🧪 Probar que Funciona

Después de ejecutar el SQL:

1. Recarga la aplicación web (Ctrl+Shift+R para forzar cache)
2. Abre la consola del navegador (F12)
3. Los errores 404/406 deberían desaparecer
4. Verifica que puedes:
   - ✅ Crear notas
   - ✅ Guardar progreso de lectura
   - ✅ Desbloquear logros
   - ✅ Añadir marcadores
   - ✅ Guardar reflexiones

## ⚠️ Importante

- **NO modifiques manualmente las tablas** después de crearlas con el script
- Si necesitas resetear la base de datos, puedes volver a ejecutar el script (usa `CREATE TABLE IF NOT EXISTS`)
- El script usa `DROP POLICY IF EXISTS` para evitar conflictos si re-ejecutas

## 🆘 Si Siguen los Errores

1. Verifica que las credenciales en `supabase-config.js` son correctas:
   - `SUPABASE_URL`: https://flxrilsxghiqfsfifxch.supabase.co
   - `SUPABASE_ANON_KEY`: (tu clave anónima pública)

2. Verifica que el usuario está autenticado antes de hacer sync:
   - La app debe hacer login primero
   - Sin autenticación, RLS bloqueará todas las peticiones

3. Revisa logs de Supabase:
   - https://supabase.com/dashboard/project/flxrilsxghiqfsfifxch/logs

## 📚 Estructura de Datos

Todas las tablas tienen:
- `user_id` - Referencia a `auth.users(id)`
- `created_at` - Timestamp de creación
- `updated_at` - Timestamp de última modificación (auto-actualizado)
- RLS habilitado para aislar datos por usuario

---

**¿Dudas?** Revisa el archivo `SUPABASE-SCHEMA-COMPLETO-v2.8.6.sql` que tiene comentarios detallados.
