import { NextResponse } from "next/server"

let modelsStore: any[] = []

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Find model by ID
    const model = modelsStore.find((m) => m.model_id === id)

    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 })
    }

    return NextResponse.json({ model })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const index = modelsStore.findIndex((m) => m.model_id === id)

    if (index === -1) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 })
    }

    modelsStore.splice(index, 1)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export function setModelsStoreRef(store: any[]) {
  modelsStore = store
}
