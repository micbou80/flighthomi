'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface TrackPoint {
  lat: number
  lon: number
}

interface FlightMapProps {
  trackPoints: TrackPoint[]
  lastLat: number
  lastLon: number
  lastHeading: number | null
  originCode: string
  destinationCode: string
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(L.latLngBounds(points), { padding: [32, 32] })
    }
  }, [map, points])
  return null
}

function makeLabel(code: string, color: string) {
  return L.divIcon({
    html: `<span style="background:${color};color:#000;font-size:10px;font-weight:700;padding:2px 5px;border-radius:3px;white-space:nowrap;">${code}</span>`,
    className: '',
    iconAnchor: [16, 8],
  })
}

function makePlaneIcon(heading: number | null) {
  const deg = (heading ?? 0) - 90
  return L.divIcon({
    html: `<span style="display:inline-block;transform:rotate(${deg}deg);font-size:18px;line-height:1;filter:drop-shadow(0 0 6px rgba(96,165,250,0.9));">✈</span>`,
    className: '',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

export default function FlightMap({
  trackPoints,
  lastLat,
  lastLon,
  lastHeading,
  originCode,
  destinationCode,
}: FlightMapProps) {
  const positions: [number, number][] = trackPoints.map((p) => [p.lat, p.lon])
  const allPoints: [number, number][] = [...positions, [lastLat, lastLon]]
  const origin = positions[0] ?? [lastLat, lastLon]

  return (
    <div className="rounded-lg overflow-hidden border border-gray-800" style={{ height: 280 }}>
      <MapContainer
        center={[lastLat, lastLon]}
        zoom={6}
        style={{ height: '100%', width: '100%', background: '#0d1117' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />
        {positions.length > 1 && (
          <Polyline positions={positions} color="#22c55e" weight={2} opacity={0.85} />
        )}
        <Marker position={origin} icon={makeLabel(originCode, '#facc15')} />
        <Marker position={[lastLat, lastLon]} icon={makePlaneIcon(lastHeading)} />
        <Marker
          position={positions[positions.length - 1] ?? [lastLat, lastLon]}
          icon={makeLabel(destinationCode, '#facc15')}
        />
        <FitBounds points={allPoints} />
      </MapContainer>
    </div>
  )
}
