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

  const chartHeight = 64
  const chartWidth = 600
  const paddingY = 8

  const durations = results.map(r => r.duration / 1_000_000)
  const timestamps = results.map(r => +new Date(r.timestamp))
  const minVal = Math.min(...durations)
  const maxVal = Math.max(...durations)
  const range = maxVal - minVal || 1
  const n = durations.length

  const getX = (i: number) => (i / Math.max(n - 1, 1)) * chartWidth
  const getY = (d: number) => paddingY + ((maxVal - d) / range) * (chartHeight - paddingY * 2)

  const baselineY = getY(minVal)
  const lastDuration = durations[n - 1]
  const lastY = getY(lastDuration)
  const polylinePoints = durations.map((d, i) => `${getX(i)},${getY(d)}`).join(' ')

  // X-axis labels: 7 evenly-spaced time labels
  const LABEL_COUNT = 6
  const minTime = timestamps[0]
  const maxTime = timestamps[n - 1]
  const timeRange = maxTime - minTime || 1
  const axisLabels = Array.from({ length: LABEL_COUNT + 1 }, (_, i) => ({
    label: formatAxisTime(minTime + (i / LABEL_COUNT) * timeRange),
    align: i === 0 ? 'left' : i === LABEL_COUNT ? 'right' : 'center',
  }))

  const hi = hoveredIndex
  const hoveredDuration = hi !== null ? durations[hi] : null
  const hoveredTimestamp = hi !== null ? timestamps[hi] : null
  const hoveredX = hi !== null ? getX(hi) : null
  const hoveredY = hi !== null ? getY(durations[hi]) : null
  const hoveredSuccess = hi !== null ? results[hi].success : true

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width
    const idx = Math.round(relX * (n - 1))
    setHoveredIndex(Math.max(0, Math.min(idx, n - 1)))
  }

  // Clamp hover tooltip position so it stays within container
  const hoverLeftPercent = hi !== null ? (hi / Math.max(n - 1, 1)) * 100 : null

  return (
    <div
      ref={containerRef}
      className='relative w-full select-none cursor-crosshair'
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {/* SVG wrapper — explicit height + overflow-hidden prevents ~Xms from leaking into X-axis */}
      <div className='relative overflow-hidden' style={{ height: `${chartHeight}px` }}>
        {/* Hover info overlay — follows mouse horizontally */}
        {hoveredDuration !== null && hoveredTimestamp !== null && hoverLeftPercent !== null && (
          <div
            className='absolute top-0 bottom-0 flex items-center pointer-events-none z-10'
            style={{
              left: `clamp(3rem, ${hoverLeftPercent}%, calc(100% - 7rem))`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className='flex items-baseline gap-1'>
              <span className='text-3xl font-bold tabular-nums leading-none'>{lazyFloat(hoveredDuration)}</span>
              <span className='text-base text-fg/50'>ms</span>
              <span className='text-sm text-fg/40 ml-1 whitespace-nowrap'>{formatHoverTime(hoveredTimestamp)}</span>
            </div>
          </div>
        )}

        {/* SVG line chart */}
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio='none'
          className='w-full block'
          style={{ height: `${chartHeight}px` }}
        >
          {/* Baseline dashed */}
          <line
            x1={0} y1={baselineY} x2={chartWidth} y2={baselineY}
            stroke='currentColor' strokeWidth='1' strokeDasharray='4 4'
            className='text-fg/20'
          />
          {/* Response time polyline */}
          <polyline
            points={polylinePoints}
            fill='none' stroke='currentColor' strokeWidth='1.5'
            className='text-sky-500' vectorEffect='non-scaling-stroke'
          />
          {/* Data point dots */}
          {durations.map((d, i) => (
            <circle
              key={i} cx={getX(i)} cy={getY(d)} r='2' fill='currentColor'
              className={results[i].success ? 'text-emerald-500' : 'text-red-500'}
            />
          ))}
          {/* Hover crosshair */}
          {hoveredX !== null && hoveredY !== null && (
            <>
              <line
                x1={hoveredX} y1={0} x2={hoveredX} y2={chartHeight}
                stroke='currentColor' strokeWidth='1' strokeDasharray='3 3'
                className='text-fg/40' vectorEffect='non-scaling-stroke'
              />
              <circle
                cx={hoveredX} cy={hoveredY} r='4' fill='currentColor'
                className={hoveredSuccess ? 'text-emerald-500' : 'text-red-500'}
                vectorEffect='non-scaling-stroke'
              />
            </>
          )}
        </svg>

      </div>

      {/* X-axis time labels + ~Xms at the right end */}
      <div className='flex justify-between items-center mt-0.5'>
        {axisLabels.map((item, i) => (
          <span
            key={i}
            className={clsx(
              'text-xs text-fg/40',
              item.align === 'left' ? 'text-left' : item.align === 'right' ? 'text-right' : 'text-center'
            )}
          >
            {item.label}
          </span>
        ))}
        <span className='text-xs text-sky-600 font-mono whitespace-nowrap'>
          ~{lazyFloat(lastDuration)}ms
        </span>
      </div>
    </div>
  )
}

export const StatusItem = memo(function StatusItem({
  data,
  showResponseTime,
}: {
  data: Status
  showResponseTime?: boolean
}) {
  const firstResult = data.results[0]
  const lastResult = data.results[data.results.length - 1]

  return (
    <div className='mx-4 grid gap-1'>
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
      {showResponseTime && <ResponseTimeChart results={data.results} />}

      {/* Timestamps */}
      <div className='text-fg/80 flex items-center justify-between text-sm'>
        <div>{timeFromNow(+new Date(firstResult.timestamp))}</div>
        <div>{timeFromNow(+new Date(lastResult.timestamp))}</div>
      </div>
    </div>
  )
})
