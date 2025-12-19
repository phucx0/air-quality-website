import {
  Wind,
  Droplets,
  Thermometer,
  Target,
  Heart,
  ShieldAlert,
  Baby,
  PersonStanding,
  Clock,
  Home,
  Shirt,
  Car,
  Activity,
  Sun,
  CloudRain
} from "lucide-react"

export const generateRecommendations = (
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