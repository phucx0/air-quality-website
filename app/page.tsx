"use client"
import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Zap,
  Loader2,
  Download,
  Wind,
  Droplets,
  Thermometer,
  Brain,
  ChevronRight,
  Target,
  Heart,
  ShieldAlert,
  Baby,
  PersonStanding,
  Activity,
  Sun,
  History,
  Trash2,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { generateRecommendations } from "@/components/generateRecommendations"
import { MapView } from "@/components/vietnam-map"
import { globalStations, vietnamStations } from "@/lib/map/stations"

interface AirQualityData {
  aqi: number
  pm25: number
  pm10: number
  no2: number
  o3: number
  so2: number
  co: number
  temp?: number
  humidity?: number
  category: string
  color: string
}

interface ModelInfo {
  id: string
  name: string
  type: string
  task: string
  accuracy?: number
  precision?: number
  recall?: number
  f1?: number
  uploadedAt: string
  params?: {
    max_depth: number
    min_samples_leaf: number
  }
}

interface PredictionResult {
  success: boolean
  timestamp: string
  model_id: string
  model_type: string
  prediction: {
    category: string
    confidence: number
    color: string
    level: number
    all_probabilities: Record<string, number>
  }
  decision_path: DecisionNode[]
  rule: string
  features_used: string[]
}

interface DecisionNode {
  id: number
  feature: string
  threshold: number
  direction: "left" | "right"
  samples?: number
}

interface ModelComparison {
  model: string
  accuracy: number
  precision: number
  recall: number
  f1: number
  trainTime: number
}

interface PredictionHistory {
  id: string
  timestamp: string
  location: string
  category: string
  confidence: number
  aqi: number
  pm25: number
  pm10: number
}

