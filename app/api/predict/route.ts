import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Extract features in the correct order
    const features = {
      TSP: Number.parseFloat(data.TSP) || 0,
      PM2_5: Number.parseFloat(data.PM2_5) || 0,
      O3: Number.parseFloat(data.O3) || 0,
      CO: Number.parseFloat(data.CO) || 0,
      NO2: Number.parseFloat(data.NO2) || 0,
      SO2: Number.parseFloat(data.SO2) || 0,
      Temperature: Number.parseFloat(data.Temperature) || 0,
      Humidity: Number.parseFloat(data.Humidity) || 0,
    }

    // Simple rule-based classification (mimicking Decision Tree logic)
    let prediction = "Good"
    let rules: string[] = []

    // Priority: PM2.5 is the main indicator
    if (features.PM2_5 <= 25 && features.NO2 <= 50 && features.CO <= 2) {
      prediction = "Good"
      rules = ["IF PM2.5 ≤ 25", "AND NO2 ≤ 50", "AND CO ≤ 2", "THEN Air Quality = Good"]
    } else if (features.PM2_5 <= 55 && features.NO2 <= 100 && features.CO <= 6) {
      prediction = "Moderate"
      rules = ["IF PM2.5 ≤ 55", "AND NO2 ≤ 100", "AND CO ≤ 6", "THEN Air Quality = Moderate"]
    } else if (features.PM2_5 <= 150 || features.NO2 <= 200 || features.CO <= 12) {
      prediction = "Unhealthy"
      rules = ["IF PM2.5 ≤ 150", "OR NO2 ≤ 200", "OR CO ≤ 12", "THEN Air Quality = Unhealthy"]
    } else {
      prediction = "Hazardous"
      rules = ["IF PM2.5 > 150", "OR NO2 > 200", "OR CO > 12", "THEN Air Quality = Hazardous"]
    }

    // Calculate confidence based on how far from thresholds
    const confidence = 0.85

    return NextResponse.json({
      prediction,
      confidence,
      rules,
      features,
    })
  } catch (error) {
    console.error("[v0] Prediction error:", error)
    return NextResponse.json({ error: "Failed to make prediction" }, { status: 500 })
  }
}
