# ALFA QUÍMICA — Centro documental dinámico

Este paquete agrega el módulo público de documentos y el proyecto independiente de Sanity Studio. No reemplaza el sitio actual ni modifica `/api/leads` o Neon.

## A. Crear el proyecto Sanity desde cero

1. Entra a https://www.sanity.io/ y crea una cuenta/proyecto para ALFA QUÍMICA.
2. Copia el **Project ID** del proyecto recién creado.
3. En PowerShell, desde la raíz del repositorio:

   ```powershell
   cd studio
   Copy-Item .env.example .env
   notepad .env
   ```

4. En `studio/.env`, sustituye el valor de `SANITY_STUDIO_PROJECT_ID` por el Project ID real. Conserva `SANITY_STUDIO_DATASET=production`.
5. Instala y ejecuta:

   ```powershell
   npm install
   npm run dev
   ```

6. Abre la dirección local que indique Sanity. Inicia sesión y autoriza tu usuario como miembro del proyecto.

> El `.env` real está ignorado por Git. No publiques tokens ni credenciales.

## B. Configurar CORS en Sanity

En Sanity Manage → tu proyecto → API → CORS origins, agrega:
- `http://localhost:3000`
- `http://localhost:3333`
- `https://alfaquimica.com`
- `https://www.alfaquimica.com` (solo si el dominio www está configurado)

Agrega el origen exacto que uses para pruebas en Vercel. Para lectura pública desde navegador, configura los orígenes del sitio. No habilites credenciales para el sitio público.

## C. Configurar el sitio público

1. Copia `assets/documentos.css` y `assets/documentos.js` a la carpeta `assets/` de tu sitio.
2. Sigue `INTEGRACION-INDEX.html.txt` para insertar el CSS, la sección HTML y el script en el `index.html` existente.
3. En `assets/documentos.js`, sustituye:

   ```js
   projectId: "REEMPLAZAR_CON_PROJECT_ID"
   ```

   por el Project ID real. El Project ID no es una contraseña. No coloques API tokens en este archivo.
4. Verifica que el dataset sea `production` tanto en Sanity como en `documentos.js`.

## D. Cargar documentos y administrar versiones

En Sanity Studio:
1. Crea un documento `Documento técnico`.
2. Captura título, código de agrupación, producto, categoría, descripción, versión y fecha de emisión.
3. Adjunta un PDF.
4. Para una nueva versión del mismo documento, crea otro registro y reutiliza exactamente el mismo `codigoDocumento`; cambia versión, fecha y archivo.
5. Activa `Publicar en la página web` y publica el documento.

El centro público agrupa por código y muestra la versión más reciente. En vista previa permite cambiar entre las versiones publicadas de ese código. Los documentos no publicados no se consultan.

## E. Ejecutar y publicar Sanity Studio

Desde `studio/`:

```powershell
npm run build
npm run deploy
```

El comando `npm run deploy` publica el Studio alojado por Sanity y puede solicitar confirmación de hostname. El Studio es independiente de Vercel.

## F. Pruebas QA antes de producción

- Documento publicado: aparece en el catálogo.
- Documento no publicado: no aparece.
- Buscar por título, producto y palabras clave.
- Filtrar por cada categoría.
- Vista previa y descarga del PDF.
- Dos versiones con el mismo código: aparecen agrupadas y se puede elegir versión.
- PDF eliminado o sin archivo: no debe aparecer.
- Probar escritorio y móvil.
- Verificar que el formulario de prospectos siga registrando en Neon.

## Consideraciones de seguridad y operación

- Los archivos publicados en Sanity son accesibles públicamente mediante su URL. No cargues documentos confidenciales.
- El panel Sanity se protege con autenticación y membresía del proyecto. Da permisos de edición solo a usuarios autorizados.
- La lectura pública utiliza el API CDN de Sanity sin token. No se necesita `DATABASE_URL` ni una credencial de Neon para este módulo.
- No se modifican los endpoints de prospectos ni se exponen secretos.
- Revisa que las fichas y hojas SDS sean documentos vigentes y autorizados antes de publicarlos.
