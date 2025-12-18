import { type NextRequest, NextResponse } from "next/server"

const modelsStore: any[] = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dataset_id, task, target, features, params, horizon, model_name } = body

    // Validate request
    if (!dataset_id || !task || !model_name) {
      return NextResponse.json({ error: "Missing required fields: dataset_id, task, and model_name" }, { status: 400 })
    }

    // In production:
    // 1. Validate dataset_id exists
    // 2. Create training job with these parameters
    // 3. Run Python training script
    // 4. Save model to storage
    // 5. Add model to models store

    const job_id = `job_${Date.now()}`

    const modelData = {
      model_id: `model_${Date.now()}`,
      filename: `${model_name}.pkl`,
      model_type: task === "classification" ? "DecisionTreeClassifier" : "DecisionTreeRegressor",
      task: task,
      params: params || { max_depth: 10, min_samples_leaf: 20 },
      horizon: task === "forecasting" ? horizon || 1 : null,
      status: "ready",
      uploaded_at: new Date().toISOString(),
      trained_from_dataset: dataset_id,
    }

    // Save to models store
    modelsStore.push(modelData)

    // Job info
    const jobInfo = {
      job_id,
      model_name,
      dataset_id,
      task,
      target: target || (task === "classification" ? "category" : "PM2.5"),
      features: features || ["TSP", "PM2.5", "O3", "CO", "NO2", "SO2", "Temperature", "Humidity"],
      params: params || { max_depth: 10, min_samples_leaf: 20 },
      horizon: task === "forecasting" ? horizon || 1 : null,
      status: "completed",
      created_at: new Date().toISOString(),
      model_id: modelData.model_id,
    }

    console.log("[v0] Training completed and model saved:", modelData)

    return NextResponse.json({
      ...jobInfo,
      message: "Training completed successfully. Model saved.",
    })
  } catch (error) {
    console.error("[v0] Training job error:", error)
    return NextResponse.json({ error: "Failed to create training job" }, { status: 500 })
  }
}

export function getModelsStore() {
  return modelsStore
}
