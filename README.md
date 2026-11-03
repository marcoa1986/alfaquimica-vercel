# ALFA QUÍMICA — sitio web con catálogo y cotizador

Sitio estático (HTML + JS): **sin base de datos, sin compilar**. Todo se edita en `index.html`.

## Publicar en Vercel
Sube la carpeta tal cual (Framework: *Other*, sin build). Para probar local: `python3 -m http.server` y abre `http://localhost:8000`.

## Qué se edita (bloque `CONFIG` y `CATALOGO` en `index.html`)
| Qué | Dónde |
|---|---|
| WhatsApp de ventas | `CONFIG.whatsapp` (52 + 10 dígitos). Actual: **525560996720** |
| Correo mostrado en el pie | `CONFIG.correoVentas` |
| Envío por correo (EmailJS) | `CONFIG.emailjs` (3 datos) |
| IVA | `CONFIG.iva` (0.16 = 16 %; 0 si tus precios ya lo incluyen) |
| Condiciones del PDF | `CONFIG.condiciones` |
| Productos, presentaciones, precios, existencias | `CATALOGO` |

### Precios y existencias
Cada presentación tiene `precio` y `existencia`:
- `precio: null` → "Precio por confirmar" (el total queda "Por confirmar").
- `precio: 1850.50` → el cotizador calcula subtotal, IVA y total.
- `existencia`: `'disponible'`, `'bajo-pedido'` o `'consultar'`.
El sitio **no consulta inventario en tiempo real**: muestra lo que tú escribes aquí.

### Cambiar el WhatsApp desde el navegador
Abre `tusitio.com/#configuracion`. Guarda el número solo en ese navegador (para probar) y te da la línea para pegar en `CONFIG` y publicar.

## Cómo funciona la cotización
El cliente agrega productos → abre **Mi cotización** → llena sus datos → elige:
1. **WhatsApp**: abre un mensaje formal con folio, partidas y totales, que pide confirmar existencias, tiempo de entrega, precio/pago y vigencia.
2. **PDF**: descarga la cotización (jsPDF local en `vendor/`, se carga solo al descargar).
3. **Correo** (EmailJS): el botón aparece **solo si llenas los 3 datos** de `CONFIG.emailjs`.

### Activar el correo con EmailJS
1. Crea cuenta en emailjs.com, conecta tu correo (*Email Services*) → copia **Service ID**.
2. Crea una plantilla (*Email Templates*) → copia **Template ID**. Destinatario ("To Email") = tu correo de ventas; en "Reply To" usa `{{reply_to}}`.
   Asunto sugerido: `Cotización {{folio}} — {{empresa}}`
   Cuerpo sugerido:
   ```
   Folio: {{folio}}   Fecha: {{fecha}}
   Empresa: {{empresa}}
   Contacto: {{contacto}} · Tel. {{telefono}} · {{correo}}
   CP de entrega: {{cp}} · Fecha requerida: {{fecha_requerida}}
   Documentación: {{documentos}}

   {{resumen}}

   Total: {{total}}
   Notas: {{notas}}
   ```
3. En *Account* copia tu **Public Key**. Pégalos en `CONFIG.emailjs`.
4. Seguridad: en EmailJS restringe el uso a tu dominio y activa límites de envío (la Public Key es visible en el navegador).

## Imágenes y fichas
- `assets/pack-tambor.jpg` y `assets/pack-ibc.jpg`: fotos por presentación (campo `imagen`). Cámbialas por fotos reales de tus productos cuando las tengas.
- `fichas-tecnicas/`: coloca los PDF (ver `LEEME.txt`). Si no existen, el botón ofrece pedirlos por WhatsApp.

## Antes de publicar, confirma
- Pureza/concentración de cada producto y los textos del hero ("alta pureza") contra tu ficha técnica.
- Presentaciones (Tambor 200 L, IBC 1,000 L) y su disponibilidad.
- Tasa de IVA aplicable.
