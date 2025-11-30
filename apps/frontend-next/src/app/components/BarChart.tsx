"use client"
import React from 'react'

export type BarSeries = {
  name: string
  color: string
  data: Array<number | null> // parallel to categories
}

export function BarChart({
  title,
  categories,
  series,
  height = 260,
  yMax = 100,
  yTicks = [0, 20, 40, 60, 80, 100],
  showValues = true,
  onBarClick,
  renderPopup,
}: {
  title?: string
  categories: string[]
  series: BarSeries[]
  height?: number
  yMax?: number
  yTicks?: number[]
  showValues?: boolean
  onBarClick?: (info: { category: string; categoryIndex: number; series: string; seriesIndex: number; value: number | null }) => void
  renderPopup?: (info: { category: string; categoryIndex: number; series: string; seriesIndex: number; value: number | null }) => React.ReactNode
}) {
  const W = 640
  const H = height
  const PAD_LEFT = 46
  const PAD_RIGHT = 16
  const PAD_TOP = 16
  const PAD_BOTTOM = 50
  const innerW = W - PAD_LEFT - PAD_RIGHT
  const innerH = H - PAD_TOP - PAD_BOTTOM

  const step = categories.length ? innerW / categories.length : innerW
  const groupGap = Math.min(12, step * 0.18)
  const barArea = step - groupGap
  const perBar = series.length ? barArea / series.length : barArea

  const clamp = (v: number) => Math.max(0, Math.min(yMax, v))
  const xBase = (i: number) => PAD_LEFT + (i * innerW) / (categories.length)
  const yPos = (v: number) => PAD_TOP + innerH - (clamp(v) * innerH) / yMax

  const grid = (
    <g>
      {yTicks.map((t, i) => {
        const y = yPos(t)
        return (
          <g key={i}>
            <line x1={PAD_LEFT} y1={y} x2={W - PAD_RIGHT} y2={y} stroke="#e5e7eb" strokeWidth={1} />
            <text x={PAD_LEFT - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#64748b">{t}</text>
          </g>
        )
      })}
      <line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={PAD_TOP + innerH} stroke="#94a3b8" strokeWidth={1.5} />
      <line x1={PAD_LEFT} y1={PAD_TOP + innerH} x2={PAD_LEFT + innerW} y2={PAD_TOP + innerH} stroke="#94a3b8" strokeWidth={1.5} />
      {categories.map((c, i) => (
        <text key={i} x={xBase(i) + step / 2} y={PAD_TOP + innerH + 16} textAnchor="middle" fontSize="10" fill="#64748b">{c}</text>
      ))}
    </g>
  )

  const [sel, setSel] = React.useState<{ ci: number; si: number; x: number; y: number; v: number | null } | null>(null)

  const bars = (
    <g>
      {categories.map((_, ci) => (
        <g key={ci}>
          {series.map((s, si) => {
            const val = s.data[ci]
            if (val == null) return null
            const h = (clamp(val) * innerH) / yMax
            const x = xBase(ci) + groupGap / 2 + si * perBar
            const y = PAD_TOP + innerH - h
            return (
              <g key={si}>
                <rect x={x} y={y} width={Math.max(1, perBar - 4)} height={h} fill={s.color} rx={3} style={{cursor: (onBarClick || renderPopup) ? 'pointer' : 'default'}}
                      onClick={() => {
                        const info = { category: categories[ci], categoryIndex: ci, series: s.name, seriesIndex: si, value: val }
                        if (onBarClick) onBarClick(info)
                        if (renderPopup) {
                          setSel(prev => (prev && prev.ci === ci && prev.si === si) ? null : { ci, si, x: x + (perBar - 4)/2, y, v: val })
                        }
                      }}
                />
                {showValues && (
                  <text x={x + (perBar - 4) / 2} y={y - 6} textAnchor="middle" fontSize="10" fill="#1f2937">{val}</text>
                )}
              </g>
            )
          })}
        </g>
      ))}
    </g>
  )

  const legend = (
    <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
      {series.map((s, i) => (
        <div key={i} style={{display:'flex', alignItems:'center', gap:6}}>
          <span style={{width:12, height:12, background:s.color, display:'inline-block', borderRadius:2}} />
          <small>{s.name}</small>
        </div>
      ))}
    </div>
  )

  return (
    <div style={{display:'grid', gap:8, position:'relative'}}>
      {title && <div className="chart-title">{title}</div>}
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title || 'Bar chart'}>
        {grid}
        {bars}
      </svg>
      {renderPopup && sel && (
        <div style={{position:'absolute', left: Math.max(8, Math.min(sel.x + 8, 600)), top: Math.max(8, sel.y - 10), zIndex: 1}}>
          <div className="note-card note-blue" role="dialog">
            {renderPopup({ category: categories[sel.ci], categoryIndex: sel.ci, series: series[sel.si].name, seriesIndex: sel.si, value: sel.v })}
            <div style={{display:'flex', justifyContent:'flex-end', marginTop:6}}>
              <button className="btn-ghost" type="button" onClick={()=> setSel(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
      {legend}
    </div>
  )
}
