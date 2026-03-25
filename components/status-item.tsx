'use client'

import { IconCircleCheckFilled, IconCircleXFilled } from '@tabler/icons-react'
import clsx from 'clsx'
import { memo, useRef, useState } from 'react'

import type { Status } from '@/types'

import { lazyFloat } from '@/utils/lazyFloat'
import { timeFromNow } from '@/utils/timeFromNow'

import { FormattedTimestampDisplay } from '@/components/timestamp-display'
import { TooltipContent, TooltipPositioner, TooltipRoot, TooltipTrigger } from '@/components/ui/tooltip'

function formatAxisTime(ts: number) {
  const d = new Date(ts)
  const h = d.getHours()
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hh = h % 12 || 12
  return `${String(hh).padStart(2, '0')} ${ampm}`
}

function formatHoverTime(ts: number) {
  const d = new Date(ts)
  const h = d.getHours()
  const m = d.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hh = h % 12 || 12
  return `${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`
}

function ResponseTimeChart({ results }: { results: Status['results'] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const CHART_H = 110
  const SVG_W = 700
  const Y_PAD = 40  // left space for y-axis labels
  const PAD_TOP = 14
  const PAD_BOT = 6
  const CHART_W = SVG_W - Y_PAD
  const X_AXIS_H = 16
  const TOTAL_H = CHART_H + X_AXIS_H

  const durations = results.map(r => r.duration / 1_000_000)
  const timestamps = results.map(r => +new Date(r.timestamp))
  const maxVal = Math.max(...durations)
  const n = durations.length

  // Nice Y-axis max (round up to nearest 50)
  const niceMax = Math.max(Math.ceil(maxVal / 50) * 50, 50)
  const tickStep = niceMax <= 100 ? 25 : niceMax <= 300 ? 50 : 100
  const yTicks = Array.from({ length: Math.floor(niceMax / tickStep) + 1 }, (_, i) => i * tickStep)

  const getX = (i: number) => Y_PAD + (i / Math.max(n - 1, 1)) * CHART_W
  const getY = (d: number) => PAD_TOP + ((niceMax - d) / niceMax) * (CHART_H - PAD_TOP - PAD_BOT)

  const polylinePoints = durations.map((d, i) => `${getX(i)},${getY(d)}`).join(' ')
  const areaPoints = `${getX(0)},${CHART_H} ${polylinePoints} ${getX(n - 1)},${CHART_H}`

  const LABEL_COUNT = 6
  const minTime = timestamps[0]
  const maxTime = timestamps[n - 1]
  const timeRange = maxTime - minTime || 1
  const xLabels = Array.from({ length: LABEL_COUNT + 1 }, (_, i) => ({
    label: formatAxisTime(minTime + (i / LABEL_COUNT) * timeRange),
    x: getX(Math.round((i / LABEL_COUNT) * (n - 1))),
    anchor: i === 0 ? 'start' : i === LABEL_COUNT ? 'end' : 'middle',
  }))

  const hi = hoveredIndex
  const hoveredDuration = hi !== null ? durations[hi] : null
  const hoveredTimestamp = hi !== null ? timestamps[hi] : null
  const hoveredX = hi !== null ? getX(hi) : null
  const hoveredY = hi !== null ? getY(durations[hi]) : null

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const chartLeft = (Y_PAD / SVG_W) * rect.width
    const chartRight = rect.width
    const relX = (e.clientX - rect.left - chartLeft) / (chartRight - chartLeft)
    const idx = Math.round(Math.max(0, Math.min(relX, 1)) * (n - 1))
    setHoveredIndex(idx)
  }

  return (
    <div
      ref={containerRef}
      className='relative w-full select-none cursor-crosshair'
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      <svg
        viewBox={`0 0 ${SVG_W} ${TOTAL_H}`}
        className='w-full block'
        style={{ height: `${TOTAL_H}px` }}
      >
        {/* Y-axis label */}
        <text
          x={0} y={CHART_H / 2}
          textAnchor='middle'
          fontSize='9'
          fill='currentColor'
          className='text-fg/40'
          transform={`rotate(-90, 8, ${CHART_H / 2})`}
        >
          Response times(ms)
        </text>

        {/* Y-axis gridlines + tick labels */}
        {yTicks.map((tick, i) => {
          const y = getY(tick)
          return (
            <g key={i}>
              <line
                x1={Y_PAD} y1={y} x2={SVG_W} y2={y}
                stroke='currentColor' strokeWidth='0.5'
                className='text-fg/15'
              />
              <text
                x={Y_PAD - 4} y={y + 3}
                textAnchor='end'
                fontSize='9'
                fill='currentColor'
                className='text-fg/40'
              >
                {Math.round(tick)}
              </text>
            </g>
          )
        })}

        {/* Area fill */}
        <polygon
          points={areaPoints}
          fill='currentColor'
          className='text-slate-400/15'
        />

        {/* Line */}
        <polyline
          points={polylinePoints}
          fill='none'
          stroke='currentColor'
          strokeWidth='1.5'
          className='text-slate-500'
          vectorEffect='non-scaling-stroke'
        />

        {/* Hover crosshair + dot */}
        {hoveredX !== null && hoveredY !== null && (
          <>
            <line
              x1={hoveredX} y1={PAD_TOP} x2={hoveredX} y2={CHART_H - PAD_BOT}
              stroke='currentColor' strokeWidth='1' strokeDasharray='3 3'
              className='text-fg/30' vectorEffect='non-scaling-stroke'
            />
            <circle
              cx={hoveredX} cy={hoveredY} r='3'
              fill='currentColor' className='text-slate-600'
              vectorEffect='non-scaling-stroke'
            />
            <text
              x={Math.max(Y_PAD + 20, Math.min(SVG_W - 30, hoveredX))}
              y={PAD_TOP - 2}
              textAnchor='middle'
              fontSize='10'
              fill='currentColor'
              className='text-fg/60'
            >
              {hoveredDuration !== null ? `${lazyFloat(hoveredDuration)}ms` : ''}
              {hoveredTimestamp !== null ? `  ${formatHoverTime(hoveredTimestamp)}` : ''}
            </text>
          </>
        )}

        {/* X-axis labels */}
        {xLabels.map((item, i) => (
          <text
            key={i}
            x={item.x}
            y={CHART_H + X_AXIS_H - 2}
            textAnchor={item.anchor as 'start' | 'middle' | 'end'}
            fontSize='9'
            fill='currentColor'
            className='text-fg/40'
          >
            {item.label}
          </text>
        ))}
      </svg>
    </div>
  )
}

