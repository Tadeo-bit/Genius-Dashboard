import { useEffect, useState } from 'react'
import { createCampaign, getCampaigns, updateCampaign, updateCampaignStatus } from '../services/budgetManagerApi'

const STATUS_BADGE = {
  activa:   'badge-active',  active:  'badge-active',
  pausada:  'badge-paused',  paused:  'badge-paused',
  cerrada:  'badge-closed',  closed:  'badge-closed',
  borrador: 'badge-draft',   draft:   'badge-draft',
}

const STATUS_OPTIONS = [
  { value: 'active',  label: 'Activo'     },
  { value: 'paused',  label: 'Pausado'    },
  { value: 'closed',  label: 'Finalizado' },
]

const EMPTY_EDIT = { name: '', client: '', type: '', status: '', budget: '', currency: '', startDate: '', endDate: '' }
const EMPTY_CREATE = { name: '', client: '', type: 'social_ads', budget: '', status: 'active', currency: 'ARS', spent: '' }

function statusColor(s) {
  if (s === 'active'  || s === 'activa')   return '#198754'
  if (s === 'paused'  || s === 'pausada')  return '#fd7e14'
  if (s === 'closed'  || s === 'cerrada')  return '#dc3545'
  return '#6c757d'
}

export default function Campaigns() {
  const [campaigns, setCampaigns]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [clientFilter, setClientFilter] = useState('')
  const [editingId, setEditingId]       = useState(null)
  const [editForm, setEditForm]         = useState(EMPTY_EDIT)
  const [savingStatus, setSavingStatus] = useState(null)
  const [saving, setSaving]             = useState(false)
  const [editError, setEditError]       = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm]     = useState(EMPTY_CREATE)
  const [creating, setCreating]         = useState(false)
  const [createError, setCreateError]   = useState(null)

  useEffect(() => {
    getCampaigns()
      .then(setCampaigns)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  const clients = [...new Set(campaigns.map(c => c.client).filter(Boolean))].sort()
  const filtered = clientFilter ? campaigns.filter(c => c.client === clientFilter) : campaigns

  function startEdit(c) {
    setEditingId(c.id)
    setEditError(null)
    setEditForm({
      name: c.name ?? '', client: c.client ?? '', type: c.type ?? '',
      status: c.status ?? 'draft', budget: c.budget ?? '',
      currency: c.currency ?? 'ARS', startDate: c.startDate ?? '', endDate: c.endDate ?? ''
    })
  }

  function cancelEdit() { setEditingId(null); setEditError(null) }

  function handleField(e) {
    setEditForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleCreateField(e) {
    setCreateForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleStatusChange(id, newStatus) {
    setSavingStatus(id)
    try {
      const updated = await updateCampaignStatus(id, newStatus)
      setCampaigns(prev => prev.map(c => c.id === id ? updated : c))
    } finally {
      setSavingStatus(null)
    }
  }

  async function handleSubmitEdit(e) {
    e.preventDefault()
    setEditError(null)
    setSaving(true)
    try {
      const updated = await updateCampaign(editingId, { ...editForm, budget: Number(editForm.budget) })
      setCampaigns(prev => prev.map(c => c.id === editingId ? updated : c))
      setEditingId(null)
    } catch (err) {
      setEditError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateSubmit(e) {
    e.preventDefault()
    setCreateError(null)
    setCreating(true)
    try {
      if (!createForm.client.trim()) throw new Error('El cliente es obligatorio')
      if (!createForm.budget) throw new Error('El presupuesto asignado es obligatorio')

      const created = await createCampaign({
        name: createForm.name.trim() || createForm.client.trim(),
        client: createForm.client.trim(),
        type: createForm.type,
        budget: Number(createForm.budget),
        status: createForm.status,
        currency: createForm.currency,
        spent: Number(createForm.spent) || 0,
      })

      setCampaigns(prev => [created, ...prev])
      setCreateForm(EMPTY_CREATE)
      setShowCreateForm(false)
    } catch (err) {
      setCreateError(err.message)
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <p className="state-msg">Cargando campañas...</p>
  if (error)   return <p className="state-msg error">Error: {error.message}</p>

  return (
    <main className="page">
      <div className="page-toolbar">
        <h1 style={{ margin: 0 }}>Campañas</h1>
        <div className="toolbar-actions">
          <select className="filter-input" value={clientFilter} onChange={e => setClientFilter(e.target.value)}>
            <option value="">Todos los clientes</option>
            {clients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            className="btn-danger"
            onClick={() => {
              setShowCreateForm(prev => {
                const next = !prev
                if (next) {
                  setCreateForm(EMPTY_CREATE)
                  setCreateError(null)
                }
                return next
              })
            }}
          >
            {showCreateForm ? 'Cancelar' : '+ Nueva campaña'}
          </button>
        </div>
      </div>

      {showCreateForm && (
        <form className="form-card" onSubmit={handleCreateSubmit}>
          <h2>Crear campaña</h2>
          {createError && <p className="form-error">{createError}</p>}
          <div className="form-grid">
            <label>Nombre de campaña
              <input name="name" value={createForm.name} onChange={handleCreateField} placeholder="Ej. Campaña verano" />
            </label>
            <label>Cliente *
              <input name="client" value={createForm.client} onChange={handleCreateField} required placeholder="Ej. SueñoSimple" />
            </label>
            <label>Presupuesto asignado *
              <input name="budget" type="number" min="0" value={createForm.budget} onChange={handleCreateField} required placeholder="0" />
            </label>
            <label>Estado
              <select name="status" value={createForm.status} onChange={handleCreateField}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label>Tipo
              <select name="type" value={createForm.type} onChange={handleCreateField}>
                <option value="social_ads">Social Ads</option>
                <option value="search_ads">Search Ads</option>
                <option value="display">Display</option>
                <option value="email">Email</option>
                <option value="influencer">Influencer</option>
                <option value="content">Content</option>
                <option value="branding">Branding</option>
              </select>
            </label>
            <label>Moneda
              <select name="currency" value={createForm.currency} onChange={handleCreateField}>
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </label>
            <label>Presupuesto gastado
              <input name="spent" type="number" min="0" value={createForm.spent} onChange={handleCreateField} placeholder="0" />
            </label>
          </div>
          <div className="edit-actions">
            <button type="submit" className="btn-primary" disabled={creating}>{creating ? 'Creando…' : 'Crear campaña'}</button>
            <button type="button" className="btn-secondary" onClick={() => { setShowCreateForm(false); setCreateError(null); setCreateForm(EMPTY_CREATE) }}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="item-list">
        {filtered.length === 0 && (
          <p className="state-msg">
            {clientFilter ? `Sin campañas para "${clientFilter}".` : 'No hay campañas registradas.'}
          </p>
        )}

        {filtered.map(c => editingId === c.id ? (
          /* ── Fila de edición ── */
          <form key={c.id} className="edit-card" onSubmit={handleSubmitEdit}>
            {editError && <p className="form-error" style={{ marginBottom: 10 }}>{editError}</p>}
            <div className="form-grid">
              <label>Nombre *<input name="name" value={editForm.name} onChange={handleField} required /></label>
              <label>Cliente *<input name="client" value={editForm.client} onChange={handleField} required /></label>
              <label>Tipo
                <select name="type" value={editForm.type} onChange={handleField}>
                  <option value="social_ads">Social Ads</option>
                  <option value="search_ads">Search Ads</option>
                  <option value="display">Display</option>
                  <option value="email">Email</option>
                  <option value="influencer">Influencer</option>
                  <option value="content">Content</option>
                  <option value="branding">Branding</option>
                </select>
              </label>
              <label>Estado
                <select name="status" value={editForm.status} onChange={handleField}>
                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              <label>Presupuesto *<input name="budget" type="number" min="0" value={editForm.budget} onChange={handleField} required /></label>
              <label>Moneda
                <select name="currency" value={editForm.currency} onChange={handleField}>
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                </select>
              </label>
              <label>Fecha inicio<input name="startDate" type="date" value={editForm.startDate} onChange={handleField} /></label>
              <label>Fecha fin<input name="endDate" type="date" value={editForm.endDate} onChange={handleField} /></label>
            </div>
            <div className="edit-actions">
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
              <button type="button" className="btn-secondary" onClick={cancelEdit}>Cancelar</button>
            </div>
          </form>
        ) : (
          /* ── Fila normal ── */
          <div key={c.id} className="item-card">
            <div style={{ flex: 1 }}>
              <div className="item-name">{c.name}</div>
              <div className="item-meta">{c.client} · {c.type}</div>
            </div>
            <div className="card-actions">
              <select
                className="status-select"
                value={c.status}
                style={{ color: statusColor(c.status), borderColor: statusColor(c.status) }}
                onChange={e => handleStatusChange(c.id, e.target.value)}
                disabled={savingStatus === c.id}
              >
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <div className="item-meta" style={{ textAlign: 'right' }}>
                ${(c.budget ?? 0).toLocaleString()}
              </div>
              <button className="btn-edit" onClick={() => startEdit(c)}>Editar</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}