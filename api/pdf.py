"""Vercel: GET /api/pdf?token=... Registra la descarga y devuelve el PDF de la cotización."""
import io
import os
import textwrap
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

import psycopg2
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


def generar_pdf(c):
    buf = io.BytesIO()
    p = canvas.Canvas(buf, pagesize=letter)
    y = 730
    p.setFont("Helvetica-Bold", 16)
    p.drawString(72, y, "Solicitud de cotización")
    y -= 32
    p.setFont("Helvetica", 11)
    campos = [("Folio", c["folio"]), ("Fecha", c["fecha"]), ("Nombre", c["nombre"]),
              ("Empresa", c["empresa"] or "-"), ("Correo", c["correo"] or "-"),
              ("Teléfono", c["telefono"] or "-")]
    for etiqueta, valor in campos:
        p.drawString(72, y, f"{etiqueta}: {valor}")
        y -= 18
    y -= 12
    p.drawString(72, y, "Mensaje:")
    y -= 18
    for linea in textwrap.wrap(c["mensaje"] or "-", 90):
        p.drawString(72, y, linea)
        y -= 16
    p.showPage()
    p.save()
    return buf.getvalue()


def _ip(headers):
    return headers.get("x-forwarded-for", "").split(",")[0].strip() or None


class handler(BaseHTTPRequestHandler):
    def _error(self, status, mensaje):
        data = mensaje.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        token = (parse_qs(urlparse(self.path).query).get("token") or [""])[0]
        if not token or len(token) > 64:
            return self._error(404, "No encontrado")

        conn = psycopg2.connect(os.environ["DATABASE_URL"])
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT folio, nombre, correo, telefono, empresa, mensaje,
                           to_char(creado_en, 'DD/MM/YYYY HH24:MI')
                    FROM public.cotizacion WHERE token = %s
                """, (token,))
                row = cur.fetchone()
                if not row:
                    return self._error(404, "No encontrado")
                cur.execute("""
                    INSERT INTO public.cotizacion_descarga (folio, ip_origen, user_agent)
                    VALUES (%s, %s, %s)
                """, (row[0], _ip(self.headers), self.headers.get("user-agent", "")[:500]))
            conn.commit()
        except Exception:
            conn.rollback()
            return self._error(500, "No fue posible generar el PDF")
        finally:
            conn.close()

        c = dict(zip(["folio", "nombre", "correo", "telefono", "empresa", "mensaje", "fecha"], row))
        pdf = generar_pdf(c)
        self.send_response(200)
        self.send_header("Content-Type", "application/pdf")
        self.send_header("Content-Disposition", f'inline; filename="{c["folio"]}.pdf"')
        self.send_header("Content-Length", str(len(pdf)))
        self.end_headers()
        self.wfile.write(pdf)
