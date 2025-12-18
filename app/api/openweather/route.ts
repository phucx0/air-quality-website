import { type NextRequest, NextResponse } from "next/server"

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || ""

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get("lat")
    const lon = searchParams.get("lon")

    if (!lat || !lon) {
      return NextResponse.json(
        { error: "Latitude and longitude required" },
        { status: 400 }
      )
    }

    if (!OPENWEATHER_API_KEY) {
      return NextResponse.json(
        { error: "No OpenWeather API key configured" },
        { status: 500 }
      )
    }

    // 1️⃣ Air pollution
    const airUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`

    // 2️⃣ Weather (temp + humidity)
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`

    const [airRes, weatherRes] = await Promise.all([
      fetch(airUrl),
      fetch(weatherUrl),
    ])

    if (!airRes.ok || !weatherRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch OpenWeather data" },
        { status: 502 }
      )
    }

    const airData = await airRes.json()
    const weatherData = await weatherRes.json()
    console.log(weatherData.main.temp)
    return NextResponse.json({
      air: airData,
      weather: {
        temp: weatherData.main.temp,
        humidity: weatherData.main.humidity,
      },
    })
  } catch (error: any) {
    console.error("OpenWeather API error:", error)
    return NextResponse.json(
      { error: "Unexpected server error", detail: error?.message || error },
      { status: 500 }
    )
  }
}
