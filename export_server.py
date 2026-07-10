"""
export_server.py — Servidor Flask para exportación de datos a Excel
Genius Dashboard · Puerto 5001

Endpoints:
  GET /api/export/campaigns          → Excel con campañas + gráficas
  GET /api/export/leads              → Excel con leads por landing + gráfica
  GET /api/export/full               → Excel completo (campañas + leads + resumen)

Uso:
  python3 export_server.py
"""

import io
import requests
from datetime import datetime
from flask import Flask, send_file, jsonify
from flask_cors import CORS
import xlsxwriter

app = Flask(__name__)
CORS(app)

BUDGET_API = "http://localhost:8080/api"
CRM_API    = "http://localhost:3000/api"

# ── Paleta de estilos ────────────────────────────────────────────────────────

NAVY   = "#0F172A"
BLUE   = "#2563EB"
GREEN  = "#16A34A"
ORANGE = "#D97706"
RED    = "#DC2626"
WHITE  = "#FFFFFF"
GRAY   = "#F8FAFC"
BORDER = "#E2E8F0"


def fetch_campaigns(client=None):
    params = {}
    if client:
        params["client"] = client
    try:
        r = requests.get(f"{BUDGET_API}/campaigns", params=params, timeout=5)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"[export] Error al obtener campañas: {e}")
        return []


def fetch_leads_summary():
    try:
        r = requests.get(f"{CRM_API}/landings/summary", timeout=5)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"[export] Error al obtener leads: {e}")
        return []


def status_color(status):
    s = (status or "").lower()
    if s in ("active", "activa"):   return GREEN
    if s in ("paused", "pausada"):  return ORANGE
    if s in ("closed", "cerrada"):  return RED
    return "#6B7280"


# ── Función principal de generación Excel ────────────────────────────────────

