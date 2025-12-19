import pandas as pd
import numpy as np
from sklearn.model_selection import TimeSeriesSplit
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix
from sklearn.preprocessing import LabelEncoder
import pickle
import warnings
from datetime import datetime

warnings.filterwarnings('ignore')

# ==============================
# 1. CÁC HÀM TÍNH AQI THEO CHUẨN EPA (Giữ từ file cũ)
# ==============================
def linear_interpolation(conc, breakpoints):
    # (Giữ nguyên logic hàm này của bạn)
    for bp in breakpoints:
        if bp[0] <= conc <= bp[1]:
            return ((bp[3] - bp[2]) / (bp[1] - bp[0])) * (conc - bp[0]) + bp[2]
    return 500

def calc_aqi_pm25(conc):
    if conc < 0: return 0
    breakpoints = [(0.0, 12.0, 0, 50), (12.1, 35.4, 51, 100), (35.5, 55.4, 101, 150),
                   (55.5, 150.4, 151, 200), (150.5, 250.4, 201, 300), (250.5, 500.4, 301, 500)]
    return linear_interpolation(conc, breakpoints)

def aqi_to_label(aqi):
    if aqi <= 50: return "Tốt"
    elif aqi <= 100: return "Trung bình"
    elif aqi <= 150: return "Kém"
    elif aqi <= 200: return "Xấu"
    elif aqi <= 300: return "Rất xấu"
    else: return "Nguy hại"

# ==============================
# 2. TIỀN XỬ LÝ & TẠO ĐẶC TRƯNG (DỰA TRÊN DATASET MỚI)
# ==============================
def preprocess_and_feature_engineering(df):
    print("Đang xử lý dữ liệu và tạo đặc trưng...")
    df = df.copy()
    
    # 1. Xử lý thời gian
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(['Station_No', 'date'])
    
    # 2. Tính toán nhãn hiện tại (để làm mục tiêu cho tương lai)
    # Giả sử dùng PM2.5 làm chỉ số chính như dataset bạn đưa
    df['Current_AQI'] = df['PM2.5'].apply(calc_aqi_pm25)
    df['Current_Label'] = df['Current_AQI'].apply(aqi_to_label)
    
    # 3. TẠO NHÃN MỤC TIÊU: Dự báo mức độ của 3 giờ sau
    # Shift -3 nghĩa là lấy nhãn của 3 dòng tiếp theo gán cho dòng hiện tại
    df['Target_Label'] = df.groupby('Station_No')['Current_Label'].shift(-3)
    
    # 4. TẠO ĐẶC TRƯNG TRỄ (LAG FEATURES) - Giúp AI thấy xu hướng
    for col in ['PM2.5', 'Temperature', 'Humidity']:
        # Giá trị của 1 giờ trước
        df[f'{col}_lag1h'] = df.groupby('Station_No')[col].shift(1)
        # Trung bình trượt 3 giờ gần nhất
        df[f'{col}_mean3h'] = df.groupby('Station_No')[col].transform(lambda x: x.rolling(3).mean())
    
    # 5. Đặc trưng thời điểm
    df['Hour'] = df['date'].dt.hour
    df['Is_Rush_Hour'] = df['Hour'].isin([7, 8, 17, 18]).astype(int)
    
    # Xóa các dòng bị NaN do quá trình shift (thường là các dòng cuối và đầu của mỗi trạm)
    df = df.dropna()
    return df

# ==============================
# 3. HUẤN LUYỆN MÔ HÌNH
# ==============================
def train_ai_model(file_path):
    # Load dữ liệu
    df_raw = pd.read_csv(file_path)
    
    # Tiền xử lý
    df = preprocess_and_feature_engineering(df_raw)
    
    # Chọn các cột đầu vào (Features) - KHÔNG bao gồm nhãn hiện tại trực tiếp
    features = ['PM2.5', 'Temperature', 'Humidity', 'CO', 'NO2', 
                'PM2.5_lag1h', 'PM2.5_mean3h', 'Hour', 'Is_Rush_Hour']
    
    X = df[features]
    y = df['Target_Label']
    
    # Mã hóa nhãn (Tốt, Xấu... -> 0, 1...)
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    
    # Chia dữ liệu theo thời gian (Train 80%, Test 20%)
    split_idx = int(len(df) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y_encoded[:split_idx], y_encoded[split_idx:]
    
    print(f"Đang huấn luyện Random Forest trên {len(X_train)} dòng...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Đánh giá
    y_pred = model.predict(X_test)
    print("\nKẾT QUẢ ĐÁNH GIÁ MÔ HÌNH (Dự báo trước 3 giờ):")
    print(f"Độ chính xác tổng thể: {accuracy_score(y_test, y_pred):.2%}")
    print("\nChi tiết từng mức độ:")
    print(classification_report(y_test, y_pred, target_names=le.classes_))
    
    return model, le

if __name__ == "__main__":
    # Thay tên file csv của bạn vào đây
    csv_file = "./scripts/datasets/air_quality_data.csv" 
    try:
        # 1. Huấn luyện mô hình và lấy các thông tin cần thiết
        # Giả sử hàm train_ai_model trả về: model, encoder và danh sách các cột features
        model, encoder = train_ai_model(csv_file)
        features = ['PM2.5', 'Temperature', 'Humidity', 'CO', 'NO2', 
                    'PM2.5_lag1h', 'PM2.5_mean3h', 'Hour', 'Is_Rush_Hour']

        # 2. ĐÓNG GÓI TẤT CẢ VÀO 1 DICTIONARY
        model_data = {
            'model': model,
            'encoder': encoder,
            'features': features  # Lưu luôn danh sách cột để website không bị nhầm thứ tự
        }
        
        # 3. LƯU DUY NHẤT 1 FILE .PKL
        with open('air_quality_final_model.pkl', 'wb') as f:
            pickle.dump(model_data, f)
            
        print("\nĐÃ XUẤT DUY NHẤT 1 FILE: air_quality_final_model.pkl")

    except Exception as e:
        print(f"Lỗi: {e}")