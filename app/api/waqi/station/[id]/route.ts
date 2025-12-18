import { NextResponse } from "next/server"

const WAQI_TOKEN = "981e8c5ec2d74bfe793656885a73af3d2c6eb04c"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const response = await fetch(`https://api.waqi.info/feed/${id}/?token=${WAQI_TOKEN}`, { cache: "no-store" })

    const data = await response.json()

    if (data.status !== "ok") {
      throw new Error("Station not found")
    }

    return NextResponse.json({ data: data.data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
