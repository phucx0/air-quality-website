import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const modelId = params.id

    // In a real app, retrieve the model file from storage
    // For now, simulate the download
    const modelData = JSON.stringify({
      model_id: modelId,
      type: "decision_tree",
      message: "This is a placeholder for the actual .pkl model file",
    })

    return new NextResponse(modelData, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="model_${modelId}.pkl"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Download failed" }, { status: 500 })
  }
}
