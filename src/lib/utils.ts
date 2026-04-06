import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInMinutes, format, parseISO } from 'date-fns'
import type { FlightStatus } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(departureISO: string, arrivalISO: string): string {
  const mins = differenceInMinutes(parseISO(arrivalISO), parseISO(departureISO))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function formatDateTime(iso: string): string {
  return format(parseISO(iso), 'MMM d, HH:mm')
}

export function formatTime(iso: string): string {
  return format(parseISO(iso), 'HH:mm')
}

export function formatDate(iso: string): string {
  return format(parseISO(iso), 'EEE, MMM d yyyy')
}

export function getStatusColor(status: FlightStatus): string {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-500/20 text-blue-300 ring-blue-500/30'
    case 'in_air':
      return 'bg-green-500/20 text-green-300 ring-green-500/30'
    case 'landed':
      return 'bg-gray-500/20 text-gray-300 ring-gray-500/30'
    case 'cancelled':
      return 'bg-red-500/20 text-red-300 ring-red-500/30'
  }
}

export function statusLabel(status: FlightStatus): string {
  switch (status) {
    case 'scheduled':
      return 'Scheduled'
    case 'in_air':
      return 'In Air'
    case 'landed':
      return 'Landed'
    case 'cancelled':
      return 'Cancelled'
  }
}
