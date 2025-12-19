interface Recommendation {
    id: string
    title: string
    description: string
    icon: React.ReactNode
    priority: "high" | "medium" | "low"
    category: "health" | "outdoor" | "protection" | "home" | "transport"
}

type UserGroup = "normal" | "sensitive" | "children" | "elderly" | "athlete"

interface AQITrend {
    direction: "increasing" | "decreasing" | "stable"
    change: number
    forecast2h: string
    forecast6h: string
}