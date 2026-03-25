'use client'

import { IconAlertCircleFilled, IconCircleCheckFilled, IconCircleXFilled, IconRefresh } from '@tabler/icons-react'
import clsx from 'clsx'
import { useMemo } from 'react'

import type { Status, UptimeState } from '@/types'

import { timeFromNow } from '@/utils/timeFromNow'

import useStatuses from '@/hooks/useStatuses'
import { useViewportSize } from '@/hooks/useViewportSize'

import { StatusItem } from '@/components/status-item'
import { Skeleton } from '@/components/ui/skeleton'

interface GroupedData {
  [key: string]: {
    groupStatus: UptimeState
    data: Status[]
  }
}

// Helper functions for data processing
function resolveGroupStatus(statuses: Status[]): UptimeState {
  const upCount = statuses.reduce((count, status) => {
    return count + (status.results[status.results.length - 1].success ? 1 : 0)
  }, 0)

  const total = statuses.length
  return {
    up: upCount,
    total: total,
    percent: (upCount / total) * 100,
  }
}

function resolveUptime(status: Status) {
  const total = status.results.length
  const success = status.results.filter(result => result.success).length
  return (success / total) * 100
}

export function StatusList() {
  const { width } = useViewportSize()
  const resolvedWidth = width > 0 ? (width < 640 ? 30 : width < 1024 ? 60 : 90) : undefined

  const { data, isLoading, isValidating, mutate } = useStatuses(resolvedWidth)

  // Compute derived state using useMemo
  const resolvedData = useMemo(() => {
    if (!data?.length) return undefined

    const groupedData = data.reduce((acc: GroupedData, status) => {
      const group = status.group
      acc[group] = acc[group] || { groupStatus: -1, data: [] }
      status.uptime = resolveUptime(status)
      acc[group].data.push(status)
      return acc
    }, {})

    Object.keys(groupedData).forEach(group => {
      groupedData[group].groupStatus = resolveGroupStatus(groupedData[group].data)
    })

    return groupedData
  }, [data])

  const globalStatus = data?.length ? resolveGroupStatus(data) : undefined

  const latestTimestamp = data?.length
    ? data.reduce((latest, item) => {
        const maxUnixTimestamp = item.results.reduce((max, result) => {
          const unixTimestamp = new Date(result.timestamp).getTime()
          return unixTimestamp > max ? unixTimestamp : max
        }, latest)
        return maxUnixTimestamp > latest ? maxUnixTimestamp : latest
      }, 0)
    : undefined

  return (
    <>
      {globalStatus && latestTimestamp ? (
        <div className='mb-4 flex items-center gap-3 rounded-lg border border-fg/10 px-4 py-3'>
          {globalStatus.percent === 100 ? (
            <>
              <IconCircleCheckFilled className='size-5 shrink-0 text-emerald-500' />
              <span className='font-medium'>All systems operational</span>
            </>
          ) : globalStatus.percent === 0 ? (
            <>
              <IconCircleXFilled className='size-5 shrink-0 text-red-500' />
              <span className='font-medium'>All services are offline</span>
            </>
          ) : (
            <>
              <IconAlertCircleFilled className='size-5 shrink-0 text-amber-500' />
              <span className='font-medium'>Some services are offline</span>
            </>
          )}
          <button
            type='button'
            onClick={() => mutate()}
            aria-label='Refresh'
            disabled={isLoading || isValidating}
            className='focus-ring ml-auto rounded-full text-fg/40 hover:text-fg/70 transition-colors'
          >
            <IconRefresh className={clsx('size-4', (isLoading || isValidating) && 'animate-spin')} />
          </button>
        </div>
      ) : (
        <Skeleton className='mb-4 h-[52px] w-full rounded-lg' />
      )}


      {resolvedData ? (
        <div className='grid gap-2'>
          {Object.entries(resolvedData).map(([group, statuses]) => (
            <div key={group} className='overflow-hidden rounded-lg border border-fg/10'>
              <div className='px-4 pt-3 pb-1 flex items-center justify-between'>
                <span className='text-xs font-semibold text-fg/50 uppercase tracking-wide'>{group}</span>
                <span className='text-xs font-semibold uppercase tracking-wide'>
                  {statuses.groupStatus.percent === 100 ? (
                    <span className='flex items-center gap-1.5 text-emerald-600'>
                      <span className='size-2 rounded-full bg-emerald-500' />
                      Operational
                    </span>
                  ) : statuses.groupStatus.percent === 0 ? (
                    <span className='flex items-center gap-1.5 text-red-600'>
                      <span className='size-2 rounded-full bg-red-500' />
                      Offline
                    </span>
                  ) : (
                    <span className='flex items-center gap-1.5 text-amber-600'>
                      <span className='size-2 rounded-full bg-amber-500' />
                      Partial — {statuses.groupStatus.up}/{statuses.data.length}
                    </span>
                  )}
                </span>
              </div>
              <div className='divide-y divide-fg/5'>
                {statuses.data.map(status => (
                  <StatusItem data={status} key={status.key} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='grid gap-2'>
          {[
            ...new Array(process.env.NEXT_PUBLIC_GROUP_SIZE ? parseInt(process.env.NEXT_PUBLIC_GROUP_SIZE, 10) : 3),
          ].map((_, idx) => {
            return <Skeleton key={idx} className='mt-px h-[52px] w-full rounded-lg' />
          })}
        </div>
      )}
    </>
  )
}
