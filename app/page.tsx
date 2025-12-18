"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Zap,
  Loader2,
  Download,
  MapPin,
  Wind,
  Droplets,
  Thermometer,
  Brain,
  Search,
  Locate,
  TrendingUp,
  ChevronRight,
  Target,
  Heart,
  ShieldAlert,
  Baby,
  PersonStanding,
  Clock,
  TrendingDown,
  Home,
  Shirt,
  Car,
  Activity,
  Sun,
  CloudRain,
  History,
  Trash2,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"


const globalStations = [
  // Ô nhiễm nặng
  { id: "CN-BJ", name: "Beijing, China", lat: 39.9042, lng: 116.4074, country: "China", pollution: "high" },
  { id: "IN-DL", name: "Delhi, India", lat: 28.6139, lng: 77.2090, country: "India", pollution: "high" },
  { id: "PK-LH", name: "Lahore, Pakistan", lat: 31.5497, lng: 74.3436, country: "Pakistan", pollution: "high" },
  { id: "BD-DH", name: "Dhaka, Bangladesh", lat: 23.8103, lng: 90.4125, country: "Bangladesh", pollution: "high" },
  { id: "IR-TH", name: "Tehran, Iran", lat: 35.6892, lng: 51.3890, country: "Iran", pollution: "high" },

  // Ô nhiễm nhẹ / sạch
  { id: "NZ-AK", name: "Auckland, New Zealand", lat: -36.8485, lng: 174.7633, country: "New Zealand", pollution: "low" },
  { id: "CA-VAN", name: "Vancouver, Canada", lat: 49.2827, lng: -123.1207, country: "Canada", pollution: "low" },
  { id: "FI-HL", name: "Helsinki, Finland", lat: 60.1699, lng: 24.9384, country: "Finland", pollution: "low" },
  { id: "IS-RE", name: "Reykjavik, Iceland", lat: 64.1355, lng: -21.8954, country: "Iceland", pollution: "low" },
  { id: "AU-CL", name: "Canberra, Australia", lat: -35.2809, lng: 149.1300, country: "Australia", pollution: "low" }
];


