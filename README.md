# Genius Dashboard

Panel interno de Genius Agency para visualizar campañas, presupuestos y leads de todos los clientes desde un único lugar.

## Contexto de negocio

Genius gestiona campañas de marketing digital para múltiples clientes en simultáneo. Hasta ahora, el equipo debía consultar Budget Manager y el Landing CRM por separado para tener visibilidad del estado operativo: cuánto presupuesto hay disponible, qué campañas están activas y cuántos leads generó cada landing.

**El problema que resuelve este panel**

El Dashboard unifica esas dos fuentes en una sola interfaz. El account manager puede ver en segundos el estado de todas las campañas de un cliente, cuánto presupuesto les queda y cuántos leads captó cada landing, sin llamar a ninguna API manualmente.

**Cliente de referencia: SueñoSimple**

SueñoSimple tiene campañas activas de distintos tipos (Meta Ads, email, influencers) y varias landings corriendo en paralelo. El equipo necesita saber en tiempo real cuánto gastaron vs. cuánto tienen asignado, y cuáles landings están convirtiendo mejor para decidir dónde reforzar el presupuesto.

## Qué resuelve cada vista

| Ruta | Problema que resuelve |
|------|-----------------------|
| `/` | El equipo de management ve los KPIs globales de la agencia en una sola pantalla: campañas activas, presupuesto total, gasto acumulado y leads captados. |
| `/campaigns` | El account manager ve todas las campañas con su estado (badge de color), cliente y presupuesto asignado sin necesidad de llamar a la API. |
| `/landings` | El equipo de ventas ve todas las landings activas con el conteo de leads por cada una para priorizar cuáles impulsar. |

## Requisitos

- Node.js 18 o superior
- npm 9 o superior
- [Budget Manager](../budget-manager) corriendo en `localhost:8080`
- [Landing CRM](../landing-crm) corriendo en `localhost:3000`

El Dashboard consume ambas APIs a través de un proxy de Vite configurado en `vite.config.js`. No requiere base de datos ni variables de entorno adicionales.

## Instalación

```bash
npm install
```

## Ejecución

```bash
npm run dev
```

El panel abre en `http://localhost:5173`.

Para que los datos sean reales, tener Budget Manager y Landing CRM corriendo antes de abrir el Dashboard. Si alguna API no está disponible, el panel muestra `—` en las métricas que dependen de ella sin romper la pantalla.

## Exportación a Excel

El Dashboard incluye un botón **"⬇ Exportar Excel"** que genera un archivo `.xlsx` con:

- **Hoja Campañas** — tabla con formato profesional (moneda, porcentaje, filas alternadas) + gráfica de barras (Presupuesto vs Gastado) + donut de distribución de estados.
- **Hoja Leads por Landing** — tabla + gráfica de barras horizontal.
- **Hoja Resumen** — KPIs ejecutivos.

Si hay un filtro de cliente activo, el Excel incluirá solo los datos de ese cliente.

### Dependencias adicionales

```bash
pip3 install xlsxwriter flask flask-cors requests
```

### Iniciar el servidor de exportación

```bash
# En una terminal aparte (desde la carpeta Genius-Dashboard)
python3 export_server.py
# Queda disponible en http://localhost:5001
```

> Ver [`TECNICO-export-excel.md`](TECNICO-export-excel.md) para la documentación técnica completa.

## Cómo navegar el panel

1. Abrir `http://localhost:5173` en el navegador.
2. La pantalla principal muestra los 4 KPIs globales de la agencia.
3. Usar el sidebar izquierdo para navegar entre **Dashboard**, **Campañas** y **Landings**.
4. El link activo se resalta visualmente en el sidebar.

### Probar sin las APIs

Si Budget Manager o Landing CRM no están corriendo, el panel igual carga. Las tarjetas que dependen de la API caída muestran `—` en lugar de un número. Las secciones que sí tienen API disponible se cargan normalmente.

## Estructura del proyecto

```
genius-dashboard/
├── index.html                    Punto de entrada HTML (Vite)
├── vite.config.js                Configuración de Vite y proxy hacia las APIs
├── package.json
├── export_server.py              Servidor Flask para exportación a Excel (.xlsx)
├── TECNICO-export-excel.md       Documentación técnica del módulo de exportación
├── src/
│   ├── main.jsx                  Monta la app en el DOM
│   ├── App.jsx                   Routing principal (react-router-dom)
│   ├── index.css                 Estilos globales y variables de diseño
│   ├── components/
│   │   └── Layout.jsx            Shell con sidebar y área principal
│   ├── pages/
│   │   ├── Dashboard.jsx         Vista home con KPIs globales + botón Exportar Excel
│   │   ├── Campaigns.jsx         Vista de campañas con tarjetas
│   │   └── Landings.jsx          Vista de landings con conteo de leads
│   └── services/
│       ├── budgetManagerApi.js   Funciones para llamar al Budget Manager
│       └── landingCrmApi.js      Funciones para llamar al Landing CRM
└── .gitignore
```

## Proxy de desarrollo

El archivo `vite.config.js` configura un proxy para evitar errores de CORS en desarrollo:

| Prefijo en el frontend | Destino real |
|------------------------|--------------|
| `/api/budget/*` | `http://localhost:8080/*` |
| `/api/crm/*` | `http://localhost:3000/*` || `/api/export/*` | `http://localhost:5001/*` |
Las llamadas a la API se hacen siempre con el prefijo (`/api/budget/campaigns`, `/api/crm/landings`) y Vite se encarga de redirigirlas. No hay que cambiar nada para que funcione.

## Cómo trabajar en este repositorio

**Con cuenta de GitHub:** hacer un fork del repositorio y clonar tu fork para trabajar en tu propia copia. No realizar commits directamente sobre la rama principal del repositorio original.

**Sin cuenta de GitHub:** descargar el proyecto como ZIP desde el botón "Code → Download ZIP" del repositorio, extraerlo y ejecutar `npm install` antes de correr `npm run dev`.

## Equipo

Genius Agency — Área de Desarrollo Frontend  
Uso interno. No distribuir fuera del equipo.
