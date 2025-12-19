import pandas as pd
import numpy as np
import pickle
import matplotlib.pyplot as plt
from datetime import datetime
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline

# ==============================
# 1. CẬP NHẬT AQI CALCULATOR (ĐỦ CÁC KHÍ)
# ==============================
class AQICalculator:
    @staticmethod
    def linear_interpolation(conc, breakpoints):
        if np.isnan(conc): return 0
        for C_low, C_high, I_low, I_high in breakpoints:
            if C_low <= conc <= C_high:
                return ((I_high - I_low) / (C_high - C_low)) * (conc - C_low) + I_low
        return breakpoints[-1][3] if conc > 0 else 0

    def calc_pm25(self, c):
        return self.linear_interpolation(c, [(0, 12, 0, 50), (12.1, 35.4, 51, 100), (35.5, 55.4, 101, 150), (55.5, 150.4, 151, 200), (150.5, 250.4, 201, 300), (250.5, 500, 301, 500)])

    def calc_pm10(self, c):
        return self.linear_interpolation(c, [(0, 54, 0, 50), (55, 154, 51, 100), (155, 254, 101, 150), (255, 354, 151, 200), (355, 424, 201, 300), (425, 604, 301, 500)])

    def calc_co(self, c):
        # Chuyển đổi µg/m³ sang ppm (chia ~1150) nếu cần
        ppm = c / 1150 if c > 100 else c
        return self.linear_interpolation(ppm, [(0, 4.4, 0, 50), (4.5, 9.4, 51, 100), (9.5, 12.4, 101, 150), (12.5, 15.4, 151, 200), (15.5, 30.4, 201, 300)])

    def get_label(self, aqi):
        if aqi <= 50: return 'Tốt'
        if aqi <= 100: return 'Trung bình'
        if aqi <= 150: return 'Kém'
        if aqi <= 200: return 'Xấu'
        if aqi <= 300: return 'Rất xấu'
        return 'Nguy hại'

# ==============================
# 2. CẬP NHẬT CHUẨN BỊ DỮ LIỆU
# ==============================
class AirQualityModel:
    def __init__(self):
        self.aqi_calc = AQICalculator()
        self.le = LabelEncoder()
        self.model = None

    def prepare_data(self, df):
        df = df.copy()

        # 1. Tính PM10 từ TSP theo yêu cầu của bạn
        if 'TSP' in df.columns:
            df['PM10'] = df['TSP'] / 1.5
            print("✓ Đã tính PM10 = TSP / 1.5")

        # 2. Xử lý giá trị thiếu cho các cột quan trọng
        numeric_cols = ['PM2.5', 'PM10', 'O3', 'CO', 'NO2', 'SO2', 'Temperature', 'Humidity']
        for col in numeric_cols:
            if col in df.columns:
                df[col] = df[col].fillna(df[col].median())

        # 3. Tính AQI cho từng thành phần
        df['AQI_PM25'] = df['PM2.5'].apply(self.aqi_calc.calc_pm25)
        df['AQI_PM10'] = df['PM10'].apply(self.aqi_calc.calc_pm10)
        df['AQI_CO'] = df['CO'].apply(self.aqi_calc.calc_co)
        
        # AQI tổng hợp (Max của tất cả chỉ số phụ)
        aqi_subs = [c for c in df.columns if 'AQI_' in c]
        df['AQI_Max'] = df[aqi_subs].max(axis=1)
        df['Target'] = df['AQI_Max'].apply(self.aqi_calc.get_label)

        # 4. Feature Engineering
        df['PM_ratio'] = df['PM2.5'] / (df['PM10'] + 1e-6)
        df['Temp_Humid_Idx'] = (df['Temperature'] * df['Humidity']) / 100
        
        # Xử lý thời gian (Dữ liệu của bạn có cột 'date')
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            df['Hour'] = df['date'].dt.hour
            df['Is_Rush_Hour'] = df['Hour'].isin([7,8,17,18]).astype(int)

        return df

    def train(self, df):
        print("--- Đang bắt đầu huấn luyện ---")
        df = self.prepare_data(df)
        
        # Chọn các feature thực tế nhất (loại bỏ AQI trực tiếp để tránh rò rỉ dữ liệu)
        self.feature_cols = ['PM2.5', 'PM10', 'O3', 'CO', 'NO2', 'SO2', 
                            'Temperature', 'Humidity', 'PM_ratio', 'Temp_Humid_Idx']
        
        # Chỉ lấy những cột thực sự tồn tại trong DF
        self.feature_cols = [c for c in self.feature_cols if c in df.columns]
        
        X = df[self.feature_cols]
        y = self.le.fit_transform(df['Target'])
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)

        # Pipeline hoàn chỉnh
        pipeline = ImbPipeline([
            ('scaler', StandardScaler()),
            ('smote', SMOTE(random_state=42)),
            ('rf', RandomForestClassifier(n_estimators=100, max_depth=15, random_state=42, n_jobs=-1))
        ])

        pipeline.fit(X_train, y_train)
        self.model = pipeline
        
        # Đánh giá
        y_pred = pipeline.predict(X_test)
        print(f"\n✅ Huấn luyện xong! F1 Score: {f1_score(y_test, y_pred, average='weighted'):.4f}")
        print("\nBáo cáo phân loại:")
        print(classification_report(y_test, y_pred, target_names=self.le.classes_))
        
        return pipeline
    def save(self, path="air_quality_v2.pkl"):
        data = {
            'model': self.model,
            'feature_names': self.feature_cols,
            'label_encoder': self.le,
            'date': datetime.now()
        }
        with open(path, 'wb') as f:
            pickle.dump(data, f)
        print(f"Đã lưu mô hình tại {path}")

def load_data(file_path):
    """Load và hiển thị thông tin cơ bản về dataset"""
    df = pd.read_csv(file_path)
    print("="*70)
    print("📂 LOAD DỮ LIỆU")
    print("="*70)
    print(f"✓ Đã đọc {len(df):,} dòng dữ liệu")
    print(f"✓ Số cột: {len(df.columns)}")
    print(f"✓ Các cột: {df.columns.tolist()}")
    print(f"\n📊 Thống kê cơ bản:")
    print(df.describe())
    return df
# ==============================
# 3. CHẠY PIPELINE
# ==============================

df = load_data("datasets/air_quality_data.csv")
aq_model = AirQualityModel()
aq_model.train(df)
aq_model.save()