import { Card } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, AlertTriangle, Skull } from "lucide-react"
import { cn } from "@/lib/utils"

interface AirQualityResultProps {
  prediction: string
  rules: string[]
  confidence: number
}

const qualityConfig = {
  Good: {
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-900",
    icon: CheckCircle2,
    label: "Tốt",
  },
  Moderate: {
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    borderColor: "border-yellow-200 dark:border-yellow-900",
    icon: AlertCircle,
    label: "Trung bình",
  },
  Unhealthy: {
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/30",
    borderColor: "border-orange-200 dark:border-orange-900",
    icon: AlertTriangle,
    label: "Không tốt cho sức khỏe",
  },
  Hazardous: {
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-900",
    icon: Skull,
    label: "Nguy hiểm",
  },
}

export function AirQualityResult({ prediction, rules, confidence }: AirQualityResultProps) {
  const config = qualityConfig[prediction as keyof typeof qualityConfig] || qualityConfig.Good
  const Icon = config.icon

  return (
    <div className="space-y-6">
      {/* Main Result Card */}
      <Card className={cn("p-8 border-2", config.borderColor, config.bgColor)}>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className={cn("p-3 rounded-full bg-background/50")}>
              <Icon className={cn("h-8 w-8", config.color)} />
            </div>
            <div className="flex-1">
              <div className="text-sm text-muted-foreground mb-1">Chất lượng không khí</div>
              <div className={cn("text-3xl font-bold", config.color)}>{config.label}</div>
            </div>
          </div>

          <div className="pt-4 border-t border-border/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Độ tin cậy</span>
              <span className="font-semibold">{(confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Rules Explanation */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Giải thích quyết định</h3>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Mô hình Decision Tree đã sử dụng các quy tắc sau để đưa ra kết quả:
          </p>
          <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm space-y-1">
            {rules.map((rule, index) => (
              <div key={index} className={cn(rule.startsWith("THEN") && "font-semibold text-primary mt-2")}>
                {rule}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
