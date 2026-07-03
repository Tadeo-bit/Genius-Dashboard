# Checklist de Pruebas — Genius-Dashboard

> **Sprint 1** · Pruebas funcionales y validación de integración con APIs
> **Repositorio:** Genius-Dashboard (Panel interno Genius Agency)
> **Stack:** React 18 · Vite 5 · react-router-dom 6
> **Puerto:** `5173` · **Proxy:** `/api/budget/*` → `:8080`, `/api/crm/*` → `:3000`

---

## 0. Preparación del entorno

- [✓] 0.1 Clonar/actualizar repositorio (`git pull`)
- [✓] 0.2 Verificar Node.js 18+ y npm 9+ instalados
- [✓] 0.3 Ejecutar `npm install` — sin errores de dependencias
- [✓] 0.4 Iniciar servidor con `npm run dev`
- [✓] 0.5 Abrir `http://localhost:5173` — la app carga sin errores en consola
- [✓] 0.6 **Requisito**: Genius-Budget debe estar corriendo en `:8080` (`mvn spring-boot:run`)
- [✓] 0.7 **Requisito**: Genius-CRM debe estar corriendo en `:3000` (`npm start`)

---

## 1. Routing — `react-router-dom`

### 1.1 Navegación

- [✓] 1.1.1 `GET /` → renderiza Dashboard (KPIs globales)
- [✓] 1.1.2 `GET /campaigns` → renderiza listado de campañas
- [✓] 1.1.3 `GET /landings` → renderiza listado de landings
- [✓] 1.1.4 Ruta inexistente (`/foo`) → comportamiento por defecto de React Router (sin ruta catch-all — posible 404 blank)

### 1.2 Sidebar (Layout)

- [✓] 1.2.1 Sidebar muestra 3 links: "Dashboard", "Campañas", "Landings"
- [✓] 1.2.2 `NavLink` aplica clase `.active` en la ruta actual
- [✓] 1.2.3 Top bar muestra "Genius Agency -- Panel interno"
- [✓] 1.2.4 Layout carga el contenido vía `<Outlet />`

---

## 2. Dashboard — `GET /`

### 2.1 Carga de datos

- [x] 2.1.1 Al montar, llama `getBudgetSummary()` vía proxy → `GET /api/budget/campaigns/summary`
- [✓] 2.1.2 Al montar, llama `getLeadsSummary()` vía proxy → `GET /api/crm/landings/summary`
- [x] 2.1.3 Ambas llamadas se ejecutan en paralelo (`Promise.all`)
- [✓] 2.1.4 Mientras carga, muestra **"Cargando..."**

### 2.2 KPIs — Budget Manager

- [✓] 2.2.1 **Campañas activas**: muestra `budgetSummary.activeCampaigns` (ej: 3)
- [✓] 2.2.2 **Presupuesto total**: muestra `budgetSummary.totalBudget` formateado como `$X,XXX` (ej: `$350,000`)
- [✓] 2.2.3 **Total gastado**: muestra `budgetSummary.totalSpent` formateado como `$X,XXX`
- [✓] 2.2.4 **Total leads**: suma de `leadsSummary[].leadCount` (3 del seed data)

### 2.3 Estados de error y degradación

- [x] 2.3.1 Budget Manager caído (`:8080` off) → KPIs de Budget muestran `—`, el resto funciona
- [x] 2.3.2 Landing CRM caído (`:3000` off) → "Total leads" muestra `—`, el resto funciona
- [x] 2.3.3 Ambas APIs caídas → todos los KPIs muestran `—`, mensaje de error enconsola
- [✓] 2.3.4 Error message: `"Error al conectar con las APIs: ..."` se muestra al usuario

### 2.4 Formato de moneda

- [✓] 2.4.1 `totalBudget` se muestra con separador de miles y símbolo `$`
- [✓] 2.4.2 `totalSpent` se muestra con separador de miles y símbolo `$`
- [x] 2.4.3 Valores `undefined` o `null` → `—`

---

## 3. Campañas — `GET /campaigns`

### 3.1 Carga de datos

- [✓] 3.1.1 Al montar, llama `getCampaigns()` vía proxy → `GET /api/budget/campaigns`
- [✓] 3.1.2 Mientras carga, muestra **"Cargando..."**
- [✓] 3.1.3 Error al cargar → mensaje de error visible

### 3.2 Listado de campañas

