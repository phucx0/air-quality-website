import { NextResponse } from "next/server"

const WAQI_TOKEN = "981e8c5ec2d74bfe793656885a73af3d2c6eb04c"

// Major Vietnam cities with WAQI station IDs
const VIETNAM_STATIONS = [
  { id: "hanoi", name: "Hanoi", lat: 21.0285, lng: 105.8542 },
  { id: "hochiminh", name: "Ho Chi Minh", lat: 10.8231, lng: 106.6297 },
  { id: "danang", name: "Da Nang", lat: 16.0544, lng: 108.2022 },
  { id: "cantho", name: "Can Tho", lat: 10.0452, lng: 105.7469 },
  { id: "haiphong", name: "Hai Phong", lat: 20.8449, lng: 106.6881 },
  { id: "nhatrang", name: "Nha Trang", lat: 12.2388, lng: 109.1967 },
  { id: "dalat", name: "Da Lat", lat: 11.9404, lng: 108.4583 },
  { id: "vungtau", name: "Vung Tau", lat: 10.3459, lng: 107.0843 },
]

export async function GET() {
  try {
    const stationsData = await Promise.all(
      VIETNAM_STATIONS.map(async (station) => {
        try {
          const response = await fetch(`https://api.waqi.info/feed/${station.id}/?token=${WAQI_TOKEN}`, {
            cache: "no-store",
          })
          const data = await response.json()

          if (data.status === "ok") {
            const aqi = data.data.aqi
            const category =
              aqi <= 50
                ? "Good"
                : aqi <= 100
                  ? "Moderate"
                  : aqi <= 150
                    ? "Unhealthy for Sensitive Groups"
                    : aqi <= 200
                      ? "Unhealthy"
                      : aqi <= 300
                        ? "Very Unhealthy"
                        : "Hazardous"

            return {
              id: station.id,
              name: station.name,
              lat: station.lat,
              lng: station.lng,
              aqi: aqi,
              category: category,
              pm25: data.data.iaqi?.pm25?.v || null,
              pm10: data.data.iaqi?.pm10?.v || null,
              o3: data.data.iaqi?.o3?.v || null,
              no2: data.data.iaqi?.no2?.v || null,
              so2: data.data.iaqi?.so2?.v || null,
              co: data.data.iaqi?.co?.v || null,
              temperature: data.data.iaqi?.t?.v || null,
              humidity: data.data.iaqi?.h?.v || null,
              pressure: data.data.iaqi?.p?.v || null,
              wind: data.data.iaqi?.w?.v || null,
              dominentpol: data.data.dominentpol,
              time: data.data.time?.s,
              forecast: data.data.forecast?.daily || null,
            }
          }
          return null
        } catch (err) {
          console.error(`Error fetching ${station.name}:`, err)
          return null
        }
      }),
    )

    const validStations = stationsData.filter((s) => s !== null)

    return NextResponse.json({ stations: validStations })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
