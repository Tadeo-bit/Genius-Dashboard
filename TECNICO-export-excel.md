# Documento Técnico — Exportación a Excel (`export_server.py`)

> **Genius Dashboard · Genius Agency**  
> Fecha: 2026-07-10  
> Rama: `dev`

---

## 1. Objetivo

Permitir al usuario del Dashboard descargar un archivo `.xlsx` con los datos actualmente mostrados en pantalla — incluyendo campañas, leads y resumen ejecutivo — con formato profesional y gráficas incrustadas, sin necesidad de procesos manuales ni herramientas externas.

---

## 2. Arquitectura de la solución

```
┌─────────────────────┐      GET /api/export/full      ┌──────────────────────┐
│  Genius Dashboard   │ ──────────────────────────────▶│  export_server.py    │
│  React + Vite       │◀──────────────────────────────  │  Flask · Puerto 5001 │
│  :5173              │     archivo .xlsx (binary)      └──────────┬───────────┘
└─────────────────────┘                                            │
                                                          ┌────────▼────────────┐
                                                          │  Budget Manager API │
                                                          │  Java · :8080       │
                                                          └────────┬────────────┘
                                                          ┌────────▼────────────┐
                                                          │  Landing CRM API    │
                                                          │  Node.js · :3000    │
                                                          └─────────────────────┘
```

### Componentes

| Componente | Tecnología | Responsabilidad |
|---|---|---|
| `export_server.py` | Python 3 · Flask · xlsxwriter | Servidor HTTP que genera y sirve el archivo Excel |
| `vite.config.js` | Vite proxy | Redirige `/api/export/*` → `localhost:5001` (evita CORS) |
| `Dashboard.jsx` | React | Botón "Exportar Excel" + lógica de descarga en el navegador |

---

## 3. Dependencias Python

```bash
pip3 install xlsxwriter flask flask-cors requests
```

| Paquete | Versión mínima | Uso |
|---|---|---|
| `xlsxwriter` | 3.x | Generación de archivos `.xlsx` con formato y gráficas |
| `flask` | 3.x | Servidor HTTP mínimo para exponer los endpoints |
| `flask-cors` | 6.x | Habilita CORS para que el navegador pueda hacer `fetch` |
| `requests` | 2.x | Llamadas HTTP a Budget Manager y Landing CRM |

---

## 4. Endpoints

### `GET /api/export/full`

Genera un Excel completo con todas las hojas.

**Query params:**

| Param | Tipo | Descripción |
|---|---|---|
| `client` | `string` (opcional) | Filtra campañas y leads por nombre de cliente exacto |

**Respuesta:** `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**Ejemplo:**
```
GET /api/export/full?client=SueñoSimple
→ genius_reporte_SueñoSimple_20260710_1430.xlsx
```

---

### `GET /api/export/campaigns`

Solo la hoja de campañas + gráficas.

| Param | Tipo | Descripción |
|---|---|---|
| `client` | `string` (opcional) | Filtra por cliente |

---

### `GET /api/export/leads`

Solo la hoja de leads por landing.

---

### `GET /api/export/health`

```json
{ "status": "ok", "service": "genius-export", "port": 5001 }
```

---

## 5. Estructura del archivo Excel generado

### Hoja 1 — "Campañas"

| Columna | Tipo | Formato |
|---|---|---|
| Campaña | Texto | — |
| Cliente | Texto | — |
| Tipo | Texto | Centrado |
| Estado | Texto | Centrado |
| Presupuesto | Número | `$#,##0.00` |
| Gastado | Número | `$#,##0.00` |
| % Consumido | Número | `0.00%` |
| Moneda | Texto | Centrado |
| Fecha inicio | Texto | Centrado |
| Fecha fin | Texto | Centrado |

**Gráficas incrustadas:**
- **Barras agrupadas** — Presupuesto vs Gastado por campaña (azul / naranja)
- **Donut** — Distribución de estados (activa / pausada / cerrada / borrador)

