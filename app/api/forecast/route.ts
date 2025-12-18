import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const station = searchParams.get("station")
    const horizon = searchParams.get("horizon") || "1h"

    if (!station) {
      return NextResponse.json({ error: "Missing station parameter" }, { status: 400 })
    }

    // In production:
    // 1. Load forecast model for specified horizon
    // 2. Get latest data for station
    // 3. Create features (lags, rolling, time features)
    // 4. Run prediction
    // 5. Return forecast with confidence/prediction interval

    // Mock forecast response
    const horizonMap: Record<string, number> = { "1h": 1, "6h": 6, "24h": 24 }
    const hours = horizonMap[horizon] || 1

    const forecast = {
      station,
      horizon,
      forecast_time: new Date(Date.now() + hours * 3600000).toISOString(),
      predictions: {
        pm25: 35.5 + Math.random() * 20,
        category: "Moderate",
        confidence: 0.85,
      },
      features_used: ["PM2.5_lag_1", "PM2.5_rolling_mean_6", "hour", "Temperature"],
      model_version: "forecast_1h_v1",
      generated_at: new Date().toISOString(),
    }

    return NextResponse.json(forecast)
  } catch (error) {
    console.error("[v0] Forecast error:", error)
    return NextResponse.json({ error: "Failed to generate forecast" }, { status: 500 })
  }
}
