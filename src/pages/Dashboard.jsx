import { useEffect, useState } from 'react'
import {
  RadialBarChart, RadialBar, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { getBudgetSummary, getCampaigns } from '../services/budgetManagerApi'
import { getLeadsSummary } from '../services/landingCrmApi'

function consumptionColor(pct) {
  if (pct >= 90) return '#dc3545'
  if (pct >= 70) return '#fd7e14'
  return '#198754'
}

function BudgetGauge({ pct }) {
  const color = consumptionColor(pct)
  const data  = [{ value: pct }]
  return (
    <div className="chart-card">
      <div className="chart-title">Consumo de presupuesto</div>
      <ResponsiveContainer width="100%" height={200}>
        <RadialBarChart
          innerRadius="70%"
          outerRadius="100%"
          data={data}
          startAngle={180}
          endAngle={0}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={6} fill={color} background={{ fill: '#e9ecef' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="gauge-center" style={{ color }}>
        <span className="gauge-pct">{pct.toFixed(1)}%</span>
        <span className="gauge-label">gastado</span>
      </div>
    </div>
  )
}

function LeadsBar({ data }) {
  return (
    <div className="chart-card">
      <div className="chart-title">Leads por landing</div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            width={130}
            tick={{ fontSize: 11 }}
            tickFormatter={v => v.length > 18 ? v.slice(0, 17) + '…' : v}
          />
          <Tooltip
            formatter={(v) => [v, 'Leads']}
            contentStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="leadCount" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.leadCount > 0 ? '#0d6efd' : '#ced4da'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Dashboard() {
  const [budgetSummary, setBudgetSummary] = useState(null)
  const [leadsSummary, setLeadsSummary]   = useState([])
  const [campaigns, setCampaigns]         = useState([])
  const [clientFilter, setClientFilter]   = useState('')
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const [exporting, setExporting]         = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const params = clientFilter ? `?client=${encodeURIComponent(clientFilter)}` : ''
      const res = await fetch(`/api/export/full${params}`)
      if (!res.ok) throw new Error('El servidor de exportación no está disponible. Iniciá export_server.py.')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `genius_reporte_${new Date().toISOString().slice(0,10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert(e.message)
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    Promise.all([getBudgetSummary(), getLeadsSummary(), getCampaigns()])
      .then(([budget, leads, camps]) => {
        setBudgetSummary(budget)
        setLeadsSummary(leads)
        setCampaigns(camps)
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="state-msg">Cargando...</p>
  if (error)   return <p className="state-msg error">Error al conectar con las APIs: {error.message}</p>

  const clients      = [...new Set([...campaigns.map(c => c.client), ...leadsSummary.map(l => l.client)].filter(Boolean))].sort()
  const filtLeads    = clientFilter ? leadsSummary.filter(l => l.client === clientFilter) : leadsSummary
  const filtCampaigns = clientFilter ? campaigns.filter(c => c.client === clientFilter) : campaigns

  const totalLeads   = filtLeads.reduce((sum, l) => sum + (l.leadCount ?? 0), 0)
  const topLanding   = [...filtLeads].sort((a, b) => b.leadCount - a.leadCount)[0]

  const activeCamps  = filtCampaigns.filter(c => c.status === 'active' || c.status === 'activa').length
  const totalBudget  = filtCampaigns.reduce((s, c) => s + (c.budget ?? 0), 0)
  const totalSpent   = filtCampaigns.reduce((s, c) => s + (c.spent ?? 0), 0)
  const totalAvail   = totalBudget - totalSpent
  const consumptionPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  const color = consumptionColor(consumptionPct)

  return (
    <main className="page">
      <div className="page-toolbar" style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <div className="toolbar-actions">
          <select
            className="filter-input"
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
          >
            <option value="">Todos los clientes</option>
            {clients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            className="btn-primary"
            onClick={handleExport}
            disabled={exporting}
            title="Descarga un Excel con campañas, leads y gráficas"
          >
            {exporting ? '⏳ Generando…' : '⬇ Exportar Excel'}
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Campañas activas</div>
          <div className="kpi-value">{activeCamps}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Presupuesto total</div>
          <div className="kpi-value">${totalBudget.toLocaleString()}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total gastado</div>
          <div className="kpi-value" style={{ color }}>${totalSpent.toLocaleString()}</div>
          <div className="kpi-sub">
            <div className="kpi-progress-track">
              <div className="kpi-progress-fill" style={{ width: `${Math.min(consumptionPct, 100)}%`, background: color }} />
            </div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Presupuesto disponible</div>
          <div className="kpi-value" style={{ color: '#198754' }}>${totalAvail.toLocaleString()}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total leads</div>
          <div className="kpi-value">{totalLeads}</div>
          {topLanding && topLanding.leadCount > 0 && (
            <div className="kpi-sub kpi-top"># {topLanding.name}</div>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <BudgetGauge pct={consumptionPct} />
        <LeadsBar data={filtLeads} />
      </div>
    </main>
  )
}