### Hoja 2 — "Leads por Landing"

| Columna | Tipo | Formato |
|---|---|---|
| Landing Page | Texto | — |
| Cliente | Texto | — |
| Estado | Texto | Centrado |
| Leads captados | Número | Centrado |

**Gráfica:** Barras horizontales de leads por landing (azul, con etiquetas de valor).

### Hoja 3 — "Resumen"

KPIs ejecutivos: total campañas, campañas activas, presupuesto total, total gastado, % consumido, total leads, landing con más leads.

---

## 6. Estilos aplicados

| Elemento | Estilo |
|---|---|
| Header de columnas | Fondo `#0F172A` (navy), texto blanco, borde `#1E293B` |
| Filas pares | Fondo `#F8FAFC` (gris muy suave) |
| Filas impares | Fondo blanco |
| Celdas de moneda | Alineación derecha, formato `$#,##0.00` |
| Celdas de porcentaje | Alineación centrada, formato `0.00%` |
| KPI valores (Resumen) | Calibri 18pt bold, color navy/azul |

---

## 7. Flujo de datos

```
Usuario hace clic en "Exportar Excel"
        │
        ▼
Dashboard.jsx → fetch('/api/export/full?client=X')
        │
        ▼ (proxy Vite)
Flask recibe GET /api/export/full?client=X
        │
        ├── requests.get(Budget :8080/api/campaigns?client=X)
        │       └─▶ [ {id, name, client, budget, spent, status, ...} ]
        │
        ├── requests.get(CRM :3000/api/landings/summary)
        │       └─▶ [ {id, name, client, status, leadCount} ]
        │       └─▶ filtrado local por client si hay filtro activo
        │
        ├── xlsxwriter construye el .xlsx en memoria (BytesIO)
        │       ├── Hoja Campañas + gráficas
        │       ├── Hoja Leads por Landing + gráfica
        │       └── Hoja Resumen con KPIs
        │
        └── Flask devuelve el BytesIO como archivo adjunto
                │
                ▼
Dashboard.jsx crea un <a> temporal → dispara descarga del navegador
```

---

## 8. Filtro por cliente

El filtro de cliente seleccionado en el Dashboard se pasa como query param al servidor:

```js
// Dashboard.jsx
const params = clientFilter ? `?client=${encodeURIComponent(clientFilter)}` : ''
const res = await fetch(`/api/export/full${params}`)
```

En el servidor:

- **Campañas:** filtradas directamente en Budget Manager (`GET /api/campaigns?client=X`).
- **Leads:** el CRM no soporta filtro en `/api/landings/summary`, por lo que se aplica un filtrado local en Python después de obtener todos los registros.

---

## 9. Cómo ejecutar

```bash
# 1. Asegurarse de tener las dependencias instaladas
pip3 install xlsxwriter flask flask-cors requests

# 2. Iniciar el servidor de exportación (en una terminal aparte)
cd Genius-Dashboard
python3 export_server.py

# 3. El servidor queda disponible en http://localhost:5001
# El Dashboard ya tiene configurado el proxy para /api/export → :5001
```

> El Dashboard (`npm run dev`) y el `export_server.py` deben correr en paralelo. El servidor Flask es independiente del servidor Vite.

---

## 10. Limitaciones conocidas

| Limitación | Detalle |
|---|---|
| Datos en memoria | Budget Manager y Landing CRM no tienen persistencia. Si se resinician, los leads de prueba desaparecen. |
| Filtro de leads | El endpoint `/api/landings/summary` del CRM no soporta filtro por cliente; el filtrado se hace en Python. Si el CRM implementa ese filtro, se puede optimizar. |
| Sin autenticación | El endpoint de exportación no requiere autenticación. Agregar un token si se expone fuera de localhost. |
| Sin paginación | Si hay muchas campañas, todas se incluyen en el Excel. No hay límite implementado. |