export default function HomePage() {
  const mapInstanceRef = useRef<any>(null)
  const [selectedStation, setSelectedStation] = useState<string | null>(null)
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number
    lng: number
    name: string
  } | null>(null)

  // Air quality state
  const [airQualityData, setAirQualityData] = useState<AirQualityData | null>(null)
  const [loadingAirData, setLoadingAirData] = useState(false)

  // Model state
  const [currentModel, setCurrentModel] = useState<ModelInfo | null>(null)
  const [models, setModels] = useState<ModelInfo[]>([])
  const [selectedModelType, setSelectedModelType] = useState("decision_tree")

  // Prediction state
  const [predicting, setPredicting] = useState(false)
  const [prediction, setPrediction] = useState<PredictionResult | null>(null)

  const [predictionHistory, setPredictionHistory] = useState<PredictionHistory[]>([])

  const [activeTab, setActiveTab] = useState("prediction")
  const [userGroup, setUserGroup] = useState<UserGroup>("normal")
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  useEffect(() => {
    if (selectedLocation) {
      fetchAirQuality(selectedLocation.lat, selectedLocation.lng)
    }
  }, [selectedLocation])

  useEffect(() => {
    if (prediction && airQualityData) {
      // Use a stable trend object for now, as specific trend logic is removed
      const trend: AQITrend = {
        direction: "stable",
        change: 0,
        forecast2h: "",
        forecast6h: "",
      }
      const recs = generateRecommendations(
        prediction.prediction.category,
        userGroup,
        trend,
        airQualityData.temp,
        airQualityData.humidity,
      )
      setRecommendations(recs)
    } else if (airQualityData) {
      const trend: AQITrend = {
        direction: "stable",
        change: 0,
        forecast2h: "",
        forecast6h: "",
      }
      const recs = generateRecommendations(
        getAqiCategory(airQualityData.aqi / 50).name, 
        userGroup,
        trend,
        airQualityData.temp,
        airQualityData.humidity,
      )
      setRecommendations(recs)
    }
  }, [prediction, userGroup, airQualityData])

  const fetchAirQuality = async (lat: number, lng: number) => {
    setLoadingAirData(true)
    try {
      const response = await fetch(`/api/openweather?lat=${lat}&lon=${lng}`)
      const data = await response.json()

      const airItem = data.air?.list?.[0]
      if (!airItem) return

      const { components, main } = airItem
      const aqi = main.aqi
      const category = getAqiCategory(aqi)

      setAirQualityData({
        aqi: aqi * 50,
        pm25: components.pm2_5,
        pm10: components.pm10,
        no2: components.no2,
        o3: components.o3,
        so2: components.so2,
        co: components.co,
        temp: data.weather.temp,          
        humidity: data.weather.humidity, 
        category: category.name,
        color: category.color,
      })
    } catch (error) {
      console.error("Error fetching air quality:", error)
    } finally {
      setLoadingAirData(false)
    }
  }

  const getAqiCategory = (aqi: number) => {
    const scaledAqi = aqi * 50
    if (scaledAqi <= 50) return { name: "Tốt", color: "bg-green-500" }
    if (scaledAqi <= 100) return { name: "Trung bình", color: "bg-yellow-500" }
    if (scaledAqi <= 150) return { name: "Không tốt cho nhóm nhạy cảm", color: "bg-orange-500" }
    if (scaledAqi <= 200) return { name: "Không lành mạnh", color: "bg-red-500" }
    return { name: "Nguy hiểm", color: "bg-purple-500" }
  }

  const exportHistoryToCSV = () => {
    if (predictionHistory.length === 0) {
      alert("Không có lịch sử dự đoán để xuất")
      return
    }

    const headers = ["Thời gian", "Địa điểm", "Phân loại", "Độ tin cậy (%)", "AQI", "PM2.5", "PM10"]
    const csvContent = [
      headers.join(","),
      ...predictionHistory.map((entry) =>
        [
          new Date(entry.timestamp).toLocaleString("vi-VN"),
          entry.location,
          entry.category,
          (entry.confidence * 100).toFixed(1),
          entry.aqi,
          entry.pm25,
          entry.pm10,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `lich_su_du_doan_${Date.now()}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const clearHistory = () => {
    if (confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử dự đoán?")) {
      setPredictionHistory([])
    }
  }

  const handlePredict = async () => {
    setPredicting(true)

    if (airQualityData) {
      try {
        const requestBody = {
          model_id: "default", // Use a default or dynamically select model_id if needed
          features: {
            TSP: airQualityData.pm10 * 1.5, // TSP is often approximated by PM10 * 1.5 or similar
            'PM2.5': airQualityData.pm25,
            O3: airQualityData.o3,
            CO: airQualityData.co,
            NO2: airQualityData.no2,
            SO2: airQualityData.so2,
            Temperature: airQualityData.temp,
            Humidity: airQualityData.humidity,
          },
        }

        const response = await fetch("http://localhost:5000/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        })

        const result: PredictionResult = await response.json()

        if (result.success) {
          setPrediction(result)

          // Create a stable trend object without random predictions
          const trend: AQITrend = {
            direction: "stable",
            change: 0,
            forecast2h: "",
            forecast6h: "",
          }
          const recs = generateRecommendations(
            result.prediction.category,
            userGroup,
            trend,
            airQualityData.temp,
            airQualityData.humidity,
          )
          setRecommendations(recs)

          const historyEntry: PredictionHistory = {
            id: Date.now().toString(),
            timestamp: result.timestamp,
            location: selectedLocation?.name || "Unknown Location", // Use selectedLocation name or a default
            category: result.prediction.category,
            confidence: result.prediction.confidence,
            aqi: airQualityData.aqi,
            pm25: airQualityData.pm25,
            pm10: airQualityData.pm10,
          }
          setPredictionHistory((prev) => [historyEntry, ...prev])
        } else {
          console.error("Prediction API returned success: false", result)
          // Handle error display to user if result.success is false
        }
      } catch (error) {
        console.error("Prediction error:", error)
        // Handle network or other errors
      }
    }
    setPredicting(false)
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-xl">
                <Wind className="h-6 w-6 text-white" />
              </div> */}
              <div>
                <h1 className="text-xl font-bold text-white">AirQuality AI</h1>
                <p className="text-xs text-white/70">Decision Tree Machine Learning</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {currentModel && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-xs">
                  <Brain className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">{currentModel.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-white/80">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Data
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Map & Data */}
          <div className="lg:col-span-2 space-y-4">
            {/* Map */}
            <MapView
              selectedStation={selectedStation}
              onStationSelect={setSelectedStation}
              showLegend={false}
            />
            {/* Station List */}
            <div className="mt-4">
              <p className="text-xs text-slate-500 mb-2">Trạm quan trắc ({[...vietnamStations, ...globalStations].length} trạm)</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 max-h-50 overflow-y-auto">
                {[...vietnamStations, ...globalStations].map((station) => (
                  <button
                    key={station.id}
                    onClick={() => {
                      setSelectedStation(station.id)
                      setSelectedLocation({
                        lat: station.lat,
                        lng: station.lng,
                        name: station.name,
                      })
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.setView([station.lat, station.lng], 13, { animate: true })
                      }
                    }}
                    className={`px-2 py-1.5 rounded text-xs font-medium transition-all text-left truncate ${
                      selectedStation === station.id
                        ? "bg-emerald-500/20 border border-emerald-500 text-emerald-400"
                        : "bg-slate-800/50 border border-slate-700 text-slate-300 hover:border-emerald-500/50"
                    }`}
                  >
                    {station.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Air Quality Data Card */}
            {airQualityData && (
              <Card className="bg-slate-900/50 border-slate-800 p-4">
                <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-500" />
                  Dữ liệu chất lượng không khí
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Wind className="h-4 w-4 text-slate-400" />
                      <span className="text-xs text-white">PM2.5</span>
                    </div>
                    <div className="text-lg font-bold text-white">{airQualityData.pm25}</div>
                    <div className="text-xs text-white/70">µg/m³</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Wind className="h-4 w-4 text-slate-400" />
                      <span className="text-xs text-white">PM10</span>
                    </div>
                    <div className="text-lg font-bold text-white">{airQualityData.pm10}</div>
                    <div className="text-xs text-white/70">µg/m³</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Droplets className="h-4 w-4 text-slate-400" />
                      <span className="text-xs text-white">NO₂</span>
                    </div>
                    <div className="text-lg font-bold text-white">{airQualityData.no2}</div>
                    <div className="text-xs text-white/70">µg/m³</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Sun className="h-4 w-4 text-slate-400" />
                      <span className="text-xs text-white">O₃</span>
                    </div>
                    <div className="text-lg font-bold text-white">{airQualityData.o3}</div>
                    <div className="text-xs text-white/70">µg/m³</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-linear-to-r from-slate-800/50 to-slate-900/50 rounded-lg border border-slate-700">
                  <div>
                    <div className="text-sm text-white mb-1">Chỉ số AQI</div>
                    <div className="text-3xl font-bold text-white">{airQualityData.aqi}</div>
                  </div>
                  <div
                    className="px-4 py-2 rounded-full font-medium text-white"
                    style={{ backgroundColor: airQualityData.color }}
                  >
                    {airQualityData.category}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Right Column: Controls & Results */}
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 bg-slate-900/50 border border-slate-800">
                <TabsTrigger value="prediction" className="text-white data-[state=active]:bg-emerald-600">
                  Dự đoán
                </TabsTrigger>
                <TabsTrigger value="history" className="text-white data-[state=active]:bg-emerald-600">
                  Lịch sử
                </TabsTrigger>
              </TabsList>

              <TabsContent value="prediction" className="space-y-4">
                {/* Predict Button */}
                <Card className="bg-slate-900/50 border-slate-800 p-4">
                  <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                    <Brain className="h-5 w-5 text-emerald-500" />
                    Dự đoán AI
                  </h3>

                  <Button
                    onClick={handlePredict}
                    disabled={!airQualityData || predicting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {predicting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang dự đoán...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Chạy dự đoán
                      </>
                    )}
                  </Button>
                </Card>

                {/* Prediction Result */}
                {prediction && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <Card className="bg-slate-900/50 border-slate-800 p-4">
                        <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                          <Target className="h-5 w-5 text-emerald-500" />
                          Kết quả dự đoán
                        </h3>

                        <div className="space-y-3">
                          <div
                            className="p-4 rounded-lg text-center"
                            style={{ backgroundColor: prediction.prediction.color + "20" }}
                          >
                            <div className="text-2xl font-bold mb-1 text-white">{prediction.prediction.category}</div>
                            <div className="text-sm text-white/80">
                              Độ tin cậy: {(prediction.prediction.confidence * 100).toFixed(1)}%
                            </div>
                          </div>

                          <div className="bg-slate-800/30 rounded-lg p-3">
                            <div className="text-xs text-white mb-2">Xác suất các phân loại</div>
                            <div className="space-y-1">
                              {Object.entries(prediction.prediction.all_probabilities).map(([cat, prob]) => (
                                <div key={cat} className="flex items-center gap-2">
                                  <span className="text-xs text-white w-16">{cat}</span>
                                  <div className="flex-1 bg-slate-700 rounded-full h-2">
                                    <div
                                      className="bg-emerald-500 h-2 rounded-full transition-all"
                                      style={{ width: `${(prob as number) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-white">{((prob as number) * 100).toFixed(0)}%</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {prediction.decision_path && prediction.decision_path.length > 0 && (
                            <div className="bg-slate-800/30 rounded-lg p-3">
                              <div className="text-xs text-white mb-2">Đường đi quyết định</div>
                              <div className="space-y-1">
                                {prediction.decision_path.map((node, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-xs">
                                    <ChevronRight className="h-3 w-3 text-emerald-500" />
                                    <span className="text-white">
                                      {node.feature} {node.direction === "left" ? "≤" : ">"} {node.threshold.toFixed(1)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  </AnimatePresence>
                )}

                <Card className="bg-slate-900/50 border-slate-800 p-4">
                  <h3 className="font-semibold mb-4 text-white flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-emerald-500" />
                    Khuyến nghị
                  </h3>

                  {/* User Group Selection */}
                  <div className="space-y-2 mb-4">
                    <Label className="text-slate-300 text-sm">Nhóm người dùng</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { id: "normal", label: "Bình thường", icon: <PersonStanding className="h-4 w-4" /> },
                        { id: "sensitive", label: "Nhạy cảm", icon: <Heart className="h-4 w-4" /> },
                        { id: "children", label: "Trẻ em", icon: <Baby className="h-4 w-4" /> },
                        { id: "elderly", label: "Người già", icon: <PersonStanding className="h-4 w-4" /> },
                        { id: "athlete", label: "Vận động viên", icon: <Activity className="h-4 w-4" /> },
                      ].map((group) => (
                        <Button
                          key={group.id}
                          variant={userGroup === group.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setUserGroup(group.id as UserGroup)}
                          className={`flex flex-col h-auto py-2 ${
                            userGroup === group.id
                              ? "bg-emerald-600 hover:bg-emerald-700"
                              : "border-slate-600 hover:bg-slate-700"
                          }`}
                        >
                          {group.icon}
                          <span className="text-[10px] mt-1">{group.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations List */}
                  {recommendations.length > 0 ? (
                    <div className="space-y-2 max-h-75 overflow-y-auto pr-2">
                      {recommendations.map((rec, index) => (
                        <motion.div
                          key={rec.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-3 rounded-lg border ${
                            rec.priority === "high"
                              ? "bg-red-500/10 border-red-500/30"
                              : rec.priority === "medium"
                                ? "bg-yellow-500/10 border-yellow-500/30"
                                : "bg-slate-700/30 border-slate-600/30"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                rec.priority === "high"
                                  ? "bg-red-500/20 text-red-400"
                                  : rec.priority === "medium"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-slate-600/50 text-slate-300"
                              }`}
                            >
                              {rec.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-medium text-white">{rec.title}</h4>
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                                    rec.priority === "high"
                                      ? "bg-red-500/30 text-red-300"
                                      : rec.priority === "medium"
                                        ? "bg-yellow-500/30 text-yellow-300"
                                        : "bg-slate-600 text-slate-300"
                                  }`}
                                >
                                  {rec.priority === "high"
                                    ? "Quan trọng"
                                    : rec.priority === "medium"
                                      ? "Lưu ý"
                                      : "Gợi ý"}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">{rec.description}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Thực hiện dự đoán để nhận khuyến nghị</p>
                    </div>
                  )}

                  {/* Environmental Conditions Summary */}
                  {airQualityData && (
                    <div className="p-3 bg-slate-800/30 rounded-lg">
                      <div className="text-xs text-slate-400 mb-2">Điều kiện môi trường hiện tại</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-slate-900/50 p-2 rounded flex items-center gap-2">
                          <Thermometer className="h-3 w-3 text-orange-400" />
                          <span className="text-slate-400">Nhiệt độ:</span>
                          <span className="text-white font-mono">{airQualityData.temp?.toFixed(1) || "--"}°C</span>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded flex items-center gap-2">
                          <Droplets className="h-3 w-3 text-blue-400" />
                          <span className="text-slate-400">Độ ẩm:</span>
                          <span className="text-white font-mono">{airQualityData.humidity?.toFixed(0) || "--"}%</span>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded flex items-center gap-2">
                          <Wind className="h-3 w-3 text-cyan-400" />
                          <span className="text-slate-400">AQI:</span>
                          <span className="text-white font-mono">{airQualityData.aqi}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <Card className="bg-slate-900/50 border-slate-800 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <History className="h-5 w-5 text-emerald-500" />
                      Lịch sử dự đoán ({predictionHistory.length})
                    </h3>
                    <div className="flex gap-2">
                      <Button
                        onClick={exportHistoryToCSV}
                        disabled={predictionHistory.length === 0}
                        variant="outline"
                        size="sm"
                        className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Xuất CSV
                      </Button>
                      <Button
                        onClick={clearHistory}
                        disabled={predictionHistory.length === 0}
                        variant="outline"
                        size="sm"
                        className="bg-slate-800/50 border-slate-700 text-white hover:bg-red-900/50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-150 overflow-y-auto">
                    {predictionHistory.length === 0 ? (
                      <div className="text-center py-8 text-white/50">
                        <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Chưa có dự đoán nào</p>
                      </div>
                    ) : (
                      predictionHistory.map((entry) => (
                        <div key={entry.id} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-medium text-white text-sm">{entry.location}</div>
                              <div className="text-xs text-white/60">
                                {new Date(entry.timestamp).toLocaleString("vi-VN")}
                              </div>
                            </div>
                            <div className="px-2 py-1 rounded text-xs font-medium text-white bg-emerald-600">
                              {entry.category}
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            <div>
                              <div className="text-white/60">Tin cậy</div>
                              <div className="font-medium text-white">{(entry.confidence * 100).toFixed(0)}%</div>
                            </div>
                            <div>
                              <div className="text-white/60">AQI</div>
                              <div className="font-medium text-white">{entry.aqi}</div>
                            </div>
                            <div>
                              <div className="text-white/60">PM2.5</div>
                              <div className="font-medium text-white">{entry.pm25}</div>
                            </div>
                            <div>
                              <div className="text-white/60">PM10</div>
                              <div className="font-medium text-white">{entry.pm10}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Map Styles */}
      <style jsx global>{`
        .marker-pin {
          width: 20px;
          height: 20px;
          border-radius: 50% 50% 50% 0;
          background: #14b8a6;
          position: absolute;
          transform: rotate(-45deg);
          left: 50%;
          top: 50%;
          margin: -15px 0 0 -10px;
          border: 3px solid #0d9488;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
          transition: all 0.3s ease;
        }
        
        .marker-pin.active {
          background: #10b981;
          border-color: #34d399;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.8);
          width: 24px;
          height: 24px;
        }
        
        .marker-inner {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(45deg);
        }
        
        .custom-marker {
          background: transparent;
          border: none;
        }
        
        .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95);
          color: #5eead4;
          border: 1px solid #14b8a6;
          border-radius: 8px;
        }
        
        .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95);
        }
      `}</style>
    </div>
  )
}