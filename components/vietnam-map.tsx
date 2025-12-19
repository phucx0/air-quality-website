import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Search, Locate } from "lucide-react"
import { globalStations, vietnamStations } from "@/lib/map/stations"

interface Station {
  id: string
  name: string
  lat: number
  lng: number
  region?: string
  country?: string
  pollution?: string
}

interface MapViewProps {
  selectedStation: string | null
  onStationSelect: (stationId: string | null, location: { lat: number; lng: number; name: string }) => void
  mapInstanceRef?: React.MutableRefObject<any>
  title?: string
  showLegend?: boolean
  initialCenter?: [number, number]
  initialZoom?: number
}


export function MapView({ 
  selectedStation, 
  onStationSelect,
  title = "Bản đồ Việt Nam - OpenStreetMap",
  showLegend = true,
  initialCenter = [16.0, 106.0],
  initialZoom = 6
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [isMapReady, setIsMapReady] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const stations : Station[] = [
    ...vietnamStations,
    ...globalStations
  ]
  const customMarkerRef = useRef<any>(null)
  // Load Leaflet
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === "undefined") return

      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        link.crossOrigin = ""
        document.head.appendChild(link)
      }

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

      const map = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([16.0, 106.0], 6)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map

      stations.forEach((station) => {
        const marker = L.marker([station.lat, station.lng], {
          icon: L.divIcon({
            className: "custom-marker",
            html: `<div class="marker-pin"><div class="marker-inner"></div></div>`,
            iconSize: [30, 42],
            iconAnchor: [15, 42],
          }),
        })
          .addTo(map)
          .bindPopup(`<b>${station.name}</b><br>Station ID: ${station.id}`)
          .on("click", () => {
            onStationSelect(station.id, {
              lat: station.lat,
              lng: station.lng,
              name: station.name,
            })
          })
        markersRef.current.push({ id: station.id, marker })
      })

      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng
        onStationSelect(null, {
          lat,
          lng,
          name: `Vị trí tùy chọn (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        })
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
  }, [selectedStation])


  // Update markers when selection changes
  useEffect(() => {
    if (!isMapReady) return

    markersRef.current.forEach(({ id, marker }) => {
      const isActive = id === selectedStation
      marker.setIcon(
        (window as any).L.divIcon({
          className: "custom-marker",
          html: `<div class="marker-pin ${isActive ? "active" : ""}"><div class="marker-inner"></div></div>`,
          iconSize: [30, 42],
          iconAnchor: [15, 42],
        }),
      )
    })

    if (selectedStation && mapInstanceRef.current) {
      const station = stations.find((s) => s.id === selectedStation)
      if (station) {
        mapInstanceRef.current.setView([station.lat, station.lng], 12, { animate: true })
      }
    }
  }, [selectedStation, isMapReady])

  // Expose method to focus on location (can be called from parent)
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return
    
    // This ensures the map focuses when a station is selected externally
    if (selectedStation) {
      const station = stations.find((s) => s.id === selectedStation)
      if (station) {
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([station.lat, station.lng], 13, { animate: true })
          }
        }, 100)
      }
    }
  }, [selectedStation, isMapReady, stations])

  const handleSearch = () => {
    if (!searchQuery || !mapInstanceRef.current) return
    const query = searchQuery.toLowerCase()
    const station = stations.find(
      (s) => s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query),
    )
    if (station) {
      mapInstanceRef.current.setView([station.lat, station.lng], 13, { animate: true })
      onStationSelect(station.id, {
        lat: station.lat,
        lng: station.lng,
        name: station.name,
      })
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
          
          // Remove previous custom marker if exists
          if (customMarkerRef.current) {
            customMarkerRef.current.remove()
          }
          
          // Create marker for current location with direction arrow
          const L = (window as any).L
          const customMarker = L.marker([latitude, longitude], {
            icon: L.divIcon({
              className: "current-location-marker",
              html: `
                <div class="current-location-pin">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="8" fill="#3b82f6" opacity="0.3"/>
                    <circle cx="12" cy="12" r="4" fill="#3b82f6"/>
                    <path d="M12 2L14 8L12 6L10 8L12 2Z" fill="#3b82f6"/>
                  </svg>
                  <div class="location-pulse"></div>
                </div>
              `,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            }),
          }).addTo(mapInstanceRef.current)
          
          customMarkerRef.current = customMarker
          
          onStationSelect(null, {
            lat: latitude,
            lng: longitude,
            name: "Vị trí hiện tại",
          })
        },
        (error) => console.error("Geolocation error:", error),
      )
    }
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <MapPin className="h-5 w-5 text-emerald-500" />
          {title}
        </h2>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Tìm trạm quan trắc..."
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 pr-10"
          />
          <button
            onClick={handleSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
        <Button
          onClick={handleCurrentLocation}
          variant="outline"
          className="bg-slate-800/50 border-slate-700 hover:bg-slate-700 hover:border-emerald-500 text-white"
        >
          <Locate className="h-4 w-4" />
        </Button>
      </div>

      {/* Map Container */}
      <div ref={mapRef} className="h-96 rounded-lg overflow-hidden border border-slate-800" />

      {/* Legend */}
      {showLegend && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-white">Tốt</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <span className="text-white">Trung bình</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-orange-500" />
            <span className="text-white">Kém</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-white">Xấu</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-purple-500" />
            <span className="text-white">Rất xấu</span>
          </div>
        </div>
      )}

      {/* Map Styles */}
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
        }
        
        .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95);
        }
      `}</style>
    </Card>
  )
}