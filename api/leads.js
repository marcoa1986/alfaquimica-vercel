import { neon } from "@neondatabase/serverless";

function clean(value, maxLength = 2000) {
  if (typeof value !== "string") return null;

  const result = value.trim().slice(0, maxLength);
  return result || null;
}

export default async function handler(req, res) {

  // 1. Validar método HTTP
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      ok: false,
      message: "Método no permitido. Utiliza POST."
    });
  }

  // 2. Validar variable de entorno
  const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.DATABASE_URL_POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED;

  if (!databaseUrl) {
    console.error("DATABASE_URL no está configurada.");

    return res.status(500).json({
      ok: false,
      message: "La conexión a PostgreSQL no está configurada."
    });
  }

  try {

    // 3. Inicializar conexión dentro del controlador
    const sql = neon(databaseUrl);

    const body = req.body || {};

    // 4. Obtener y limpiar información
    const nombre = clean(body.nombre, 150);
    const empresa = clean(body.empresa, 180);
    const correo = clean(body.correo, 180);
    const telefono = clean(body.telefono, 30);
    const producto = clean(body.producto, 5000);
    const cantidad = clean(body.cantidad, 2000);
    const codigoPostal = clean(body.codigo_postal, 15);

    const avisoAceptado =
      body.privacy_accepted === true;

    const marketingAutorizado =
      body.marketing_consent === true;

    // 5. Validar campos obligatorios
    if (!nombre || !producto) {
      return res.status(400).json({
        ok: false,
        message: "El nombre y el producto son obligatorios."
      });
    }

    if (!avisoAceptado) {
      return res.status(400).json({
        ok: false,
        message: "Debes aceptar el aviso de privacidad."
      });
    }

    if (
      correo &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
    ) {
      return res.status(400).json({
        ok: false,
        message: "El correo electrónico no es válido."
      });
    }

    // 6. Insertar prospecto en Neon PostgreSQL
    const result = await sql`
      INSERT INTO alfa_leads (
        nombre,
        empresa,
        correo,
        telefono,
        producto,
        cantidad,
        codigo_postal,
        aviso_aceptado,
        marketing_autorizado,
        version_aviso
      )
      VALUES (
        ${nombre},
        ${empresa},
        ${correo},
        ${telefono},
        ${producto},
        ${cantidad},
        ${codigoPostal},
        ${avisoAceptado},
        ${marketingAutorizado},
        '1.0'
      )
      RETURNING id, fecha_registro
    `;

    // 7. Confirmar registro
    return res.status(201).json({
      ok: true,
      message: "Prospecto registrado correctamente.",
      lead: {
        id: result[0].id,
        fecha_registro: result[0].fecha_registro
      }
    });

  } catch (error) {

    console.error("Error al registrar prospecto:", error);

    return res.status(500).json({
      ok: false,
      message: "No fue posible guardar el prospecto.",
      error: process.env.NODE_ENV === "development"
        ? error.message
        : undefined
    });
  }
}