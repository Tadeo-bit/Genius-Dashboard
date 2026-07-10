# Estado del repositorio — Genius-Dashboard

> Reporte de estado generado el 2026-06-21. Para la documentación funcional y de uso, ver [README.md](README.md).

## Resumen

Panel web interno que unifica en una sola interfaz los datos de **Budget Manager** y **Landing CRM**: campañas, presupuestos y leads de todos los clientes. Es el frontend del ecosistema Genius.

| Campo | Valor |
|---|---|
| Repositorio | `Tadeo-bit/Genius-Dashboard` |
| Stack | React 18 · React Router 6 · Vite 5 |
| Versión | `0.1.0` (en desarrollo) |
| Persistencia | No aplica (consume APIs externas) |
| Puerto | `5173` |

## Estado de Git

| Campo | Valor |
|---|---|
| Rama actual | `feature/dashboard-kpi-charts` |
| Rama por defecto | `main` |
| Cambios sin commitear | Ninguno (working tree limpio) |
| Sincronización | Al día con `origin/feature/dashboard-kpi-charts` |
| Último commit | `63e7004 — feat(dashboard): edición inline de campañas, cambio rápido de estado y badges coloreados en Landings` |

## Estado funcional

**Implementado y operativo:**

- App React + Vite arrancable con `npm run dev`.
- Enrutado con 3 vistas: `/` (Dashboard), `/campaigns` (Campañas) y `/landings` (Landings).
- Layout con sidebar y resaltado del enlace activo.
- Clientes de API: `budgetManagerApi.js` y `landingCrmApi.js` (vía proxy de Vite).
- `.gitignore` configurado correctamente (`node_modules/` no trackeado).
- Degradación elegante: si una API no está disponible, las métricas muestran `—` sin romper la pantalla.
- **Dashboard**: 5 KPI cards con color dinámico + gauge de presupuesto + barras de leads por landing + selector de cliente global.
- **Campañas**: filtro por cliente, cambio rápido de estado inline, edición completa de todos los campos.
- **Landings**: badges de estado con colores correctos (inglés y español).

**Pendientes (TODOs en el código):**

- `GD-F03` — Columna de conteo de leads por landing en la vista Landings.
- Merge de `feature/dashboard-kpi-charts` → `dev` pendiente de revisión.

## Dependencias con otros repos

> Para datos reales, ambas APIs deben estar corriendo antes de abrir el Dashboard.

- **Genius-Budget** (Budget Manager) en `localhost:8080`.
- **Genius-CRM-main** (Landing CRM) en `localhost:3000`.

## Cómo ejecutar

```bash
npm install
npm run dev
# Panel: http://localhost:5173
```

**Requisitos:** Node.js 18+ y npm 9+.

## Historial de correcciones

### 2026-06-24 — GD-F01: corrección de proxies de Vite

**Problema detectado**

- El Dashboard mostraba `Error al conectar con las APIs: Landing CRM: 404` y `Budget Manager: 404`.
- El proxy de Vite eliminaba el prefijo `/api` al reescribir las rutas, enviando `/campaigns/summary` en vez de `/api/campaigns/summary`.

**Cambios realizados en `vite.config.js`**

- Proxy `/api/budget` ahora reescribe a `/api/*` (antes quitaba `/api` por completo).
- Proxy `/api/crm` ahora reescribe a `/api/*` (ídem).

**Verificaciones**

- `GET /api/budget/campaigns/summary` vía proxy responde 200.
- `GET /api/crm/landings/summary` vía proxy responde 200.
- Los errores `Landing CRM: 404` y `Budget Manager: 404` desaparecen en la UI.

---

### 2026-06-25 — Sección Campañas: filtro por cliente y botón crear (rama `dev`)

**Cambios realizados**

- `src/pages/Campaigns.jsx`:
  - Reemplazado input+datalist por `<select>` con opción "Todos los clientes" — elimina el bug de filtro bloqueado al seleccionar desde datalist.
  - Botón `+ Nueva campaña` (rojo, clase `btn-danger`) pendiente de implementación por otro integrante.
  - Filtro usa igualdad exacta (`===`) en lugar de `includes`.
- `src/services/budgetManagerApi.js`: agregada función `createCampaign(data)`.
- `src/index.css`: nuevas clases `.page-toolbar`, `.toolbar-actions`, `.filter-input`, `.btn-primary`, `.btn-danger`, `.form-card`, `.form-grid`.
- `.gitignore` creado — `node_modules/` eliminado del tracking (estaba commiteado por error en PR anterior).

---

### 2026-06-25/30 — Dashboard KPI + Gráficos (rama `feature/dashboard-kpi-charts`)

**Objetivo**

Implementar dashboard visual con KPIs en tiempo real orientado a toma de decisiones rápida para perfiles no técnicos.

**Dependencia instalada**

- `recharts` — librería de gráficos nativa de React.

**Cambios realizados**

- `src/pages/Dashboard.jsx` — reescritura completa:
  - **5 KPI cards**: campañas activas, presupuesto total, total gastado (con barra de progreso en color dinámico), presupuesto disponible, total leads (con nombre de landing top).
  - **Gauge de presupuesto** (`RadialBarChart`): muestra `% consumido` con color dinámico verde < 70% / naranja 70–90% / rojo ≥ 90%.
  - **Barras horizontales de leads** (`BarChart`): una barra por landing, azul si tiene leads / gris si está en 0.
  - **Selector de cliente global**: filtra simultáneamente todas las métricas.
  - Consume `getCampaigns()` además de `getBudgetSummary()` y `getLeadsSummary()` para calcular KPIs por cliente.
