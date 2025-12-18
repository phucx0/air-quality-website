import { Card } from "@/components/ui/card"
import { CheckCircle2, AlertCircle, AlertTriangle, Skull } from "lucide-react"
import { cn } from "@/lib/utils"

interface RecommendationCardProps {
  level: string
  color: "green" | "yellow" | "orange" | "red"
  title: string
  recommendations: string[]
}

const colorConfig = {
  green: {
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-900",
    text: "text-green-600 dark:text-green-400",
    icon: CheckCircle2,
  },
  yellow: {
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    border: "border-yellow-200 dark:border-yellow-900",
    text: "text-yellow-600 dark:text-yellow-400",
    icon: AlertCircle,
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-900",
    text: "text-orange-600 dark:text-orange-400",
    icon: AlertTriangle,
  },
  red: {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-900",
    text: "text-red-600 dark:text-red-400",
    icon: Skull,
  },
}

export function RecommendationCard({ color, title, recommendations }: RecommendationCardProps) {
  const config = colorConfig[color]
  const Icon = config.icon

  return (
    <Card className={cn("p-6 border-2", config.border, config.bg)}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-full bg-background/50">
          <Icon className={cn("h-5 w-5", config.text)} />
        </div>
        <h3 className={cn("text-xl font-semibold", config.text)}>{title}</h3>
      </div>

      <ul className="space-y-2">
        {recommendations.map((rec, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <span className={cn("mt-1", config.text)}>•</span>
            <span className="text-foreground">{rec}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