// Vietnam monitoring stations
const vietnamStations = [
  { id: "HN-01", name: "Hà Nội - Hoàn Kiếm", lat: 21.0285, lng: 105.8542, region: "north" },
  { id: "HN-02", name: "Hà Nội - Cầu Giấy", lat: 21.0333, lng: 105.7942, region: "north" },
  { id: "HN-03", name: "Hà Nội - Long Biên", lat: 21.0479, lng: 105.8925, region: "north" },
  { id: "HP-01", name: "Hải Phòng", lat: 20.8449, lng: 106.6881, region: "north" },
  { id: "QN-01", name: "Quảng Ninh - Hạ Long", lat: 20.9513, lng: 107.0804, region: "north" },
  { id: "BG-01", name: "Bắc Giang", lat: 21.281, lng: 106.197, region: "north" },
  { id: "BN-01", name: "Bắc Ninh", lat: 21.1861, lng: 106.0763, region: "north" },
  { id: "TB-01", name: "Thái Bình", lat: 20.4463, lng: 106.3366, region: "north" },
  { id: "ND-01", name: "Nam Định", lat: 20.4388, lng: 106.1621, region: "north" },
  { id: "LC-01", name: "Lào Cai", lat: 22.4856, lng: 103.9707, region: "north" },

  // ===== MIỀN TRUNG =====
  { id: "TH-01", name: "Thanh Hóa", lat: 19.8075, lng: 105.7764, region: "central" },
  { id: "NA-01", name: "Vinh - Nghệ An", lat: 18.6796, lng: 105.6813, region: "central" },
  { id: "HT-01", name: "Hà Tĩnh", lat: 18.3559, lng: 105.8877, region: "central" },
  { id: "QB-01", name: "Đồng Hới - Quảng Bình", lat: 17.4689, lng: 106.6223, region: "central" },
  { id: "HU-01", name: "Huế", lat: 16.4637, lng: 107.5909, region: "central" },
  { id: "DN-01", name: "Đà Nẵng - Hải Châu", lat: 16.0544, lng: 108.2022, region: "central" },
  { id: "QN-02", name: "Quảng Nam - Tam Kỳ", lat: 15.5736, lng: 108.474, region: "central" },
  { id: "QN-03", name: "Quảng Ngãi", lat: 15.12, lng: 108.7923, region: "central" },
  { id: "BD-01", name: "Bình Định - Quy Nhơn", lat: 13.7829, lng: 109.219, region: "central" },
  { id: "KH-01", name: "Nha Trang - Khánh Hòa", lat: 12.2388, lng: 109.1967, region: "central" },

  // ===== MIỀN NAM =====
  { id: "HCM-01", name: "TP.HCM - Quận 1", lat: 10.7769, lng: 106.7009, region: "south" },
  { id: "HCM-02", name: "TP.HCM - Quận 3", lat: 10.7845, lng: 106.6889, region: "south" },
  { id: "HCM-03", name: "TP.HCM - Tân Bình", lat: 10.8006, lng: 106.653, region: "south" },
  { id: "BD-02", name: "Bình Dương - Thủ Dầu Một", lat: 10.9804, lng: 106.6519, region: "south" },
  { id: "DNA-01", name: "Biên Hòa - Đồng Nai", lat: 10.9447, lng: 106.8243, region: "south" },
  { id: "VT-01", name: "Vũng Tàu", lat: 10.3459, lng: 107.0843, region: "south" },
  { id: "LA-01", name: "Tân An - Long An", lat: 10.535, lng: 106.413, region: "south" },
  { id: "CT-01", name: "Cần Thơ", lat: 10.0452, lng: 105.7469, region: "south" },
  { id: "AG-01", name: "Long Xuyên - An Giang", lat: 10.3864, lng: 105.4352, region: "south" },
  { id: "KG-01", name: "Rạch Giá - Kiên Giang", lat: 10.0124, lng: 105.0809, region: "south" },
  { id: "CM-01", name: "Cà Mau", lat: 9.1769, lng: 105.1524, region: "south" },
]

// Feature definitions for ML
const allFeatures = [
  { id: "pm25", name: "PM2.5", unit: "µg/m³", importance: 0.35, category: "pollutant" },
  { id: "pm10", name: "PM10", unit: "µg/m³", importance: 0.15, category: "pollutant" },
  { id: "no2", name: "NO₂", unit: "µg/m³", importance: 0.12, category: "pollutant" },
  { id: "o3", name: "O₃", unit: "µg/m³", importance: 0.1, category: "pollutant" },
  { id: "so2", name: "SO₂", unit: "µg/m³", importance: 0.08, category: "pollutant" },
  { id: "co", name: "CO", unit: "µg/m³", importance: 0.05, category: "pollutant" },
  { id: "temp", name: "Nhiệt độ", unit: "°C", importance: 0.08, category: "weather" },
  { id: "humidity", name: "Độ ẩm", unit: "%", importance: 0.05, category: "weather" },
  { id: "hour", name: "Giờ trong ngày", unit: "h", importance: 0.02, category: "time" },
]

// Model types for comparison
const modelTypes = [
  { id: "decision_tree", name: "Decision Tree", color: "emerald" },
  { id: "random_forest", name: "Random Forest", color: "blue" },
  { id: "xgboost", name: "XGBoost", color: "purple" },
]

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

type UserGroup = "normal" | "sensitive" | "children" | "elderly" | "athlete"

interface Recommendation {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  priority: "high" | "medium" | "low"
  category: "health" | "outdoor" | "protection" | "home" | "transport"
}