- [✓] 3.2.1 Muestra **6 campañas** del seed data (Budget Manager)
- [✓] 3.2.2 Cada card muestra: **nombre de campaña**
- [✓] 3.2.3 Cada card muestra: **cliente + tipo** (ej: "SueñoSimple — Display")
- [✓] 3.2.4 Cada card muestra: **presupuesto** formateado en moneda
- [✓] 3.2.5 Cada card muestra: **badge de estado** con color correspondiente

### 3.3 Badges de estado

- [✓] 3.3.1 `active` → badge verde con texto "Activa"
- [✓] 3.3.2 `paused` → badge amarillo con texto "Pausada"
- [✓] 3.3.3 `closed` → badge rojo con texto "Cerrada"
- [✓] 3.3.4 `draft` → badge gris con texto "Borrador"

### 3.4 Estados vacío y error

- [✓] 3.4.1 Sin campañas (backends vacíos) → **"No hay campanas registradas."**
- [✓] 3.4.2 Budget Manager caído → mensaje de error

---

## 4. Landings — `GET /landings`

### 4.1 Carga de datos

- [✓] 4.1.1 Al montar, llama `getLandings()` vía proxy → `GET /api/crm/landings`
- [✓] 4.1.2 Mientras carga, muestra **"Cargando..."**
- [✓] 4.1.3 Error al cargar → mensaje de error visible

### 4.2 Listado de landings

- [✓] 4.2.1 Muestra **6 landings** del seed data (Landing CRM)
- [✓] 4.2.2 Cada card muestra: **nombre de landing** (o `title` si existe en swagger)
- [✓] 4.2.3 Cada card muestra: **cliente + template** (ej: "SueñoSimple — promo-event")
- [✓] 4.2.4 Cada card muestra: **badge de estado** con color correspondiente
- [x] 4.2.5 **TODO GD-F03**: `leadCount` no se muestra aún por landing (ver gap 10.3)

### 4.3 Badges de estado

- [x] 4.3.1 `active` → badge verde con texto "Activa"
- [x] 4.3.2 `draft` → badge gris con texto "Borrador"
- [x] 4.3.3 `inactive` → badge rojo con texto "Inactiva"
        No se está haciendo display de los colores de las badges en B10
- [✓] 4.3.4 **Ojo**: CRM no tiene landings `inactive` en seed, solo `active` y `draft`

### 4.4 Estados vacío y error

- [✓] 4.4.1 Sin landings → **"No hay landings registradas."**
- [✓] 4.4.2 Landing CRM caído → mensaje de error

---

## 5. Proxy de Vite — `vite.config.js`

### 5.1 Budget Manager

- [✓] 5.1.1 `GET /api/budget/campaigns` → proxy → `GET http://localhost:8080/api/campaigns`
- [✓] 5.1.2 `GET /api/budget/campaigns/summary` → proxy → `GET http://localhost:8080/api/campaigns/summary`
- [✓] 5.1.3 `GET /api/budget/campaigns?status=active` → proxy → pasa query params
- [✓] 5.1.4 Budget Manager caído → el proxy responde con error (no hay fallback)

### 5.2 Landing CRM

- [✓] 5.2.1 `GET /api/crm/landings` → proxy → `GET http://localhost:3000/api/landings`
- [✓] 5.2.2 `GET /api/crm/landings/summary` → proxy → `GET http://localhost:3000/api/landings/summary`
- [✓] 5.2.3 `GET /api/crm/landings/{id}/leads` → proxy → `GET http://localhost:3000/api/landings/{id}/leads`
- [✓] 5.2.4 Landing CRM caído → el proxy responde con error

### 5.3 Rewrite de paths

- [✓] 5.3.1 `/api/budget/*` se rewritea a `/*` (se quita `/api/budget` del path)
- [✓] 5.3.2 `/api/crm/*` se rewritea a `/*` (se quita `/api/crm` del path)

---

## 6. Servicios API

### 6.1 `budgetManagerApi.js`

- [✓] 6.1.1 `getCampaigns({ status, client })` arma query string correctamente
- [✓] 6.1.2 `getBudgetSummary()` llama endpoint correcto
- [✓] 6.1.3 Los errores HTTP se propagan correctamente (no se tragan)

### 6.2 `landingCrmApi.js`

- [✓] 6.2.1 `getLandings({})` llama endpoint correcto
- [✓] 6.2.2 `getLeadsSummary()` llama endpoint correcto
- [✓] 6.2.3 `getLandingLeads(id)` llama endpoint correcto con `{id}` interpolado
- [✓] 6.2.4 Los errores HTTP se propagan correctamente

---

## 7. Integración cross-system

### 7.1 Dashboard + Budget Manager

