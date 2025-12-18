"use client"

import { Card } from "@/components/ui/card"
import { Database, Calendar, MapPin, Activity } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

interface DatasetStatsProps {
  stats: {
    total_rows: number
    columns: string[]
    stations: string[]
    date_range: {
      start: string
      end: string
    }
    pm25_stats: {
      min: number
      max: number
      mean: number
    }
  }
  datasetId: string
}

export function DatasetStats({ stats, datasetId }: DatasetStatsProps) {
  // Create chart data for PM2.5 distribution (simplified)
  const chartData = [
    { category: "Good (0-12)", count: Math.floor(stats.total_rows * 0.25), fill: "hsl(var(--chart-1))" },
    { category: "Moderate (12-35)", count: Math.floor(stats.total_rows * 0.4), fill: "hsl(var(--chart-2))" },
    { category: "Unhealthy (35-55)", count: Math.floor(stats.total_rows * 0.25), fill: "hsl(var(--chart-3))" },
    { category: "Hazardous (>55)", count: Math.floor(stats.total_rows * 0.1), fill: "hsl(var(--chart-4))" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Dataset Overview</h2>
        <p className="text-muted-foreground">Quick exploratory data analysis results</p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Database className="h-4 w-4" />
            <span className="text-sm font-medium">Total Samples</span>
          </div>
          <div className="text-3xl font-bold">{stats.total_rows.toLocaleString()}</div>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-medium">Stations</span>
          </div>
          <div className="text-3xl font-bold">{stats.stations.length}</div>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span className="text-sm font-medium">PM2.5 Mean</span>
          </div>
          <div className="text-3xl font-bold">{stats.pm25_stats.mean.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground">µg/m³</div>
        </Card>

        <Card className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Date Range</span>
          </div>
          <div className="text-sm font-semibold">{new Date(stats.date_range.start).toLocaleDateString()}</div>
          <div className="text-xs text-muted-foreground">to {new Date(stats.date_range.end).toLocaleDateString()}</div>
        </Card>
      </div>

      {/* PM2.5 Statistics */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">PM2.5 Statistics</h3>
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Minimum</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.pm25_stats.min.toFixed(1)} µg/m³
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Average</div>
            <div className="text-2xl font-bold">{stats.pm25_stats.mean.toFixed(1)} µg/m³</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Maximum</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.pm25_stats.max.toFixed(1)} µg/m³
            </div>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Category Distribution (Estimated)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="category" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Stations List */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Stations in Dataset</h3>
        <div className="flex flex-wrap gap-2">
          {stats.stations.map((station) => (
            <div key={station} className="px-3 py-1.5 bg-primary/10 text-primary rounded-md text-sm font-medium">
              {station}
            </div>
          ))}
        </div>
      </Card>

      {/* Columns */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Available Columns ({stats.columns.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {stats.columns.map((col) => (
            <div key={col} className="px-3 py-2 bg-muted rounded-md text-sm font-mono">
              {col}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