interface AQITrend {
  direction: "increasing" | "decreasing" | "stable"
  change: number
  forecast2h: string
  forecast6h: string
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

const generateRecommendations = (
  category: string,
  userGroup: UserGroup,
  trend: AQITrend,
  temp?: number,
  humidity?: number,
  windSpeed?: number,
): Recommendation[] => {
  const recommendations: Recommendation[] = []

  // Base recommendations by AQI category
  const baseRecommendations: Record<string, Record<UserGroup, Recommendation[]>> = {
    Tốt: {
      normal: [
        {
          id: "1",
          title: "Hoạt động ngoài trời thoải mái",
          description: "Chất lượng không khí tốt, phù hợp cho mọi hoạt động ngoài trời",
          icon: <Activity className="h-4 w-4" />,
          priority: "low",
          category: "outdoor",
        },
        {
          id: "2",
          title: "Mở cửa sổ thông gió",
          description: "Tận dụng không khí trong lành để thông gió nhà",
          icon: <Home className="h-4 w-4" />,
          priority: "low",
          category: "home",
        },
      ],
      sensitive: [
        {
          id: "1",
          title: "Có thể hoạt động ngoài trời",
          description: "Chất lượng không khí tốt, an toàn cho người nhạy cảm",
          icon: <Activity className="h-4 w-4" />,
          priority: "low",
          category: "outdoor",
        },
        {
          id: "2",
          title: "Theo dõi cơ thể",
          description: "Dù không khí tốt, vẫn nên chú ý các triệu chứng",
          icon: <Heart className="h-4 w-4" />,
          priority: "low",
          category: "health",
        },
      ],
      children: [
        {
          id: "1",
          title: "Cho trẻ chơi ngoài trời",
          description: "Thời điểm tốt để trẻ vận động và vui chơi",
          icon: <Baby className="h-4 w-4" />,
          priority: "low",
          category: "outdoor",
        },
      ],
      elderly: [
        {
          id: "1",
          title: "Đi dạo buổi sáng",
          description: "Không khí trong lành, phù hợp tập thể dục nhẹ",
          icon: <PersonStanding className="h-4 w-4" />,
          priority: "low",
          category: "outdoor",
        },
      ],
      athlete: [
        {
          id: "1",
          title: "Tập luyện cường độ cao",
          description: "Điều kiện lý tưởng cho tập luyện ngoài trời",
          icon: <Activity className="h-4 w-4" />,
          priority: "low",
          category: "outdoor",
        },
      ],
    },
    "Trung bình": {
      normal: [
        {
          id: "1",
          title: "Hoạt động ngoài trời bình thường",
          description: "Có thể hoạt động ngoài trời, theo dõi chất lượng không khí",
          icon: <Activity className="h-4 w-4" />,
          priority: "low",
          category: "outdoor",
        },
        {
          id: "2",
          title: "Theo dõi AQI",
          description: "Kiểm tra AQI định kỳ trong ngày",
          icon: <Target className="h-4 w-4" />,
          priority: "medium",
          category: "health",
        },
      ],
      sensitive: [
        {
          id: "1",
          title: "Hạn chế hoạt động ngoài trời",
          description: "Giảm thời gian và cường độ hoạt động ngoài trời",
          icon: <ShieldAlert className="h-4 w-4" />,
          priority: "medium",
          category: "outdoor",
        },
        {
          id: "2",
          title: "Đeo khẩu trang khi ra ngoài",
          description: "Sử dụng khẩu trang N95 hoặc tương đương",
          icon: <Shirt className="h-4 w-4" />,
          priority: "medium",
          category: "protection",
        },
        {
          id: "3",
          title: "Mang theo thuốc",
          description: "Người có bệnh hô hấp nên mang theo thuốc",
          icon: <Heart className="h-4 w-4" />,
          priority: "high",
          category: "health",
        },
      ],
      children: [
        {
          id: "1",
          title: "Giới hạn thời gian chơi",
          description: "Cho trẻ chơi trong nhà nhiều hơn",
          icon: <Baby className="h-4 w-4" />,
          priority: "medium",
          category: "outdoor",
        },
        {
          id: "2",
          title: "Tránh giờ cao điểm",
          description: "Không cho trẻ ra ngoài vào giờ giao thông đông",
          icon: <Clock className="h-4 w-4" />,
          priority: "medium",
          category: "outdoor",
        },
      ],
      elderly: [
        {
          id: "1",
          title: "Hạn chế ra ngoài",
          description: "Ở nhà nhiều hơn, tránh hoạt động gắng sức",
          icon: <Home className="h-4 w-4" />,
          priority: "medium",
          category: "outdoor",
        },
        {
          id: "2",
          title: "Uống nhiều nước",
          description: "Giữ cơ thể đủ nước, đặc biệt khi trời nóng",
          icon: <Droplets className="h-4 w-4" />,
          priority: "medium",
          category: "health",
        },
      ],
      athlete: [
        {
          id: "1",
          title: "Tập luyện cường độ vừa",
          description: "Giảm cường độ tập luyện ngoài trời",
          icon: <Activity className="h-4 w-4" />,
          priority: "medium",
          category: "outdoor",
        },
        {
          id: "2",
          title: "Chọn thời điểm tập",
          description: "Tập vào sáng sớm hoặc tối khi AQI thấp hơn",
          icon: <Clock className="h-4 w-4" />,
          priority: "medium",
          category: "outdoor",
        },
      ],
    },
    Kém: {
      normal: [
        {
          id: "1",
          title: "Hạn chế ra ngoài",
          description: "Giảm các hoạt động ngoài trời không cần thiết",
          icon: <ShieldAlert className="h-4 w-4" />,
          priority: "medium",
          category: "outdoor",
        },
        {
          id: "2",
          title: "Đeo khẩu trang",
          description: "Sử dụng khẩu trang khi phải ra ngoài",
          icon: <Shirt className="h-4 w-4" />,
          priority: "medium",
          category: "protection",
        },
        {
          id: "3",
          title: "Đóng cửa sổ",
          description: "Giữ không khí trong nhà sạch hơn",
          icon: <Home className="h-4 w-4" />,
          priority: "medium",
          category: "home",
        },
      ],
      sensitive: [
        {
          id: "1",
          title: "Ở nhà",
          description: "Tránh ra ngoài, đóng cửa sổ và cửa ra vào",
          icon: <Home className="h-4 w-4" />,
          priority: "high",
          category: "outdoor",
        },
        {
          id: "2",
          title: "Bật máy lọc không khí",
          description: "Sử dụng máy lọc không khí nếu có",
          icon: <Wind className="h-4 w-4" />,
          priority: "high",
          category: "home",
        },
        {
          id: "3",
          title: "Theo dõi triệu chứng",
          description: "Chú ý ho, khó thở, đau ngực",
          icon: <Heart className="h-4 w-4" />,
          priority: "high",
          category: "health",
        },
        {
          id: "4",
          title: "Sẵn sàng thuốc cấp cứu",
          description: "Để thuốc hen suyễn, tim mạch trong tầm tay",
          icon: <ShieldAlert className="h-4 w-4" />,
          priority: "high",
          category: "health",
        },
      ],
      children: [
        {
          id: "1",
          title: "Cho trẻ ở trong nhà",
          description: "Không cho trẻ ra ngoài chơi",
          icon: <Baby className="h-4 w-4" />,
          priority: "high",
          category: "outdoor",
        },
        {
          id: "2",
          title: "Theo dõi sức khỏe trẻ",
          description: "Chú ý các dấu hiệu khó thở, ho",
          icon: <Heart className="h-4 w-4" />,
          priority: "high",
          category: "health",
        },
      ],
      elderly: [
        {
          id: "1",
          title: "Ở trong nhà hoàn toàn",
          description: "Tránh mọi hoạt động ngoài trời",
          icon: <Home className="h-4 w-4" />,
          priority: "high",
          category: "outdoor",
        },
        {
          id: "2",
          title: "Liên lạc người thân",
          description: "Thông báo tình trạng sức khỏe cho gia đình",
          icon: <Heart className="h-4 w-4" />,
          priority: "high",
          category: "health",
        },
      ],
      athlete: [
        {
          id: "1",
          title: "Tập trong nhà",
          description: "Chuyển sang tập luyện trong phòng gym",
          icon: <Activity className="h-4 w-4" />,
          priority: "high",
          category: "outdoor",
        },
        {
          id: "2",
          title: "Hoãn tập nếu cần",
          description: "Nghỉ ngơi nếu cảm thấy khó thở",
          icon: <Clock className="h-4 w-4" />,
          priority: "medium",
          category: "health",
        },
      ],
    },
    Xấu: {
      normal: [
        {
          id: "1",
          title: "Ở nhà, đóng cửa",
          description: "Hạn chế tối đa ra ngoài, đóng kín cửa",
          icon: <Home className="h-4 w-4" />,
          priority: "high",
          category: "outdoor",
        },
        {
          id: "2",
          title: "Đeo khẩu trang N95",
          description: "Bắt buộc đeo khẩu trang khi ra ngoài",
          icon: <Shirt className="h-4 w-4" />,
          priority: "high",
          category: "protection",
        },
        {
          id: "3",
          title: "Bật máy lọc không khí",
          description: "Lọc không khí trong nhà liên tục",
          icon: <Wind className="h-4 w-4" />,
          priority: "high",
          category: "home",
        },
        {
          id: "4",
          title: "Sử dụng phương tiện cá nhân",
          description: "Tránh đi bộ, đi xe máy nếu phải ra ngoài",
          icon: <Car className="h-4 w-4" />,
          priority: "medium",
          category: "transport",
        },
      ],
      sensitive: [
        {
          id: "1",
          title: "Ở nhà tuyệt đối",
          description: "KHÔNG ra ngoài trong mọi trường hợp",
          icon: <Home className="h-4 w-4" />,
          priority: "high",
          category: "outdoor",
        },
        {
          id: "2",
          title: "Đóng kín cửa",
          description: "Đóng tất cả cửa sổ, cửa ra vào, lỗ thông gió",
          icon: <Home className="h-4 w-4" />,
          priority: "high",
          category: "home",
        },
        {
          id: "3",
          title: "Máy lọc không khí tối đa",
          description: "Bật máy lọc công suất cao liên tục",
          icon: <Wind className="h-4 w-4" />,
          priority: "high",
          category: "home",
        },
        {
          id: "4",
          title: "Sẵn sàng cấp cứu",
          description: "Chuẩn bị số điện thoại cấp cứu, thuốc",
          icon: <ShieldAlert className="h-4 w-4" />,
          priority: "high",
          category: "health",
        },
        {
          id: "5",
          title: "Uống thuốc dự phòng",
          description: "Dùng thuốc theo chỉ định bác sĩ",
          icon: <Heart className="h-4 w-4" />,
          priority: "high",
          category: "health",
        },
      ],
      children: [
        {
          id: "1",
          title: "Giữ trẻ trong nhà",
          description: "Tuyệt đối không cho trẻ ra ngoài",
          icon: <Baby className="h-4 w-4" />,
          priority: "high",
          category: "outdoor",
        },
        {
          id: "2",
          title: "Nghỉ học nếu cần",
          description: "Xem xét cho trẻ nghỉ học",
          icon: <Home className="h-4 w-4" />,
          priority: "high",
          category: "outdoor",
        },
        {
          id: "3",
          title: "Theo dõi liên tục",
          description: "Quan sát sức khỏe trẻ thường xuyên",
          icon: <Heart className="h-4 w-4" />,
          priority: "high",
          category: "health",
        },
      ],
      elderly: [
        {
          id: "1",
          title: "Cách ly hoàn toàn",
          description: "Ở trong phòng kín, tránh mọi tiếp xúc ngoài trời",
          icon: <Home className="h-4 w-4" />,
          priority: "high",
          category: "outdoor",
        },
        {
          id: "2",
          title: "Liên hệ y tế",
          description: "Thông báo cho bác sĩ, sẵn sàng cấp cứu",
          icon: <Heart className="h-4 w-4" />,
          priority: "high",
          category: "health",
        },
        {
          id: "3",
          title: "Người thân túc trực",
          description: "Có người ở cùng để hỗ trợ khi cần",
          icon: <PersonStanding className="h-4 w-4" />,
          priority: "high",
          category: "health",
        },
      ],
      athlete: [
        {
          id: "1",
          title: "Nghỉ tập hoàn toàn",
          description: "Không tập luyện trong và ngoài nhà",
          icon: <Activity className="h-4 w-4" />,
          priority: "high",
          category: "outdoor",
        },
        {
          id: "2",
          title: "Nghỉ ngơi phục hồi",
          description: "Tập trung nghỉ ngơi, uống nhiều nước",
          icon: <Heart className="h-4 w-4" />,
          priority: "high",
          category: "health",
        },
      ],
    },
  }

  // Get base recommendations for category and user group
  const categoryRecs = baseRecommendations[category]?.[userGroup] || baseRecommendations["Trung bình"][userGroup]
  recommendations.push(...categoryRecs)

  if (temp !== undefined) {
    if (temp > 35) {
      recommendations.push({
        id: "heat-warning",
        title: "Cảnh báo nắng nóng",
        description: "Nhiệt độ cao kết hợp ô nhiễm tăng nguy cơ sức khỏe. Uống đủ nước, tránh nắng.",
        icon: <Sun className="h-4 w-4" />,
        priority: "high",
        category: "health",
      })
    } else if (temp < 15) {
      recommendations.push({
        id: "cold-warning",
        title: "Lưu ý thời tiết lạnh",
        description: "Không khí lạnh có thể làm trầm trọng triệu chứng hô hấp. Giữ ấm cơ thể.",
        icon: <Thermometer className="h-4 w-4" />,
        priority: "medium",
        category: "health",
      })
    }
  }

  if (humidity !== undefined && humidity > 80) {
    recommendations.push({
      id: "humidity-warning",
      title: "Độ ẩm cao",
      description: "Độ ẩm cao làm các hạt ô nhiễm lơ lửng lâu hơn. Hạn chế hoạt động ngoài trời.",
      icon: <CloudRain className="h-4 w-4" />,
      priority: "medium",
      category: "health",
    })
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return recommendations
}

// Removed generateAQITrend function
// const generateAQITrend = (currentAQI: number): AQITrend => {
//   // Simulated trend based on time of day and random factors
//   const hour = new Date().getHours()
//   const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)
//   const change = isRushHour ? Math.random() * 20 + 5 : Math.random() * 15 - 7

//   return {
//     direction: change > 5 ? "increasing" : change < -5 ? "decreasing" : "stable",
//     change: Math.abs(change),
//     forecast2h:
//       change > 10
//         ? "Cân nhắc giảm hoạt động ngoài trời"
//         : change < -10
//           ? "Có thể tăng hoạt động ngoài trời"
//           : "Duy trì hoạt động hiện tại",
//     forecast6h: isRushHour ? "AQI dự báo giảm sau giờ cao điểm" : "AQI ổn định trong 6 giờ tới",
//   }
// }

export default function HomePage() {
  // Map state
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [isMapReady, setIsMapReady] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
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

  const [maxDepth, setMaxDepth] = useState(10)
  const [minSamplesLeaf, setMinSamplesLeaf] = useState(20)

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(allFeatures.map((f) => f.id))

  const [modelComparisons, setModelComparisons] = useState<ModelComparison[]>([])
  const [comparing, setComparing] = useState(false)

  const [activeTab, setActiveTab] = useState("prediction")

  const [accuracyHistory, setAccuracyHistory] = useState<{ depth: number; train: number; test: number }[]>([])

  const [userGroup, setUserGroup] = useState<UserGroup>("normal")
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [aqiTrend, setAqiTrend] = useState<AQITrend | null>(null)

  // Load map
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === "undefined") return

      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        link.crossOrigin = ""
        document.head.appendChild(link)
      }