- [x] 7.1.1 Campaña creada desde Swagger de Budget → aparece en Dashboard
- [x] 7.1.2 Campaña actualizada → KPIs del Dashboard se reflejan al recargar
- [✓] 7.1.3 Dashboard refleja `activeCampaigns` de campañas activas reales

### 7.2 Dashboard + Landing CRM

- [x] 7.2.1 Landing creada desde Swagger de CRM → aparece en Dashboard
- [x] 7.2.2 Lead registrado en CRM → `leadCount` se incrementa en Dashboard
- [✓] 7.2.3 Dashboard refleja todos los clients (SueñoSimple, TechStore)

### 7.3 Dashboard + Genius-Landings admin

- [✓] 7.3.1 Landing creada desde admin PHP (puerto 8000) → aparece en Dashboard
- [x] 7.3.2 Lead enviado desde formulario de landing (mundial-2026) → se refleja en Dashboard
        No funciona por el bug B13

---

## 8. Persistencia y ciclo de vida

> El Dashboard es un frontend stateless. Los datos viven en los backends (en memoria).

- [✓] 8.1 Recargar la página (`F5`) → los datos se vuelven a cargar desde las APIs
- [✓] 8.2 Navegar entre páginas y volver → los datos se recargan (sin caché)
- [x] 8.3 Dashboard refleja datos actualizados después de crear/editar en backends sin recarga manual
- [x] 8.4 Al reiniciar backends, los KPIs reflejan el estado vacío o inicial

---

## 9. Gaps funcionales detectados

- [ ] 9.1 **GD-F01 (corregido)**: proxies de Vite ahora funcionan correctamente
- [ ] 9.2 **GD-F02**: No hay filtros por `status` ni `client` en página Campaigns
- [ ] 9.3 **GD-F03**: `leadCount` por landing no se muestra en Landings page
- [ ] 9.4 **GD-F04**: KPIs del Dashboard están incompletos (faltan indicadores adicionales)
- [ ] 9.5 **GD-F05**: No hay selector de cliente para filtrar vistas
- [ ] 9.6 **No existe** ruta catch-all para 404
- [ ] 9.7 **No existe** página de detalle de campaña individual
- [ ] 9.8 **No existe** página de detalle de landing individual
- [ ] 9.9 **No existe** vista de leads por landing desde el Dashboard
- [ ] 9.10 **No existe** indicador de consumo de presupuesto (porcentaje gastado)

---

## 11. Bugs y observaciones

| ID  | Tipo    | Descripción | Evidencia |
|-----|---------|-------------|-----------|
| B01 | Gap     | No hay ruta catch-all → ruta inexistente muestra página en blanco | |
| B02 | Gap     | `leadCount` no se muestra en Landings (GD-F03) | |
| B03 | Gap     | No hay filtros en Campaigns (GD-F02) ni selector de cliente (GD-F05) | |
| B04 | Gap     | KPIs del Dashboard incompletos (GD-F04) | |
| B05 | Obs.    | Dependencia total de backends — sin datos mock para desarrollo offline | |
| B06 | Obs.    | Sin tests automatizados (0 archivos, 0 dependencias de testing) | |
| B07 | Obs.    | Sin TypeScript, sin linter, sin Prettier | |
| B08 | Obs.    | Sin estado global (cada página maneja su propio estado con useState/useEffect) | |
| B09 | Obs.    | No hay indicador de porcentaje de presupuesto consumido por campaña | |
| B10 | Bug | Badges de estado en Landings usan keys en español (activa, borrador, inactiva) pero la API devuelve valores en inglés (active, draft, inactive). El mapping nunca matchea, por lo que todos los badges se ven grises (fallback badge-draft). | src/pages/Landings.jsx:4-8 |

---

## 12. Resumen de cobertura

| Sección | Items | Completados |
|---------|-------|-------------|
| 0. Preparación del entorno | 7 | 7 / 7 |
| 1. Routing | 6 | 6 / 6 |
| 2. Dashboard | 13 | 13 / 13 |
| 3. Campañas | 10 | 10 / 10 |
| 4. Landings | 11 | 11 / 11 |
| 5. Proxy de Vite | 8 | 8 / 8 |
| 6. Servicios API | 7 | 7 / 7 |
| 7. Integración cross-system | 7 | 7 / 7 |
| 8. Persistencia y ciclo de vida | 4 | 4 / 4 |
| 9. Gaps funcionales | 10 | — (informativo) |
| 10. Bugs / observaciones | 10 | — (informativo) |
| **Total** | **~80 checks funcionales** | **~73 completados** |
