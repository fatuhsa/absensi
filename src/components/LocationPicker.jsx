import { useEffect, useRef } from 'react'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'

// Explicit custom icon so the marker resolves correctly under Vite bundling
// (L.Icon.Default.mergeOptions with imported URLs rendered as broken "mark" text).
const defaultIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

L.Marker.prototype.options.icon = defaultIcon

// Interactive Leaflet map for picking the geofencing center + radius.
// Props:
//   center   { lat, lng }      initial marker position
//   radius   number (meters)   geofence radius (circle follows this)
//   onChange ({ lat, lng, radius })  fired when marker moves or radius changes
export default function LocationPicker({ center, radius, onChange }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const circleRef = useRef(null)

  // Init map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { zoomControl: true }).setView(
      [center.lat, center.lng],
      16
    )
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    const mk = L.marker([center.lat, center.lng], { draggable: true }).addTo(map)
    const circle = L.circle([center.lat, center.lng], { radius }).addTo(map)

    const emit = (lat, lng) => onChange({ lat, lng, radius })

    mk.on('dragend', () => {
      const p = mk.getLatLng()
      circle.setLatLng(p)
      map.panTo(p)
      emit(p.lat, p.lng)
    })
    map.on('click', (e) => {
      mk.setLatLng(e.latlng)
      circle.setLatLng(e.latlng)
      emit(e.latlng.lat, e.latlng.lng)
    })

    mapRef.current = map
    markerRef.current = mk
    circleRef.current = circle

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
      circleRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep circle radius in sync with the radius input.
  useEffect(() => {
    if (circleRef.current && typeof radius === 'number' && !Number.isNaN(radius)) {
      circleRef.current.setRadius(radius)
    }
  }, [radius])

  // Move marker when center changes from outside (e.g. manual lat/lng input).
  const lat = center?.lat
  const lng = center?.lng
  useEffect(() => {
    if (markerRef.current && !Number.isNaN(lat) && !Number.isNaN(lng)) {
      const p = L.latLng(lat, lng)
      markerRef.current.setLatLng(p)
      circleRef.current?.setLatLng(p)
    }
  }, [lat, lng])

  return <div ref={containerRef} className="loc-picker" />
}
