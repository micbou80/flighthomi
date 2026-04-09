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
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40] })
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
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:30px;height:30px;
      background:rgba(96,165,250,0.25);
      border:2px solid rgba(96,165,250,0.6);
      border-radius:50%;
    ">
      <span style="
        display:inline-block;
        transform:rotate(${deg}deg);
        font-size:16px;
        line-height:1;
        filter:drop-shadow(0 0 4px rgba(96,165,250,1));
      ">✈</span>
    </div>`,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
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
  const planePos: [number, number] = [lastLat, lastLon]

  // Determine if the plane has a live position distinct from the last track point
  const lastTrack = positions[positions.length - 1]
  const livePositionDistinct =
    lastTrack == null ||
    Math.abs(lastTrack[0] - lastLat) > 0.01 ||
    Math.abs(lastTrack[1] - lastLon) > 0.01

  // Fit bounds to the full track + current position
  const boundsPoints: [number, number][] = [...positions, planePos]

  return (
    <div className="rounded-lg overflow-hidden border border-gray-800" style={{ height: 280, position: 'relative' }}>
      <MapContainer
        center={planePos}
        zoom={6}
        style={{ height: '100%', width: '100%', background: '#0d1117' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />

        {/* Flown track */}
        {positions.length > 1 && (
          <Polyline positions={positions} color="#22c55e" weight={2} opacity={0.85} />
        )}

        {/* Origin airport label — at first track point */}
        {positions[0] && (
          <Marker position={positions[0]} icon={makeLabel(originCode, '#facc15')} />
        )}

        {/* Plane at current position */}
        <Marker position={planePos} icon={makePlaneIcon(lastHeading)} zIndexOffset={1000} />

        {/* Destination label — only at last track point if plane has moved on (live position) */}
        {livePositionDistinct && lastTrack && (
          <Marker position={lastTrack} icon={makeLabel(destinationCode, '#4ade80')} />
        )}

        <FitBounds points={boundsPoints} />
      </MapContainer>

      {/* Destination overlay — always visible in corner */}
      <div style={{
        position: 'absolute',
        bottom: 8,
        right: 8,
        background: 'rgba(0,0,0,0.7)',
        border: '1px solid rgba(250,204,21,0.4)',
        borderRadius: 4,
        padding: '2px 6px',
        fontSize: 10,
        fontWeight: 700,
        color: '#facc15',
        pointerEvents: 'none',
        zIndex: 1000,
      }}>
        → {destinationCode}
      </div>
    </div>
  )
}
