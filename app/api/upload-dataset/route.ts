import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "Only CSV files are accepted" }, { status: 400 })
    }

    // Read file content
    const text = await file.text()
    const lines = text.split("\n")
    const headers = lines[0].split(",").map((h) => h.trim())

    // Validate required columns
    const requiredCols = ["date", "Station_No", "TSP", "PM2.5", "O3", "CO", "NO2", "SO2", "Temperature", "Humidity"]
    const missingCols = requiredCols.filter((col) => !headers.includes(col))

    if (missingCols.length > 0) {
      return NextResponse.json({ error: `Missing required columns: ${missingCols.join(", ")}` }, { status: 400 })
    }

    // Parse data for quick stats
    const rows = lines
      .slice(1)
      .filter((line) => line.trim())
      .map((line) => {
        const values = line.split(",")
        return headers.reduce(
          (obj, header, idx) => {
            obj[header] = values[idx]
            return obj
          },
          {} as Record<string, string>,
        )
      })

    // Calculate basic stats
    const stats = {
      total_rows: rows.length,
      columns: headers,
      stations: [...new Set(rows.map((r) => r.Station_No))],
      date_range: {
        start: rows[0]?.date,
        end: rows[rows.length - 1]?.date,
      },
      pm25_stats: {
        min: Math.min(...rows.map((r) => Number.parseFloat(r["PM2.5"]) || 0)),
        max: Math.max(...rows.map((r) => Number.parseFloat(r["PM2.5"]) || 0)),
        mean: rows.reduce((sum, r) => sum + (Number.parseFloat(r["PM2.5"]) || 0), 0) / rows.length,
      },
    }

    // In production, save to storage (S3, database, etc.)
    // For now, return dataset_id and stats
    const dataset_id = `dataset_${Date.now()}`

    return NextResponse.json({
      dataset_id,
      filename: file.name,
      stats,
      message: "Dataset uploaded successfully",
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: "Failed to process dataset" }, { status: 500 })
  }
}
