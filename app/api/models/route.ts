import { NextResponse } from "next/server"

let modelsStore: any[] = []

export async function GET() {
  try {
    // Return all saved models
    return NextResponse.json({ models: modelsStore })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const newModel = {
      ...body,
      model_id: body.model_id || `model_${Date.now()}`,
      uploaded_at: body.uploaded_at || new Date().toISOString(),
      status: body.status || "ready",
    }

    modelsStore.push(newModel)

    return NextResponse.json(newModel)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export function getModelsStore() {
  return modelsStore
}

export function setModelsStore(models: any[]) {
  modelsStore = models
}
