import { useEffect, useState } from 'react'
import { getLandings } from '../services/landingCrmApi'

const STATUS_BADGE = {
  activa:    'badge-active',
  active:    'badge-active',
  inactiva:  'badge-closed',
  inactive:  'badge-closed',
  borrador:  'badge-draft',
  draft:     'badge-draft',
  pausada:   'badge-paused',
  paused:    'badge-paused',
}

export default function Landings() {
  const [landings, setLandings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    getLandings()
      .then(setLandings)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="state-msg">Cargando landings...</p>
  if (error)   return <p className="state-msg error">Error: {error.message}</p>

  return (
    <main className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1>Landings</h1>
        <a
          href="http://localhost:8000/admin/index.php"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            background: '#2563eb',
            color: '#fff',
            fontSize: '.85rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Gestionar Landings
        </a>
      </div>

      {/* TODO GD-F03: agregar columna de conteo de leads por landing */}
      {/* TODO GD-F05: selector de cliente */}

      <div className="item-list">
        {landings.length === 0 && <p className="state-msg">No hay landings registradas.</p>}
        {landings.map(l => (
          <div key={l.id} className="item-card">
            <div>
              <div className="item-name">{l.name ?? l.title}</div>
              <div className="item-meta">{l.client} · Template: {l.template}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className={`badge ${STATUS_BADGE[l.status] ?? 'badge-draft'}`}>
                {l.status}
              </span>
              {/* TODO GD-F03: mostrar l.leadCount aquí */}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
