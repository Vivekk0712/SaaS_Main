"use client"
import React from 'react'

export type LineSeries = {
  name: string
  color: string
  data: Array<number | null> // parallel to categories
}

export function LineChart({
  title,
  categories,
  series,
  height = 220,
  yMax = 100,
  yTicks = [0, 20, 40, 60, 80, 100],
  offset = 'spread',
  showPointLabels = false,
  seriesStyles,
}: {
  title?: string
  categories: string[]
  series: LineSeries[]
  height?: number
  yMax?: number
  yTicks?: number[]
  offset?: 'none' | 'spread'
  showPointLabels?: boolean
  seriesStyles?: Array<{ width?: number; dash?: string; opacity?: number }>
}) {
  const W = 640
  const H = height
  const PAD_LEFT = 46
  const PAD_RIGHT = 16
  const PAD_TOP = 16
  const PAD_BOTTOM = 40
  const innerW = W - PAD_LEFT - PAD_RIGHT
  const innerH = H - PAD_TOP - PAD_BOTTOM

  const clamp = (v: number) => Math.max(0, Math.min(yMax, v))
  const stepX = categories.length <= 1 ? innerW : innerW / Math.max(1, categories.length - 1)
  const spreadAmp = Math.min(10, stepX * 0.18)
  const offsetForSeries = (si: number) => {
    if (offset === 'none' || series.length <= 1) return 0
    const center = (series.length - 1) / 2
    const norm = series.length > 1 ? (si - center) / center : 0
    return norm * spreadAmp
  }
  const xPos = (i: number, si = 0) => {
    const base = PAD_LEFT + (categories.length <= 1 ? innerW / 2 : (i * innerW) / (categories.length - 1))
    return base + offsetForSeries(si)
  }
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
      {/* Y axis */}
      <line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={PAD_TOP + innerH} stroke="#94a3b8" strokeWidth={1.5} />
      {/* X axis */}
      <line x1={PAD_LEFT} y1={PAD_TOP + innerH} x2={PAD_LEFT + innerW} y2={PAD_TOP + innerH} stroke="#94a3b8" strokeWidth={1.5} />
      {categories.map((c, i) => (
        <text key={i} x={xPos(i)} y={PAD_TOP + innerH + 14} textAnchor="middle" fontSize="10" fill="#64748b">{c}</text>
      ))}
    </g>
  )

  const paths = series.map((s, si) => {
    const style = seriesStyles?.[si] || {}
    const pts = s.data.map((v, i) => (v == null ? null : [xPos(i, si), yPos(v)] as const))
    // Build segmented path so nulls break the line
    const segs: string[] = []
    let current: string[] = []
    pts.forEach((p, i) => {
      if (!p) {
        if (current.length) { segs.push(current.join(' ')); current = [] }
        return
      }
      const [x, y] = p
      current.push(current.length === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)
    })
    if (current.length) segs.push(current.join(' '))
    return (
      <g key={si}>
        {segs.map((d, idx) => (
          <path key={idx} d={d} fill="none" stroke={s.color} strokeWidth={style.width ?? 2.5} strokeOpacity={style.opacity ?? 1} strokeDasharray={style.dash} />
        ))}
        {pts.map((p, idx) => p && (
          <g key={idx}>
            <circle cx={p[0]} cy={p[1]} r={3} fill={s.color} fillOpacity={style.opacity ?? 1} />
            {showPointLabels && (
              <text x={p[0]} y={p[1] - 8} fontSize="10" textAnchor="middle" fill="#1f2937">{String(s.data[idx] ?? '')}</text>
            )}
          </g>
        ))}
      </g>
    )
  })

  const legend = (
    <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
      {series.map((s, i) => (
        <div key={i} style={{display:'flex', alignItems:'center', gap:6}}>
          <span style={{width:18, height:3, background:s.color, display:'inline-block', borderRadius:2}} />
          <small>{s.name}</small>
        </div>
      ))}
    </div>
  )

  return (
    <div style={{display:'grid', gap:8}}>
      {title && <div className="chart-title">{title}</div>}
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title || 'Line chart'}>
        {grid}
        {paths}
      </svg>
      {legend}
    </div>
  )
}