export const StatusItem = memo(function StatusItem({ data }: { data: Status }) {
  const firstResult = data.results[0]
  const lastResult = data.results[data.results.length - 1]

  return (
    <div className='px-4 py-4 grid gap-1.5'>
      {/* Title */}
      <div className='flex items-center justify-between'>
        <h3 className='flex items-center gap-1 text-base font-semibold'>
          {lastResult.success ? (
            <IconCircleCheckFilled className='size-6 shrink-0 fill-emerald-500' />
          ) : (
            <IconCircleXFilled className='size-6 shrink-0 fill-red-500' />
          )}
          <span className='line-clamp-1'>{data.name}</span>
        </h3>
        {data.uptime !== undefined && (
          <div
            className={clsx(
              'text-right text-sm text-nowrap',
              data.uptime > 90
                ? 'text-emerald-700'
                : data.uptime > 75
                  ? 'text-yellow-700'
                  : data.uptime > 50
                    ? 'text-amber-700'
                    : 'text-red-700'
            )}
          >
            {data.uptime?.toFixed(2)}% uptime
          </div>
        )}
      </div>

      {/* Charts */}
      <div className='flex gap-px overflow-hidden rounded-sm'>
        {data.results.map(result => {
          return (
            <TooltipRoot key={result.timestamp}>
              <TooltipTrigger
                render={
                  <button
                    type='button'
                    className={clsx(
                      'h-6 w-full',
                      result.success ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                    )}
                  />
                }
              />
              <TooltipPositioner>
                <TooltipContent>
                  <div className='space-y-1'>
                    {result.conditionResults?.length ? (
                      <div>
                        {result.conditionResults.map((result, idx) => {
                          return (
                            <div key={idx} className='flex items-center gap-1'>
                              {result.success ? (
                                <>
                                  <IconCircleCheckFilled className='size-4 fill-emerald-600' />
                                  <span className='font-mono text-sm text-emerald-600'>{result.condition}</span>
                                </>
                              ) : (
                                <>
                                  <IconCircleXFilled className='size-4 fill-red-600' />
                                  <span className='fill-red-600 font-mono text-sm'>{result.condition}</span>
                                </>
                              )}
                            </div>
                          )
                        })}
                        <hr className='m-1 border-fg/30 -mx-3' />
                      </div>
                    ) : null}
                    <div className='text-fg/60'>
                      {lazyFloat(result.duration / 1000 / 1000)}ms, {timeFromNow(+new Date(result.timestamp))}
                    </div>
                    <FormattedTimestampDisplay timestamp={+new Date(result.timestamp)} />
                  </div>
                </TooltipContent>
              </TooltipPositioner>
            </TooltipRoot>
          )
        })}
      </div>

      {/* Response Time Chart */}
      {(() => {
        const val = process.env.NEXT_PUBLIC_SHOW_RESPONSE_TIME ?? ''
        const show =
          val === 'true' ||
          val.split(',').map(s => s.trim()).includes(data.key)
        return show ? <ResponseTimeChart results={data.results} /> : null
      })()}

      {/* Timestamps */}
      <div className='text-ac/70 flex items-center justify-between text-xs uppercase tracking-wide'>
        <div>{timeFromNow(+new Date(firstResult.timestamp))}</div>
        <div>{timeFromNow(+new Date(lastResult.timestamp))}</div>
      </div>
    </div>
  )
})
