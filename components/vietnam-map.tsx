"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, Locate, Search } from "lucide-react"
import { motion } from "framer-motion"

interface VietnamMapProps {
  selectedRegion: string
  selectedStation: string
  onRegionSelect: (region: string) => void
  onStationSelect: (station: string) => void
  onLocationSelect?: (lat: number, lng: number, name: string) => void
}

interface Station {
  id: string
  name: string
  lat: number
  lng: number
  region: string
}

const vietnamStations: Station[] = [
  // Northern Vietnam
  { id: "HN-01", name: "Hanoi - Hoan Kiem", lat: 21.0285, lng: 105.8542, region: "north" },
  { id: "HN-02", name: "Hanoi - Cau Giay", lat: 21.0333, lng: 105.7942, region: "north" },
  { id: "HN-03", name: "Haiphong - Hong Bang", lat: 20.8449, lng: 106.6881, region: "north" },
  { id: "HP-01", name: "Hai Phong Port", lat: 20.8659, lng: 106.683, region: "north" },

  // Central Vietnam
  { id: "DN-01", name: "Da Nang - Hai Chau", lat: 16.0544, lng: 108.2022, region: "central" },
  { id: "DN-02", name: "Da Nang - Son Tra", lat: 16.0839, lng: 108.238, region: "central" },
  { id: "HU-01", name: "Hue City Center", lat: 16.4637, lng: 107.5909, region: "central" },

  // Southern Vietnam
  { id: "HCM-01", name: "Ho Chi Minh - District 1", lat: 10.7769, lng: 106.7009, region: "south" },
  { id: "HCM-02", name: "Ho Chi Minh - District 3", lat: 10.7845, lng: 106.6889, region: "south" },
  { id: "HCM-03", name: "Ho Chi Minh - Tan Binh", lat: 10.8006, lng: 106.653, region: "south" },
  { id: "VT-01", name: "Vung Tau City", lat: 10.3459, lng: 107.0843, region: "south" },
]

