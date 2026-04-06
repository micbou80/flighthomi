import { cn, getStatusColor, statusLabel } from '@/lib/utils'
import type { FlightStatus } from '@/lib/types'

export default function FlightStatusBadge({ status }: { status: FlightStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        getStatusColor(status)
      )}
    >
      {statusLabel(status)}
    </span>
  )
}
