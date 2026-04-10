'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Flight, FlightLookupResult } from '@/lib/types'

const flightSchema = z.object({
  flight_number: z.string().min(2, 'Required'),
  airline: z.string().min(1, 'Required'),
  origin_code: z.string().length(3, 'Must be 3-letter IATA code').toUpperCase(),
  destination_code: z.string().length(3, 'Must be 3-letter IATA code').toUpperCase(),
  departure_time: z.string().min(1, 'Required'),
  arrival_time: z.string().min(1, 'Required'),
  status: z.enum(['scheduled', 'taxiing', 'in_air', 'landed', 'cancelled']),
  aircraft_type: z.string().optional(),
  seat: z.string().optional(),
  notes: z.string().optional(),
})

type FlightFormValues = z.infer<typeof flightSchema>

function toDatetimeLocal(iso: string) {
  if (!iso) return ''
  // No timezone suffix = already a local time (e.g. from AviationStack schedule)
  // Match +00, +00:00, +0000 — Supabase returns +HH (2-digit) offsets
  if (!iso.endsWith('Z') && !/[+-]\d{2}(?::?\d{2})?$/.test(iso)) {
    return iso.slice(0, 16)
  }
  const d = new Date(iso)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

function fromDatetimeLocal(local: string) {
  if (!local) return ''
  return new Date(local).toISOString()
}

interface FlightFormProps {
  defaultValues?: Partial<Flight>
  flightId?: string
}

export default function FlightForm({ defaultValues, flightId }: FlightFormProps) {
  const router = useRouter()
  const [lookupFn, setLookupFn] = useState('')
  const [lookupDate, setLookupDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FlightFormValues>({
    resolver: zodResolver(flightSchema),
    defaultValues: {
      flight_number: defaultValues?.flight_number ?? '',
      airline: defaultValues?.airline ?? '',
      origin_code: defaultValues?.origin_code ?? '',
      destination_code: defaultValues?.destination_code ?? '',
      departure_time: defaultValues?.departure_time
        ? toDatetimeLocal(defaultValues.departure_time)
        : '',
      arrival_time: defaultValues?.arrival_time
        ? toDatetimeLocal(defaultValues.arrival_time)
        : '',
      status: defaultValues?.status ?? 'scheduled',
      aircraft_type: defaultValues?.aircraft_type ?? '',
      seat: defaultValues?.seat ?? '',
      notes: defaultValues?.notes ?? '',
    },
  })

  async function handleLookup() {
    if (!lookupFn) return
    setLookupLoading(true)
    setLookupError(null)
    try {
      const res = await fetch(
        `/api/flight-lookup?fn=${encodeURIComponent(lookupFn)}&date=${lookupDate}`
      )
      if (!res.ok) {
        const data = await res.json()
        setLookupError(data.error ?? 'Flight not found')
        return
      }
      const data: FlightLookupResult = await res.json()
      setValue('flight_number', lookupFn)
      setValue('airline', data.airline)
      setValue('origin_code', data.origin_code)
      setValue('destination_code', data.destination_code)
      setValue('departure_time', toDatetimeLocal(data.departure_time))
      setValue('arrival_time', toDatetimeLocal(data.arrival_time))
      setValue('status', data.status)
      if (data.aircraft_type) setValue('aircraft_type', data.aircraft_type)
    } catch {
      setLookupError('Lookup failed')
    } finally {
      setLookupLoading(false)
    }
  }

  async function onSubmit(values: FlightFormValues) {
    setSaving(true)
    const body = {
      ...values,
      departure_time: fromDatetimeLocal(values.departure_time),
      arrival_time: fromDatetimeLocal(values.arrival_time),
      aircraft_type: values.aircraft_type || null,
      seat: values.seat || null,
      notes: values.notes || null,
    }

    try {
      if (flightId) {
        const res = await fetch(`/api/flights/${flightId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Save failed')
      } else {
        const res = await fetch('/api/flights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Save failed')
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setSaving(false)
      alert('Failed to save flight. Please try again.')
    }
  }

  async function handleDelete() {
    if (!flightId) return
    const res = await fetch(`/api/flights/${flightId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Flight lookup */}
      <div className="rounded-xl border border-gray-700 bg-gray-900/50 p-4 space-y-3">
        <p className="text-sm font-medium text-gray-300">Look up by flight number</p>
        <div className="flex gap-2">
          <input
            value={lookupFn}
            onChange={(e) => setLookupFn(e.target.value.toUpperCase())}
            placeholder="e.g. UA123"
            className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
          <input
            type="date"
            value={lookupDate}
            onChange={(e) => setLookupDate(e.target.value)}
            className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleLookup}
            disabled={lookupLoading || !lookupFn}
            className="flex items-center gap-1.5 rounded-lg bg-gray-700 px-3 py-2 text-sm font-medium text-white hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            {lookupLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Look up
          </button>
        </div>
        {lookupError && <p className="text-xs text-red-400">{lookupError}</p>}
      </div>

      {/* Form fields */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Flight Number" error={errors.flight_number?.message}>
          <input {...register('flight_number')} placeholder="UA123" className={inputClass} />
        </Field>
        <Field label="Airline" error={errors.airline?.message}>
          <input {...register('airline')} placeholder="United Airlines" className={inputClass} />
        </Field>
        <Field label="Origin (IATA)" error={errors.origin_code?.message}>
          <input
            {...register('origin_code')}
            placeholder="ORD"
            className={cn(inputClass, 'uppercase')}
            maxLength={3}
          />
        </Field>
        <Field label="Destination (IATA)" error={errors.destination_code?.message}>
          <input
            {...register('destination_code')}
            placeholder="LHR"
            className={cn(inputClass, 'uppercase')}
            maxLength={3}
          />
        </Field>
        <Field label="Departure" error={errors.departure_time?.message}>
          <input type="datetime-local" {...register('departure_time')} className={inputClass} />
        </Field>
        <Field label="Arrival" error={errors.arrival_time?.message}>
          <input type="datetime-local" {...register('arrival_time')} className={inputClass} />
        </Field>
        <Field label="Status" error={errors.status?.message}>
          <select {...register('status')} className={inputClass}>
            <option value="scheduled">Scheduled</option>
            <option value="in_air">In Air</option>
            <option value="landed">Landed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </Field>
        <Field label="Aircraft Type" error={errors.aircraft_type?.message}>
          <input {...register('aircraft_type')} placeholder="Boeing 737" className={inputClass} />
        </Field>
        <Field label="Seat" error={errors.seat?.message}>
          <input {...register('seat')} placeholder="14A" className={inputClass} />
        </Field>
        <Field label="Notes" error={errors.notes?.message}>
          <input {...register('notes')} placeholder="Optional notes" className={inputClass} />
        </Field>
      </div>

      <div className="flex items-center justify-between gap-4 pt-2">
        {flightId && (
          <div>
            {deleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-400">Are you sure?</span>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-sm text-red-400 hover:text-red-300 font-medium"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(false)}
                  className="text-sm text-gray-400 hover:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDeleteConfirm(true)}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Delete flight
              </button>
            )}
          </div>
        )}
        <div className={cn('flex gap-3', !flightId && 'ml-auto')}>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : flightId ? 'Save changes' : 'Add flight'}
          </button>
        </div>
      </div>
    </form>
  )
}

const inputClass =
  'w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}