export function VietnamMap({
  selectedRegion,
  selectedStation,
  onRegionSelect,
  onStationSelect,
  onLocationSelect,
}: VietnamMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isMapReady, setIsMapReady] = useState(false)

  useEffect(() => {
    // Dynamically load Leaflet CSS and JS
    const loadLeaflet = async () => {
      if (typeof window === "undefined") return

      // Load CSS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        link.crossOrigin = ""
        document.head.appendChild(link)
      }

      // Load JS
      if (!(window as any).L) {
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        script.crossOrigin = ""
        document.head.appendChild(script)

        await new Promise((resolve) => {
          script.onload = resolve
        })
      }

      return (window as any).L
    }

    const initMap = async () => {
      const L = await loadLeaflet()
      if (!L || !mapRef.current || mapInstanceRef.current) return

      // Initialize map centered on Vietnam
      const map = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([16.0, 106.0], 6)

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map

      // Add markers for all stations
      vietnamStations.forEach((station) => {
        const marker = L.marker([station.lat, station.lng], {
          icon: L.divIcon({
            className: "custom-marker",
            html: `<div class="marker-pin ${selectedStation === station.id ? "active" : ""}">
                    <div class="marker-inner"></div>
                   </div>`,
            iconSize: [30, 42],
            iconAnchor: [15, 42],
          }),
        })
          .addTo(map)
          .bindPopup(`<b>${station.name}</b><br>Station ID: ${station.id}`)
          .on("click", () => {
            onStationSelect(station.id)
            onRegionSelect(station.region)
            if (onLocationSelect) {
              onLocationSelect(station.lat, station.lng, station.name)
            }
            console.log("[v0] Station selected:", station.name, station.lat, station.lng)
          })

        markersRef.current.push({ id: station.id, marker })
      })

      // Add click handler for custom locations
      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng
        if (onLocationSelect) {
          onLocationSelect(lat, lng, `Custom Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`)
        }
        console.log("[v0] Custom location selected:", lat, lng)
      })

      setIsMapReady(true)
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update marker styles when selection changes
  useEffect(() => {
    if (!isMapReady) return

    markersRef.current.forEach(({ id, marker }) => {
      const isActive = id === selectedStation
      const iconHtml = `<div class="marker-pin ${isActive ? "active" : ""}">
                         <div class="marker-inner"></div>
                        </div>`

      marker.setIcon(
        (window as any).L.divIcon({
          className: "custom-marker",
          html: iconHtml,
          iconSize: [30, 42],
          iconAnchor: [15, 42],
        }),
      )
    })

    // Pan to selected station
    if (selectedStation && mapInstanceRef.current) {
      const station = vietnamStations.find((s) => s.id === selectedStation)
      if (station) {
        mapInstanceRef.current.setView([station.lat, station.lng], 12, { animate: true })
      }
    }
  }, [selectedStation, isMapReady])

  const handleSearch = () => {
    if (!searchQuery || !mapInstanceRef.current) return

    const query = searchQuery.toLowerCase()
    const station = vietnamStations.find(
      (s) => s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query),
    )

    if (station) {
      mapInstanceRef.current.setView([station.lat, station.lng], 13, { animate: true })
      onStationSelect(station.id)
      onRegionSelect(station.region)
      if (onLocationSelect) {
        onLocationSelect(station.lat, station.lng, station.name)
      }
    }
  }

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([latitude, longitude], 13, { animate: true })
          }
          if (onLocationSelect) {
            onLocationSelect(latitude, longitude, "Current Location")
          }
          console.log("[v0] Current location:", latitude, longitude)
        },
        (error) => {
          console.error("[v0] Geolocation error:", error)
        },
      )
    }
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search station..."
            className="w-full bg-slate-800/50 border border-teal-500/30 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-emerald-400 pr-9"
          />
          <button
            onClick={handleSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-teal-400 hover:text-emerald-400 transition-colors"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCurrentLocation}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 p-2 rounded"
          title="Use current location"
        >
          <Locate className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Map Container */}
      <div className="relative rounded-lg overflow-hidden border-2 border-teal-500/30 bg-slate-900/50">
        <div ref={mapRef} className="w-full h-96" />

        {!isMapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
            <div className="text-center">
              <motion.div
                className="h-8 w-8 border-4 border-emerald-400 border-t-transparent rounded-full mx-auto mb-3"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              />
              <p className="text-sm font-mono text-teal-300">Loading map...</p>
            </div>
          </div>
        )}
      </div>

      {/* Station List */}
      <div className="space-y-2">
        <p className="text-xs font-mono text-teal-300/70">Available Monitoring Stations</p>
        <div className="max-h-48 overflow-y-auto space-y-1">
          {vietnamStations.map((station) => (
            <motion.button
              key={station.id}
              whileHover={{ x: 4 }}
              onClick={() => {
                onStationSelect(station.id)
                onRegionSelect(station.region)
                if (onLocationSelect) {
                  onLocationSelect(station.lat, station.lng, station.name)
                }
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.setView([station.lat, station.lng], 13, { animate: true })
                }
              }}
              className={`w-full p-2 rounded border text-xs font-mono transition-all flex items-center justify-between ${
                selectedStation === station.id
                  ? "bg-teal-500/20 border-teal-400 text-teal-200"
                  : "bg-slate-800/20 border-teal-500/10 text-teal-400 hover:border-teal-400"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${selectedStation === station.id ? "bg-teal-400" : "bg-teal-600"}`}
                />
                <span>{station.name}</span>
              </div>
              <MapPin className="h-3 w-3" />
            </motion.button>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .marker-pin {
          width: 20px;
          height: 20px;
          border-radius: 50% 50% 50% 0;
          background: #14b8a6;
          position: absolute;
          transform: rotate(-45deg);
          left: 50%;
          top: 50%;
          margin: -15px 0 0 -10px;
          border: 3px solid #0d9488;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
          transition: all 0.3s ease;
        }
        
        .marker-pin.active {
          background: #10b981;
          border-color: #34d399;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.8);
          width: 24px;
          height: 24px;
        }
        
        .marker-pin::after {
          content: '';
          width: 10px;
          height: 10px;
          margin: 5px 0 0 5px;
          background: #fff;
          position: absolute;
          border-radius: 50%;
        }
        
        .marker-inner {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
        }
        
        .custom-marker {
          background: transparent;
          border: none;
        }
        
        .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95);
          color: #5eead4;
          border: 1px solid #14b8a6;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
        }
        
        .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95);
        }
      `}</style>
    </div>
  )
}
