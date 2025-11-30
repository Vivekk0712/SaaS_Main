"use client"
import React from 'react'

type PieDatum = { label: string; value: number; color: string }

export function PieChart({ data, size = 180, thickness = 26 }: { data: PieDatum[]; size?: number; thickness?: number }) {
  const total = Math.max(0, data.reduce((s, d) => s + Math.max(0, Number(d.value || 0)), 0))
  const radius = size / 2
  const inner = radius - thickness
  let offset = 0
  const arcs = data.map((d) => {
    const v = Math.max(0, Number(d.value || 0))
    const frac = total ? (v / total) : 0
    const length = frac * Math.PI * 2
    const start = offset
    const end = offset + length
    offset = end
    return { ...d, start, end }
  })
  return (
    <div style={{ display: 'grid', justifyContent: 'center', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <mask id="donut-hole">
            <rect x="0" y="0" width={size} height={size} fill="white" />
            <circle cx={radius} cy={radius} r={inner} fill="black" />
          </mask>
        </defs>
        <g transform={`translate(${radius}, ${radius})`} mask="url(#donut-hole)">
          {arcs.map((a, i) => {
            const r = radius
            const x1 = Math.cos(a.start) * r
            const y1 = Math.sin(a.start) * r
            const x2 = Math.cos(a.end) * r
            const y2 = Math.sin(a.end) * r
            const large = (a.end - a.start) > Math.PI ? 1 : 0
            const d = `M 0 0 L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
            return <path key={i} d={d} fill={a.color} />
          })}
        </g>
        <circle cx={radius} cy={radius} r={inner} fill="var(--panel)" />
      </svg>
      <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: d.color, display: 'inline-block' }} />
            <span style={{ fontWeight: 600 }}>{d.label}</span>
            <span className="note">{Number(d.value || 0)}</span>
          </div>
        ))}
        {total === 0 && <div className="note">No data</div>}
      </div>
    </div>
  )
}