      if (!(window as any).L) {
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        script.crossOrigin = ""
        document.head.appendChild(script)
        await new Promise((resolve) => {
          script.onload = resolve
        })
      }

      return (window as any).L
    }

    const initMap = async () => {
      const L = await loadLeaflet()
      if (!L || !mapRef.current || mapInstanceRef.current) return

      const map = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
      }).setView([16.0, 106.0], 6)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map

      vietnamStations.forEach((station) => {
        const marker = L.marker([station.lat, station.lng], {
          icon: L.divIcon({
            className: "custom-marker",
            html: `<div class="marker-pin"><div class="marker-inner"></div></div>`,
            iconSize: [30, 42],
            iconAnchor: [15, 42],
          }),
        })
          .addTo(map)
          .bindPopup(`<b>${station.name}</b><br>Station ID: ${station.id}`)
          .on("click", () => {
            setSelectedStation(station.id)
            setSelectedLocation({
              lat: station.lat,
              lng: station.lng,
              name: station.name,
            })
          })

        markersRef.current.push({ id: station.id, marker })
      })

      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng
        setSelectedStation(null)
        setSelectedLocation({
          lat,
          lng,
          name: `Vị trí tùy chọn (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        })
      })

      setIsMapReady(true)
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update markers when selection changes
  useEffect(() => {
    if (!isMapReady) return

    markersRef.current.forEach(({ id, marker }) => {
      const isActive = id === selectedStation
      marker.setIcon(
        (window as any).L.divIcon({
          className: "custom-marker",
          html: `<div class="marker-pin ${isActive ? "active" : ""}"><div class="marker-inner"></div></div>`,
          iconSize: [30, 42],
          iconAnchor: [15, 42],
        }),
      )
    })

    if (selectedStation && mapInstanceRef.current) {
      const station = vietnamStations.find((s) => s.id === selectedStation)
      if (station) {
        mapInstanceRef.current.setView([station.lat, station.lng], 12, { animate: true })
      }
    }
  }, [selectedStation, isMapReady])

  // Fetch air quality when location changes
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
      setAqiTrend(trend)
      const recs = generateRecommendations(
        prediction.prediction.category,
        userGroup,
        trend,
        airQualityData.temp,
        airQualityData.humidity,
      )
      setRecommendations(recs)
    } else if (airQualityData) {
      // Also generate recommendations if only airQualityData is available (e.g., initial load)
      const trend: AQITrend = {
        direction: "stable",
        change: 0,
        forecast2h: "",
        forecast6h: "",
      }
      setAqiTrend(trend)
      const recs = generateRecommendations(
        getAqiCategory(airQualityData.aqi / 50).name, // Use a sensible default category if no prediction yet
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
        temp: data.weather.temp,          // 31.05
        humidity: data.weather.humidity, // 62
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
    // Based on the current logic, aqi is scaled by 50, so let's adjust thresholds
    const scaledAqi = aqi * 50
    if (scaledAqi <= 50) return { name: "Tốt", color: "bg-green-500" }
    if (scaledAqi <= 100) return { name: "Trung bình", color: "bg-yellow-500" }
    if (scaledAqi <= 150) return { name: "Không tốt cho nhóm nhạy cảm", color: "bg-orange-500" }
    if (scaledAqi <= 200) return { name: "Không lành mạnh", color: "bg-red-500" }
    return { name: "Nguy hiểm", color: "bg-purple-500" }
  }

  const handleSearch = () => {
    if (!searchQuery || !mapInstanceRef.current) return
    const query = searchQuery.toLowerCase()
    const station = vietnamStations.find(
      (s) => s.name.toLowerCase().includes(query) || s.id.toLowerCase().includes(query),
    )
    if (station) {
      mapInstanceRef.current.setView([station.lat, station.lng], 13, { animate: true })
      setSelectedStation(station.id)
      setSelectedLocation({ lat: station.lat, lng: station.lng, name: station.name })
    }
  }

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([latitude, longitude], 13, { animate: true })
          }
          setSelectedStation(null)
          setSelectedLocation({
            lat: latitude,
            lng: longitude,
            name: "Vị trí hiện tại",
          })
        },
        (error) => console.error("Geolocation error:", error),
      )
    }
  }

  const savePredictionToHistory = (predResult: PredictionResult, aqData: AirQualityData, location: string) => {
    const historyEntry: PredictionHistory = {
      id: Date.now().toString(),
      timestamp: predResult.timestamp,
      location: location,
      category: predResult.prediction.category,
      confidence: predResult.prediction.confidence,
      aqi: aqData.aqi,
      pm25: aqData.pm25,
      pm10: aqData.pm10,
    }
    setPredictionHistory((prev) => [historyEntry, ...prev])
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
            PM25: airQualityData.pm25,
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
          setAqiTrend(trend)

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

  const handleDownloadModel = async () => {
    if (!currentModel) return

    try {
      // Assuming an API endpoint exists to download a specific model
      const response = await fetch(`/api/models/download/${currentModel.id}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${currentModel.name}.pkl` // Assuming model files are .pkl
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Download error:", error)
    }
  }

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureId) ? prev.filter((f) => f !== featureId) : [...prev, featureId],
    )
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
            {/* Map Card */}
            <Card className="bg-slate-900/50 border-slate-800 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-emerald-500" />
                  Bản đồ Việt Nam - OpenStreetMap
                </h2>
              </div>

              {/* Search Bar */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Tìm trạm quan trắc..."
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 pr-10"
                  />
                  <button
                    onClick={handleSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
                <Button
                  onClick={handleCurrentLocation}
                  variant="outline"
                  className="bg-slate-800/50 border-slate-700 hover:bg-slate-700 hover:border-emerald-500 text-white"
                >
                  <Locate className="h-4 w-4" />
                </Button>
              </div>

              {/* Map */}
              <div ref={mapRef} className="h-96 rounded-lg overflow-hidden border border-slate-800" />

              {/* Legend */}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-white">Tốt</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <span className="text-white">Trung bình</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-orange-500" />
                  <span className="text-white">Kém</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-white">Xấu</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded-full bg-purple-500" />
                  <span className="text-white">Rất xấu</span>
                </div>
              </div>
            </Card>

            {/* Station List */}
            <div className="mt-4">
              <p className="text-xs text-slate-500 mb-2">Trạm quan trắc ({vietnamStations.length} trạm)</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 max-h-50 overflow-y-auto">
                {vietnamStations.map((station) => (
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

            <div className="mt-4">
              <p className="text-xs text-slate-500 mb-2">Trạm quan trắc ({globalStations.length} trạm)</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 max-h-50 overflow-y-auto">
                {globalStations.map((station) => (
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

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-lg border border-slate-700">
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

                {/* Moved recommendations to its own tab */}
                {/* Added user group selection */}
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

                  {/* AQI Trend Display */}
                  {aqiTrend && (
                    <div
                      className={`p-3 rounded-lg mb-4 ${
                        aqiTrend.direction === "increasing"
                          ? "bg-red-500/20 border border-red-500/30"
                          : aqiTrend.direction === "decreasing"
                            ? "bg-green-500/20 border border-green-500/30"
                            : "bg-slate-700/50 border border-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {aqiTrend.direction === "increasing" ? (
                          <TrendingUp className="h-4 w-4 text-red-400" />
                        ) : aqiTrend.direction === "decreasing" ? (
                          <TrendingDown className="h-4 w-4 text-green-400" />
                        ) : (
                          <Activity className="h-4 w-4 text-slate-400" />
                        )}
                        <span className="text-sm font-medium text-white">
                          Xu hướng AQI:{" "}
                          {aqiTrend.direction === "increasing"
                            ? "Tăng"
                            : aqiTrend.direction === "decreasing"
                              ? "Giảm"
                              : "Ổn định"}
                          {aqiTrend.change > 5 && ` (${aqiTrend.change.toFixed(0)}%)`}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300">
                        <div>2 giờ tới: {aqiTrend.forecast2h}</div>
                        <div>6 giờ tới: {aqiTrend.forecast6h}</div>
                      </div>
                    </div>
                  )}

                  {/* Recommendations List */}
                  {recommendations.length > 0 ? (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
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

                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
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
