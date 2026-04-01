import { useState, useEffect, useRef } from 'react'

interface RouletteWheelProps {
  options: string[]
  onResult: (value: string) => void
  accentColor?: string
  size?: number
  /** When provided, the internal SPIN button is hidden and spinning is triggered
   *  externally — increment this value to start a new spin. */
  spinKey?: number
}

function polygonPoints(n: number, cx: number, cy: number, r: number) {
  return Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  })
}

// Arcs for the n=2 circle case: top arc (option 0) and bottom arc (option 1)
function circleArcs(cx: number, cy: number, r: number) {
  return [
    `M ${cx - r},${cy} A ${r} ${r} 0 0 0 ${cx + r},${cy}`, // 9→12→3 (top)
    `M ${cx + r},${cy} A ${r} ${r} 0 0 0 ${cx - r},${cy}`, // 3→6→9 (bottom)
  ]
}

export default function RouletteWheel({
  options,
  onResult,
  accentColor = '#ffb693',
  size = 280,
  spinKey,
}: RouletteWheelProps) {
  const n = options.length
  const [activeEdge, setActiveEdge] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const optionsRef = useRef(options)
  const onResultRef = useRef(onResult)
  useEffect(() => { optionsRef.current = options }, [options])
  useEffect(() => { onResultRef.current = onResult }, [onResult])

  const SIZE = size
  const cx = SIZE / 2
  const cy = SIZE / 2
  const r = SIZE / 2 - 14
  const STROKE = 10
  const DIM = '#2e2d2d'

  const pts = n >= 3 ? polygonPoints(n, cx, cy, r) : []
  const arcs = n === 2 ? circleArcs(cx, cy, r) : []

  // Apothem = radius of the inscribed circle inside the polygon.
  // This is the max "safe" radius for center text.
  const apothem =
    n === 2 ? r          // full circle interior
    : n >= 3 ? r * Math.cos(Math.PI / n)
    : r
  const textAreaWidth = apothem * 1.75

  // Scale font size so even long strings fit inside the inscribed circle
  const currentText = n > 0 ? (options[activeEdge] ?? '') : ''
  const rawFontPx = textAreaWidth / Math.max(currentText.length * 0.52, 1)
  const fontPx = Math.max(8, Math.min(rawFontPx, SIZE * 0.08))

  function startSpin() {
    if (spinning || n === 0) return
    setSpinning(true)
    const currentN = optionsRef.current.length
    const target = Math.floor(Math.random() * currentN)
    const totalSteps = 2 * currentN + target + 1
    let step = 0

    const tick = () => {
      setActiveEdge(step % currentN)
      step++
      if (step < totalSteps) {
        const progress = step / totalSteps
        const delay = progress < 0.4 ? 60 : progress < 0.7 ? 110 : progress < 0.85 ? 170 : 240
        timerRef.current = setTimeout(tick, delay)
      } else {
        setActiveEdge(target)
        setSpinning(false)
        onResultRef.current(optionsRef.current[target])
      }
    }
    tick()
  }

  // External spin trigger
  useEffect(() => {
    if (spinKey === undefined || spinKey === 0) return
    startSpin()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinKey])

  // Clamp activeEdge when options shrink
  useEffect(() => {
    if (n > 0) setActiveEdge((prev) => (prev >= n ? 0 : prev))
  }, [n])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const externallyControlled = spinKey !== undefined

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ filter: `drop-shadow(0 0 18px ${accentColor}25)` }}
        >
          <defs>
            <filter id="edge-glow" x="-10" y="-10" width={SIZE + 20} height={SIZE + 20} filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {n === 2 ? (
            /* ── Circle (2 options) ── */
            <>
              <circle cx={cx} cy={cy} r={r} fill="#1c1b1b" />
              {arcs.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  fill="none"
                  stroke={activeEdge === i ? accentColor : DIM}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  filter={activeEdge === i ? 'url(#edge-glow)' : undefined}
                />
              ))}
            </>
          ) : (
            /* ── Polygon (3+ options) ── */
            <>
              <polygon
                points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="#1c1b1b"
              />
              {pts.map((p, i) => {
                const next = pts[(i + 1) % n]
                return (
                  <line
                    key={i}
                    x1={p.x} y1={p.y}
                    x2={next.x} y2={next.y}
                    stroke={DIM}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                  />
                )
              })}
              {n > 0 && pts[activeEdge] && pts[(activeEdge + 1) % n] && (
                <line
                  x1={pts[activeEdge].x} y1={pts[activeEdge].y}
                  x2={pts[(activeEdge + 1) % n].x} y2={pts[(activeEdge + 1) % n].y}
                  stroke={accentColor}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  filter="url(#edge-glow)"
                />
              )}
            </>
          )}
        </svg>

        {/* Center text — width capped to the polygon's inscribed circle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p
            className="font-['Lexend'] font-extrabold uppercase text-center leading-tight"
            style={{
              color: accentColor,
              fontSize: fontPx,
              maxWidth: textAreaWidth,
              overflowWrap: 'anywhere',
              textShadow: `0 1px 6px rgba(0,0,0,0.8)`,
            }}
          >
            {currentText}
          </p>
        </div>
      </div>

      {!externallyControlled && (
        <button
          onClick={startSpin}
          disabled={spinning}
          className="font-['Lexend'] font-black px-8 py-3 rounded-full active:scale-95 transition-all shadow-xl uppercase tracking-widest text-sm disabled:opacity-50 text-[#1c1b1b]"
          style={{ backgroundColor: accentColor }}
        >
          SPIN
        </button>
      )}
    </div>
  )
}