export function BarChart({
  title,
  categories,
  series,
  height = 220,
  yMax = 100,
  yTicks = [0, 20, 40, 60, 80, 100],
}: {
  title?: string
  categories: string[]
  series: LineSeries[]
  height?: number
  yMax?: number
  yTicks?: number[]
}) {
  const W = 640
  const H = height
  const PAD_LEFT = 46
  const PAD_RIGHT = 16
  const PAD_TOP = 16
  const PAD_BOTTOM = 40
  const innerW = W - PAD_LEFT - PAD_RIGHT
  const innerH = H - PAD_TOP - PAD_BOTTOM

  const [active, setActive] = React.useState<{
    seriesName: string
    category: string
    value: number
  } | null>(null)

  React.useEffect(() => {
    const onWindowClick = () => setActive(null)
    window.addEventListener('click', onWindowClick)
    return () => window.removeEventListener('click', onWindowClick)
  }, [])

  const clamp = (v: number) => Math.max(0, Math.min(yMax, v))
  const yPos = (v: number) => PAD_TOP + innerH - (clamp(v) * innerH) / yMax

  const band = categories.length > 0 ? innerW / categories.length : innerW
  const xCenter = (i: number) => PAD_LEFT + band * (i + 0.5)

  const grid = (
    <g>
      {yTicks.map((t, i) => {
        const y = yPos(t)
        return (
          <g key={i}>
            <line x1={PAD_LEFT} y1={y} x2={W - PAD_RIGHT} y2={y} stroke="#e5e7eb" strokeWidth={1} />
            <text x={PAD_LEFT - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#64748b">
              {t}
            </text>
          </g>
        )
      })}
      <line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={PAD_TOP + innerH} stroke="#94a3b8" strokeWidth={1.5} />
      <line x1={PAD_LEFT} y1={PAD_TOP + innerH} x2={PAD_LEFT + innerW} y2={PAD_TOP + innerH} stroke="#94a3b8" strokeWidth={1.5} />
      {categories.map((c, i) => (
        <text key={i} x={xCenter(i)} y={PAD_TOP + innerH + 14} textAnchor="middle" fontSize="10" fill="#64748b">
          {c}
        </text>
      ))}
    </g>
  )

  const seriesCount = Math.max(1, series.length)
  const barGroupWidth = band * 0.7
  const barWidth = barGroupWidth / seriesCount

  const bars = series.map((s, si) => {
    return (
      <g key={si}>
        {categories.map((_, ci) => {
          const v = s.data[ci]
          if (v == null) return null
          const value = clamp(v)
          const xCenterForCat = xCenter(ci)
          const groupStart = xCenterForCat - barGroupWidth / 2
          const x = groupStart + si * barWidth
          const y = yPos(value)
          const h = PAD_TOP + innerH - y
          if (h <= 0) return null
          return (
            <rect
              key={ci}
              x={x}
              y={y}
              width={barWidth - 2}
              height={h}
              fill={s.color}
              fillOpacity={0.9}
              rx={3}
              style={{ cursor: 'pointer' }}
              onClick={e => {
                e.stopPropagation()
                setActive({
                  seriesName: s.name,
                  category: categories[ci],
                  value: Math.round(value)
                })
              }}
            />
          )
        })}
      </g>
    )
  })

  const legend = (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {series.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, background: s.color, display: 'inline-block', borderRadius: 2 }} />
          <small>{s.name}</small>
        </div>
      ))}
    </div>
  )

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {title && <div className="chart-title">{title}</div>}
      {active && (
        <div className="note" style={{ fontSize: 12 }}>
          <strong>{active.seriesName}</strong> • {active.category}:{' '}
          <strong>{active.value}%</strong>
        </div>
      )}
      <svg
        width="100%"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={title || 'Bar chart'}
      >
        {grid}
        {bars}
      </svg>
      {legend}
    </div>
  )
}