def build_workbook(client_filter=None, include_leads=True, include_campaigns=True):
    output = io.BytesIO()
    wb = xlsxwriter.Workbook(output, {"in_memory": True})

    # Fetch data up front to avoid scope issues
    campaigns     = fetch_campaigns(client_filter) if include_campaigns else []
    leads_raw     = fetch_leads_summary()           if include_leads    else []
    # Filter leads by client locally (CRM no soporta filtro por cliente en summary)
    if client_filter and leads_raw:
        leads_summary = [l for l in leads_raw if (l.get("client") or "").strip().lower() == client_filter.strip().lower()]
    else:
        leads_summary = leads_raw

    # ── Formatos globales ────────────────────────────────────────────────────
    fmt_title = wb.add_format({
        "bold": True, "font_size": 14, "font_color": NAVY,
        "font_name": "Calibri", "bottom": 2, "bottom_color": BLUE,
    })
    fmt_subtitle = wb.add_format({
        "italic": True, "font_size": 10, "font_color": "#64748B",
        "font_name": "Calibri",
    })
    fmt_header = wb.add_format({
        "bold": True, "font_color": WHITE, "bg_color": NAVY,
        "font_name": "Calibri", "font_size": 10,
        "border": 1, "border_color": "#1E293B",
        "align": "center", "valign": "vcenter",
    })
    fmt_row = wb.add_format({
        "font_name": "Calibri", "font_size": 10,
        "border": 1, "border_color": BORDER,
        "valign": "vcenter",
    })
    fmt_row_alt = wb.add_format({
        "font_name": "Calibri", "font_size": 10,
        "bg_color": "#F8FAFC",
        "border": 1, "border_color": BORDER,
        "valign": "vcenter",
    })
    fmt_currency = wb.add_format({
        "font_name": "Calibri", "font_size": 10,
        "num_format": "$#,##0.00",
        "border": 1, "border_color": BORDER,
        "align": "right", "valign": "vcenter",
    })
    fmt_currency_alt = wb.add_format({
        "font_name": "Calibri", "font_size": 10,
        "num_format": "$#,##0.00", "bg_color": "#F8FAFC",
        "border": 1, "border_color": BORDER,
        "align": "right", "valign": "vcenter",
    })
    fmt_pct = wb.add_format({
        "font_name": "Calibri", "font_size": 10,
        "num_format": "0.00%",
        "border": 1, "border_color": BORDER,
        "align": "center", "valign": "vcenter",
    })
    fmt_pct_alt = wb.add_format({
        "font_name": "Calibri", "font_size": 10,
        "num_format": "0.00%", "bg_color": "#F8FAFC",
        "border": 1, "border_color": BORDER,
        "align": "center", "valign": "vcenter",
    })
    fmt_center = wb.add_format({
        "font_name": "Calibri", "font_size": 10,
        "border": 1, "border_color": BORDER,
        "align": "center", "valign": "vcenter",
    })
    fmt_center_alt = wb.add_format({
        "font_name": "Calibri", "font_size": 10,
        "bg_color": "#F8FAFC",
        "border": 1, "border_color": BORDER,
        "align": "center", "valign": "vcenter",
    })
    fmt_kpi_label = wb.add_format({
        "bold": True, "font_name": "Calibri", "font_size": 11,
        "font_color": "#64748B", "align": "center",
    })
    fmt_kpi_value = wb.add_format({
        "bold": True, "font_name": "Calibri", "font_size": 18,
        "font_color": NAVY, "align": "center", "valign": "vcenter",
    })
    fmt_kpi_currency = wb.add_format({
        "bold": True, "font_name": "Calibri", "font_size": 16,
        "num_format": "$#,##0", "font_color": BLUE,
        "align": "center", "valign": "vcenter",
    })

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")

    # ════════════════════════════════════════════════════════════════
    # HOJA 1 — CAMPAÑAS
    # ════════════════════════════════════════════════════════════════
    if include_campaigns:
        campaigns = fetch_campaigns(client_filter)
        ws_c = wb.add_worksheet("Campañas")
        ws_c.set_tab_color(BLUE)
        ws_c.hide_gridlines(2)
        ws_c.set_zoom(90)

        # Anchos de columna
        ws_c.set_column("A:A", 30)   # Nombre
        ws_c.set_column("B:B", 20)   # Cliente
        ws_c.set_column("C:C", 16)   # Tipo
        ws_c.set_column("D:D", 14)   # Estado
        ws_c.set_column("E:E", 18)   # Presupuesto
        ws_c.set_column("F:F", 18)   # Gastado
        ws_c.set_column("G:G", 14)   # % Consumido
        ws_c.set_column("H:H", 10)   # Moneda
        ws_c.set_column("I:I", 14)   # Fecha inicio
        ws_c.set_column("J:J", 14)   # Fecha fin

        # Título
        ws_c.write("A1", "Genius Dashboard — Reporte de Campañas", fmt_title)
        ws_c.write("A2", f"Generado: {now_str}" + (f"  |  Filtro cliente: {client_filter}" if client_filter else ""), fmt_subtitle)
        ws_c.set_row(0, 22)
        ws_c.set_row(1, 14)

        # Headers
        headers = ["Campaña", "Cliente", "Tipo", "Estado", "Presupuesto", "Gastado", "% Consumido", "Moneda", "Fecha inicio", "Fecha fin"]
        for col, h in enumerate(headers):
            ws_c.write(3, col, h, fmt_header)
        ws_c.set_row(3, 20)

        # Datos
        for i, c in enumerate(campaigns):
            row = 4 + i
            is_alt = i % 2 == 1
            rf  = fmt_row_alt      if is_alt else fmt_row
            rfc = fmt_currency_alt if is_alt else fmt_currency
            rfp = fmt_pct_alt      if is_alt else fmt_pct
            rce = fmt_center_alt   if is_alt else fmt_center

            budget = float(c.get("budget") or 0)
            spent  = float(c.get("spent")  or 0)
            pct    = (spent / budget) if budget > 0 else 0

            ws_c.write(row, 0, c.get("name", ""), rf)
            ws_c.write(row, 1, c.get("client", ""), rf)
            ws_c.write(row, 2, c.get("type", ""), rce)
            ws_c.write(row, 3, c.get("status", ""), rce)
            ws_c.write(row, 4, budget, rfc)
            ws_c.write(row, 5, spent,  rfc)
            ws_c.write(row, 6, pct,    rfp)
            ws_c.write(row, 7, c.get("currency", "ARS"), rce)
            ws_c.write(row, 8, c.get("startDate", ""), rce)
            ws_c.write(row, 9, c.get("endDate",   ""), rce)
            ws_c.set_row(row, 18)

    # ── Gráfica 1: Presupuesto por campaña (barras) ──────────────────────
        if campaigns:
            chart_budget = wb.add_chart({"type": "bar"})
            n = len(campaigns)
            chart_budget.add_series({
                "name":       "Presupuesto",
                "categories": ["Campañas", 4, 0, 3 + n, 0],
                "values":     ["Campañas", 4, 4, 3 + n, 4],
                "fill":       {"color": BLUE},
                "gap":        80,
            })
            chart_budget.add_series({
                "name":       "Gastado",
                "categories": ["Campañas", 4, 0, 3 + n, 0],
                "values":     ["Campañas", 4, 5, 3 + n, 5],
                "fill":       {"color": ORANGE},
                "gap":        80,
            })
            chart_budget.set_title({"name": "Presupuesto vs Gastado por Campaña"})
            chart_budget.set_x_axis({"name": "ARS", "num_format": "$#,##0"})
            chart_budget.set_y_axis({"name": "Campaña"})
            chart_budget.set_legend({"position": "bottom"})
            chart_budget.set_size({"width": 600, "height": 340})
            chart_budget.set_chartarea({"border": {"color": BORDER}})
            ws_c.insert_chart(f"L4", chart_budget)

            # ── Gráfica 2: Distribución de estados (donut) ───────────────────
            status_count = {}
            for c in campaigns:
                s = c.get("status", "unknown")
                status_count[s] = status_count.get(s, 0) + 1

            ws_s = wb.add_worksheet("_status_data")
            ws_s.hide()
            ws_s.write(0, 0, "Estado")
            ws_s.write(0, 1, "Cantidad")
            for i, (s, cnt) in enumerate(status_count.items()):
                ws_s.write(i + 1, 0, s)
                ws_s.write(i + 1, 1, cnt)

            chart_donut = wb.add_chart({"type": "doughnut"})
            chart_donut.add_series({
                "name":       "Estados",
                "categories": ["_status_data", 1, 0, len(status_count), 0],
                "values":     ["_status_data", 1, 1, len(status_count), 1],
                "data_labels": {"percentage": True, "category": True},
                "points": [
                    {"fill": {"color": GREEN}},
                    {"fill": {"color": ORANGE}},
                    {"fill": {"color": RED}},
                    {"fill": {"color": "#6B7280"}},
                ],
            })
            chart_donut.set_title({"name": "Distribución de Estados"})
            chart_donut.set_legend({"position": "right"})
            chart_donut.set_size({"width": 380, "height": 260})
            ws_c.insert_chart("L24", chart_donut)

    if include_leads:
        ws_l = wb.add_worksheet("Leads por Landing")
        ws_l.set_tab_color(GREEN)
        ws_l.hide_gridlines(2)
        ws_l.set_zoom(90)

        ws_l.set_column("A:A", 34)
        ws_l.set_column("B:B", 20)
        ws_l.set_column("C:C", 14)
        ws_l.set_column("D:D", 14)

        ws_l.write("A1", "Genius Dashboard — Leads por Landing Page", fmt_title)
        ws_l.write("A2", f"Generado: {now_str}", fmt_subtitle)
        ws_l.set_row(0, 22)
        ws_l.set_row(1, 14)

        headers_l = ["Landing Page", "Cliente", "Estado", "Leads captados"]
        for col, h in enumerate(headers_l):
            ws_l.write(3, col, h, fmt_header)
        ws_l.set_row(3, 20)

        for i, l in enumerate(leads_summary):
            row = 4 + i
            is_alt = i % 2 == 1
            rf  = fmt_row_alt    if is_alt else fmt_row
            rce = fmt_center_alt if is_alt else fmt_center

            ws_l.write(row, 0, l.get("name",      ""), rf)
            ws_l.write(row, 1, l.get("client",    ""), rf)
            ws_l.write(row, 2, l.get("status",    ""), rce)
            ws_l.write(row, 3, l.get("leadCount", 0),  rce)
            ws_l.set_row(row, 18)

        # ── Gráfica: Leads por landing (barras horizontales) ─────────────────
        if leads_summary:
            n = len(leads_summary)
            chart_leads = wb.add_chart({"type": "bar"})
            chart_leads.add_series({
                "name":       "Leads",
                "categories": ["Leads por Landing", 4, 0, 3 + n, 0],
                "values":     ["Leads por Landing", 4, 3, 3 + n, 3],
                "fill":       {"color": BLUE},
                "data_labels": {"value": True},
                "gap":        60,
            })
            chart_leads.set_title({"name": "Leads captados por Landing Page"})
            chart_leads.set_x_axis({"name": "Cantidad de leads", "min": 0})
            chart_leads.set_y_axis({"name": "Landing"})
            chart_leads.set_legend({"none": True})
            chart_leads.set_size({"width": 560, "height": 320})
            chart_leads.set_chartarea({"border": {"color": BORDER}})
            ws_l.insert_chart("F4", chart_leads)

    # ════════════════════════════════════════════════════════════════
    # HOJA 3 — RESUMEN EJECUTIVO
    # ════════════════════════════════════════════════════════════════
    ws_r = wb.add_worksheet("Resumen")
    ws_r.set_tab_color(NAVY)
    ws_r.hide_gridlines(2)
    ws_r.set_zoom(90)
    ws_r.set_column("A:A", 4)
    ws_r.set_column("B:H", 18)

    ws_r.write("B2", "Genius Dashboard — Resumen Ejecutivo", fmt_title)
    ws_r.write("B3", f"Generado: {now_str}" + (f"  |  Cliente: {client_filter}" if client_filter else "  |  Todos los clientes"), fmt_subtitle)

    if include_campaigns:
        total_budget  = sum(float(c.get("budget") or 0) for c in campaigns)
        total_spent   = sum(float(c.get("spent")  or 0) for c in campaigns)
        active_count  = sum(1 for c in campaigns if (c.get("status") or "").lower() in ("active", "activa"))
        total_count   = len(campaigns)
        pct_consumed  = (total_spent / total_budget * 100) if total_budget > 0 else 0

        fmt_kpi_box = wb.add_format({"bg_color": GRAY, "border": 1, "border_color": BORDER})

        ws_r.write("B5", "Total campañas", fmt_kpi_label)
        ws_r.write("C5", "Campañas activas", fmt_kpi_label)
        ws_r.write("D5", "Presupuesto total", fmt_kpi_label)
        ws_r.write("E5", "Total gastado", fmt_kpi_label)
        ws_r.write("F5", "% Consumido", fmt_kpi_label)
        ws_r.set_row(4, 16)

        ws_r.write("B6", total_count,   fmt_kpi_value)
        ws_r.write("C6", active_count,  fmt_kpi_value)
        ws_r.write("D6", total_budget,  fmt_kpi_currency)
        ws_r.write("E6", total_spent,   fmt_kpi_currency)
        ws_r.write("F6", f"{pct_consumed:.1f}%", fmt_kpi_value)
        ws_r.set_row(5, 36)

    if include_leads:
        total_leads = sum(l.get("leadCount", 0) for l in leads_summary)
        top_landing = max(leads_summary, key=lambda x: x.get("leadCount", 0), default={})

        ws_r.write("B8", "Total leads captados", fmt_kpi_label)
        ws_r.write("C8", "Landing con más leads", fmt_kpi_label)
        ws_r.set_row(7, 16)

        ws_r.write("B9", total_leads, fmt_kpi_value)
        ws_r.write("C9", top_landing.get("name", "—"), fmt_kpi_value)
        ws_r.set_row(8, 36)

    wb.close()
    output.seek(0)
    return output