- `src/index.css`: nuevas clases `.charts-grid`, `.chart-card`, `.chart-title`, `.gauge-center`, `.gauge-pct`, `.kpi-progress-track`, `.kpi-progress-fill`, `.kpi-top`.

**TODOs resueltos**

- ✅ `GD-F02` — Filtro por cliente en Campañas.
- ✅ `GD-F04` — Tarjetas de indicadores globales completas.
- ✅ `GD-F05` — Selector de cliente en Dashboard.

---

### 2026-06-30 — Edición inline de campañas y badges coloreados en Landings (rama `feature/dashboard-kpi-charts`)

**Cambios realizados**

- `src/pages/Campaigns.jsx`:
  - **Cambio rápido de estado**: cada campaña muestra un `<select>` estilizado con el color del estado actual (verde/naranja/rojo/gris). Cambia el estado con un clic vía `PATCH /api/budget/campaigns/{id}/status`.
  - **Edición inline completa**: botón `Editar` reemplaza la card por un formulario en la misma fila con todos los campos editables (nombre, cliente, tipo, estado, presupuesto, moneda, fechas). Guarda vía `PUT /api/budget/campaigns/{id}`.
- `src/pages/Landings.jsx`: `STATUS_BADGE` extendido para cubrir estados en inglés y español (`active/activa`, `draft/borrador`, `paused/pausada`, `inactive/inactiva`).
- `src/services/budgetManagerApi.js`: agregadas `updateCampaign(id, data)` y `updateCampaignStatus(id, status)`.
- `src/index.css`: nuevas clases `.status-select`, `.btn-edit`, `.btn-secondary`, `.edit-card`, `.card-actions`, `.edit-actions`.

**Estado de ramas**

| Rama | Último commit | Estado |
|---|---|---|
| `dev` | `5c01123` | .gitignore + fix node_modules, filtro campañas |
| `feature/dashboard-kpi-charts` | `63e7004` | KPIs, gráficos, edición de campañas |

**Pendiente**

- `GD-F03` — Conteo de leads por landing en la vista Landings.
- Merge de `feature/dashboard-kpi-charts` → `dev` pendiente de revisión.

---

### 2026-07-03 — Fix formulario de creación de campañas

**Cambios realizados**

- `src/pages/Campaigns.jsx`:
  - `EMPTY_CREATE`: quitados `availableBudget` y `spentBudget`; agregados `type: 'social_ads'`, `currency: 'ARS'`, `spent: ''`.
  - Payload de `createCampaign`: corregido `spentBudget` → `spent` (nombre real del campo en el backend); eliminado `availableBudget` (no existe en el modelo `Campaign`); agregados `type` y `currency`.
  - Formulario visual: reemplazados los campos "Presupuesto disponible" y "Presupuesto gastado" por **Tipo**, **Moneda** y **Presupuesto gastado** (`spent`).

**Motivo**

El formulario enviaba `availableBudget` (campo inexistente en el backend) y `spentBudget` en lugar de `spent`, por lo que esos valores eran ignorados por Spring Boot. Los campos `type` y `currency` no estaban disponibles al crear una campaña, por lo que siempre quedaban `null`.

**Estado Git**

- Cambios en `dev`, pendientes de commit.

---

### 2026-07-10 — Exportación a Excel con gráficas (Flask + xlsxwriter)

**Cambios realizados**

- `export_server.py`: nuevo servidor Flask (puerto 5001) que genera archivos `.xlsx` usando `xlsxwriter`.
  - `GET /api/export/full` — Excel completo: campañas + leads + resumen ejecutivo. Acepta `?client=` para filtrar.
  - `GET /api/export/campaigns` — Solo campañas con gráfica de barras (Presupuesto vs Gastado) y donut de estados.
  - `GET /api/export/leads` — Solo leads por landing con gráfica de barras horizontal.
  - `GET /api/export/health` — Health check del servicio.
  - Formato profesional: headers navy, filas alternadas, moneda `$#,##0.00`, porcentaje `0.00%`, bordes en todas las celdas.
  - Filtro por cliente: campañas filtradas en Budget Manager; leads filtrados localmente (el CRM no soporta filtro en `/summary`).
- `vite.config.js`: agregado proxy `/api/export` → `http://localhost:5001`.
- `src/pages/Dashboard.jsx`:
  - Nuevo estado `exporting` para el botón de descarga.
  - Función `handleExport()`: llama al endpoint con el filtro de cliente activo, recibe el blob y dispara la descarga nativa del navegador.
  - Botón **"⬇ Exportar Excel"** en el toolbar del Dashboard, junto al selector de cliente.
- `TECNICO-export-excel.md`: documento técnico completo con arquitectura, endpoints, estructura del Excel, flujo de datos y limitaciones.
- `README.md`: actualizado con sección de exportación, dependencias Python, cómo iniciar el servidor y tabla de proxies.

**Dependencias instaladas**

```bash
pip3 install xlsxwriter flask flask-cors requests
```

**Estado Git**

- Cambios en `dev`, pendientes de commit.
