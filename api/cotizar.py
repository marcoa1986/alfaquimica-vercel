"""Vercel: POST /api/cotizar. Guarda la cotización y devuelve folio y token (para el PDF)."""
import json
import os
import secrets
from datetime import datetime
from http.server import BaseHTTPRequestHandler

import psycopg2

VERSION_AVISO = "2026-11-01"


def _ip(headers):
    return headers.get("x-forwarded-for", "").split(",")[0].strip() or None


def guardar(datos, ip):
    if datos.get("acepta_aviso") is not True:
        return 400, {"error": "Debes aceptar el aviso de privacidad"}
    nombre = (datos.get("nombre") or "").strip()
    correo = (datos.get("correo") or "").strip()
    if not nombre:
        return 400, {"error": "El nombre de contacto es obligatorio"}
    if correo and "@" not in correo:
        return 400, {"error": "El correo no tiene un formato válido"}

    token = secrets.token_urlsafe(24)
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT nextval(pg_get_serial_sequence('cotizacion','id'))")
            folio = f"COT-{datetime.now():%Y}-{cur.fetchone()[0]:05d}"
            cur.execute("""
                INSERT INTO public.cotizacion
                  (folio, token, nombre, correo, telefono, empresa, mensaje,
                   acepta_aviso, version_aviso, fecha_aceptacion, ip_origen)
                VALUES (%s,%s,%s,%s,%s,%s,%s,TRUE,%s,%s,%s)
            """, (folio, token, nombre, correo or None, datos.get("telefono"), datos.get("empresa"),
                  datos.get("mensaje"), VERSION_AVISO, datetime.now(), ip))
        conn.commit()
        return 200, {"folio": folio, "token": token}
    except Exception:
        conn.rollback()
        return 500, {"error": "No fue posible guardar la cotización"}
    finally:
        conn.close()


class handler(BaseHTTPRequestHandler):
    def _responder(self, status, cuerpo):
        data = json.dumps(cuerpo, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        try:
            largo = int(self.headers.get("content-length", 0))
            datos = json.loads(self.rfile.read(largo) or b"{}")
        except (ValueError, json.JSONDecodeError):
            return self._responder(400, {"error": "Solicitud inválida"})
        status, cuerpo = guardar(datos, _ip(self.headers))
        self._responder(status, cuerpo)