# ── Endpoints Flask ──────────────────────────────────────────────────────────

@app.route("/api/export/full")
def export_full():
    from flask import request
    client = request.args.get("client") or None
    output = build_workbook(client_filter=client, include_campaigns=True, include_leads=True)
    suffix = f"_{client}" if client else ""
    filename = f"genius_reporte{suffix}_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
    return send_file(
        output,
        as_attachment=True,
        download_name=filename,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


@app.route("/api/export/campaigns")
def export_campaigns():
    from flask import request
    client = request.args.get("client")
    output = build_workbook(client_filter=client, include_campaigns=True, include_leads=False)
    filename = f"genius_campanas_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
    return send_file(
        output,
        as_attachment=True,
        download_name=filename,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


@app.route("/api/export/leads")
def export_leads():
    output = build_workbook(include_campaigns=False, include_leads=True)
    filename = f"genius_leads_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
    return send_file(
        output,
        as_attachment=True,
        download_name=filename,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


@app.route("/api/export/health")
def health():
    return jsonify({"status": "ok", "service": "genius-export", "port": 5001})


if __name__ == "__main__":
    print("🟢 Genius Export Server corriendo en http://localhost:5001")
    print("   GET /api/export/full       → Reporte completo (campañas + leads)")
    print("   GET /api/export/campaigns  → Solo campañas")
    print("   GET /api/export/leads      → Solo leads por landing")
    app.run(host="0.0.0.0", port=5001, debug=False)
