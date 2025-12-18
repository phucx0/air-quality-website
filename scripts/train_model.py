import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
# from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score
from sklearn.preprocessing import LabelEncoder
from imblearn.over_sampling import SMOTE
import pickle
import matplotlib.pyplot as plt
# import seaborn as sns
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# ==============================
# 1. LOAD DỮ LIỆU
# ==============================
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
# 2. TÍNH AQI THEO CHUẨN EPA
# ==============================
def linear_interpolation(conc, breakpoints):
    """
    Tính AQI theo công thức EPA (linear interpolation)
    breakpoints: [(C_low, C_high, I_low, I_high), ...]
    """
    for C_low, C_high, I_low, I_high in breakpoints:
        if C_low <= conc <= C_high:
            return ((I_high - I_low) / (C_high - C_low)) * (conc - C_low) + I_low
    # Nếu vượt ngưỡng cao nhất
    return breakpoints[-1][3]  # Trả về I_high của breakpoint cuối


def calc_sub_aqi(c, bp_lo, bp_hi, aqi_lo, aqi_hi):
    return (aqi_hi - aqi_lo) / (bp_hi - bp_lo) * (c - bp_lo) + aqi_lo

def aqi_pm25(c):
    if c <= 12:
        return calc_sub_aqi(c, 0, 12, 0, 50)
    elif c <= 35.4:
        return calc_sub_aqi(c, 12.1, 35.4, 51, 100)
    elif c <= 55.4:
        return calc_sub_aqi(c, 35.5, 55.4, 101, 150)
    elif c <= 150.4:
        return calc_sub_aqi(c, 55.5, 150.4, 151, 200)
    elif c <= 250.4:
        return calc_sub_aqi(c, 150.5, 250.4, 201, 300)
    else:
        return calc_sub_aqi(c, 250.5, 500, 301, 500)

def aqi_pm10(c):
    if c <= 54:
        return calc_sub_aqi(c, 0, 54, 0, 50)
    elif c <= 154:
        return calc_sub_aqi(c, 55, 154, 51, 100)
    elif c <= 254:
        return calc_sub_aqi(c, 155, 254, 101, 150)
    elif c <= 354:
        return calc_sub_aqi(c, 255, 354, 151, 200)
    elif c <= 424:
        return calc_sub_aqi(c, 355, 424, 201, 300)
    else:
        return calc_sub_aqi(c, 425, 604, 301, 500)

def compute_aqi(row):
    aqi_values = []

    if not pd.isna(row.get("pm25")):
        aqi_values.append(aqi_pm25(row["pm25"]))

    if not pd.isna(row.get("pm10")):
        aqi_values.append(aqi_pm10(row["pm10"]))

    if len(aqi_values) == 0:
        return np.nan

    return max(aqi_values)


def calc_aqi_pm25(conc):
    """Tính AQI cho PM2.5 theo chuẩn EPA"""
    breakpoints = [
        (0.0, 12.0, 0, 50),      # Good
        (12.1, 35.4, 51, 100),   # Moderate
        (35.5, 55.4, 101, 150),  # Unhealthy for Sensitive Groups
        (55.5, 150.4, 151, 200), # Unhealthy
        (150.5, 250.4, 201, 300),# Very Unhealthy
        (250.5, 500.0, 301, 500) # Hazardous
    ]
    return linear_interpolation(conc, breakpoints)


def calc_aqi_pm10(conc):
    """Tính AQI cho PM10 theo chuẩn EPA"""
    breakpoints = [
        (0, 54, 0, 50),
        (55, 154, 51, 100),
        (155, 254, 101, 150),
        (255, 354, 151, 200),
        (355, 424, 201, 300),
        (425, 604, 301, 500)
    ]
    return linear_interpolation(conc, breakpoints)


def calc_aqi_o3(conc):
    """Tính AQI cho O3 (8-hour) theo chuẩn EPA - đơn vị ppb"""
    breakpoints = [
        (0, 54, 0, 50),
        (55, 70, 51, 100),
        (71, 85, 101, 150),
        (86, 105, 151, 200),
        (106, 200, 201, 300)
    ]
    return linear_interpolation(conc, breakpoints)


def calc_aqi_co(conc):
    """
    Tính AQI cho CO theo chuẩn EPA - đơn vị ppm
    Lưu ý: Nếu data là µg/m³, cần chia cho 1150 để ra ppm
    """
    # Convert từ µg/m³ sang ppm nếu cần
    if conc > 100:  # Nếu giá trị > 100 thì chắc là µg/m³
        conc = conc / 1150
    
    breakpoints = [
        (0.0, 4.4, 0, 50),
        (4.5, 9.4, 51, 100),
        (9.5, 12.4, 101, 150),
        (12.5, 15.4, 151, 200),
        (15.5, 30.4, 201, 300),
        (30.5, 50.4, 301, 500)
    ]
    return linear_interpolation(conc, breakpoints)


def calc_aqi_no2(conc):
    """Tính AQI cho NO2 theo chuẩn EPA - đơn vị ppb"""
    breakpoints = [
        (0, 53, 0, 50),
        (54, 100, 51, 100),
        (101, 360, 101, 150),
        (361, 649, 151, 200),
        (650, 1249, 201, 300),
        (1250, 2049, 301, 500)
    ]
    return linear_interpolation(conc, breakpoints)


def calc_aqi_so2(conc):
    """Tính AQI cho SO2 theo chuẩn EPA - đơn vị ppb"""
    breakpoints = [
        (0, 35, 0, 50),
        (36, 75, 51, 100),
        (76, 185, 101, 150),
        (186, 304, 151, 200),
        (305, 604, 201, 300),
        (605, 1004, 301, 500)
    ]
    return linear_interpolation(conc, breakpoints)


# ==============================
# 3. GÁN NHÃN POLLUTION LEVEL
# ==============================
# def label_risk_level(row):
#     score = 0

#     if row["PM2.5"] > 55: score += 1
#     if row["PM10"] > 150: score += 1
#     if row["O3"] > 100: score += 1
#     if row["NO2"] > 200: score += 1
#     if row["SO2"] > 75: score += 1
#     if row["CO"] > 3000: score += 1

#     # weather amplifiers
#     if row["Temperature"] > 35 and row["Humidity"] < 40:
#         score += 1

#     if score >= 4:
#         return "Dangerous"
#     elif score >= 2:
#         return "High"
#     elif score == 1:
#         return "Moderate"
#     else:
#         return "Safe"

# def create_pollution_labels(df):
#     df = df.copy()

#     # Ước lượng PM10 từ TSP nếu thiếu
#     if 'PM10' not in df.columns and 'TSP' in df.columns:
#         df['PM10'] = df['TSP'] / 1.5
#         print("✓ Đã ước lượng PM10 từ TSP (PM10 = TSP / 1.5)")

#     # KIỂM TRA CỘT BẮT BUỘC
#     required_cols = [
#         "PM2.5", "PM10", "O3", "CO", "NO2", "SO2",
#         "Temperature", "Humidity"
#     ]
#     missing = [c for c in required_cols if c not in df.columns]
#     if missing:
#         raise ValueError(f"❌ Thiếu cột bắt buộc: {missing}")

#     # GÁN NHÃN ĐÚNG: apply theo ROW
#     df["Pollution_Level"] = df.apply(label_risk_level, axis=1)

#     return df

def create_pollution_labels(df):
    """
    Tạo nhãn Pollution_Level dựa trên AQI chuẩn EPA
    """
    print("\n" + "="*70)
    print("🏷️  TẠO NHÃN POLLUTION LEVEL")
    print("="*70)
    
    df = df.copy()
    
    # Ước lượng PM10 từ TSP nếu không có PM10
    if 'PM10' not in df.columns and 'TSP' in df.columns:
        df['PM10'] = df['TSP'] / 1.5
        print("✓ Đã ước lượng PM10 từ TSP (PM10 = TSP / 1.5)")
    
    # Tính AQI cho từng chất ô nhiễm
    df['AQI_PM25'] = df['PM2.5'].apply(calc_aqi_pm25)
    df['AQI_PM10'] = df['PM10'].apply(calc_aqi_pm10)
    df['AQI_O3'] = df['O3'].apply(calc_aqi_o3)
    df['AQI_CO'] = df['CO'].apply(calc_aqi_co)
    df['AQI_NO2'] = df['NO2'].apply(calc_aqi_no2)
    df['AQI_SO2'] = df['SO2'].apply(calc_aqi_so2)
    
    # AQI tổng hợp = max của tất cả AQI (theo chuẩn EPA)
    aqi_cols = ['AQI_PM25', 'AQI_PM10', 'AQI_O3', 'AQI_CO', 'AQI_NO2', 'AQI_SO2']
    df['AQI'] = df[aqi_cols].max(axis=1)
    
    # Gán nhãn theo thang AQI chuẩn
    def aqi_to_label(aqi):
        if aqi <= 50:
            return 'Tốt'
        elif aqi <= 100:
            return 'Trung bình'
        elif aqi <= 150:
            return 'Không tốt cho người nhạy cảm'
        elif aqi <= 200:
            return 'Không tốt cho sức khỏe'
        elif aqi <= 300:
            return 'Rất xấu'
        else:
            return 'Nguy hại'
    
    df['Pollution_Level'] = df['AQI'].apply(aqi_to_label)
    
    # Thống kê phân bố
    print("\n✓ Hoàn tất tính AQI!")
    print(f"\n📊 Phân bố AQI:")
    print(f"   Min AQI: {df['AQI'].min():.1f}")
    print(f"   Max AQI: {df['AQI'].max():.1f}")
    print(f"   Mean AQI: {df['AQI'].mean():.1f}")
    print(f"   Median AQI: {df['AQI'].median():.1f}")
    
    print(f"\n📊 Phân bố Pollution Level:")
    label_counts = df['Pollution_Level'].value_counts()
    labels_order = ['Tốt', 'Trung bình', 'Không tốt cho người nhạy cảm', 
                    'Không tốt cho sức khỏe', 'Rất xấu', 'Nguy hại']
    
    for label in labels_order:
        count = label_counts.get(label, 0)
        pct = count / len(df) * 100
        bar = "█" * int(pct / 2)
        print(f"   {label:25s}: {count:6,d} ({pct:5.1f}%) {bar}")
    
    return df


# ==============================
# 4. FEATURE ENGINEERING
# ==============================
def create_features(df):
    """Tạo thêm features từ dữ liệu gốc"""
    print("\n" + "="*70)
    print("🔧 FEATURE ENGINEERING")
    print("="*70)
    
    df = df.copy()
    
    # 1. Tỉ lệ PM2.5/PM10 (chỉ số chất lượng hạt bụi)
    df['PM_ratio'] = df['PM2.5'] / (df['PM10'] + 1e-6)
    print("✓ Tạo feature: PM_ratio (PM2.5/PM10)")
    
    # 2. Pollution Index tổng hợp (weighted sum)
    df['Pollution_Index'] = (
        df['PM2.5'] * 0.35 +
        df['PM10'] * 0.25 +
        df['O3'] * 0.15 +
        df['NO2'] * 0.10 +
        df['SO2'] * 0.10 +
        df['CO'] * 0.05
    )
    print("✓ Tạo feature: Pollution_Index (weighted sum)")
    
    # 3. Interaction giữa nhiệt độ và độ ẩm
    df['Temp_Humidity'] = df['Temperature'] * df['Humidity'] / 100
    print("✓ Tạo feature: Temp_Humidity (interaction)")
    
    # 4. Temporal features (nếu có cột thời gian)
    if 'DateTime' in df.columns or 'Date' in df.columns:
        date_col = 'DateTime' if 'DateTime' in df.columns else 'Date'
        df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
        
        df['Hour'] = df[date_col].dt.hour
        df['DayOfWeek'] = df[date_col].dt.dayofweek
        df['Month'] = df[date_col].dt.month
        df['Is_Weekend'] = (df['DayOfWeek'] >= 5).astype(int)
        df['Is_Rush_Hour'] = df['Hour'].isin([7, 8, 9, 17, 18, 19]).astype(int)
        
        print("✓ Tạo temporal features: Hour, DayOfWeek, Month, Is_Weekend, Is_Rush_Hour")
    
    print(f"\n✓ Tổng số features sau engineering: {len(df.columns)}")
    
    return df


# ==============================
# 5. TIỀN XỬ LÝ DỮ LIỆU
# ==============================
def preprocess_data(df):
    """Xử lý missing values và outliers"""
    print("\n" + "="*70)
    print("🔍 TIỀN XỬ LÝ DỮ LIỆU")
    print("="*70)
    
    # Chọn các cột numeric
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    
    # Loại bỏ các cột AQI và label
    exclude_cols = ['AQI', 'AQI_PM25', 'AQI_PM10', 'AQI_O3', 'AQI_CO', 'AQI_NO2', 'AQI_SO2']
    numeric_cols = [col for col in numeric_cols if col not in exclude_cols]
    
    print(f"\n📋 Kiểm tra missing values:")
    missing = df[numeric_cols].isnull().sum()
    if missing.any():
        print(missing[missing > 0])
        print("   → Điền bằng median")
        for col in numeric_cols:
            df[col] = df[col].fillna(df[col].median())
    else:
        print("   ✓ Không có giá trị thiếu")
    
    # Loại bỏ outliers cực đoan (> 3 std)
    print(f"\n📋 Loại bỏ outliers:")
    before = len(df)
    for col in numeric_cols:
        mean = df[col].mean()
        std = df[col].std()
        df = df[(df[col] >= mean - 3*std) & (df[col] <= mean + 3*std)]
    
    after = len(df)
    removed = before - after
    if removed > 0:
        print(f"   ⚠️  Đã loại bỏ {removed:,} dòng outliers ({removed/before*100:.2f}%)")
    else:
        print("   ✓ Không có outliers cực đoan")
    
    # Loại bỏ dòng còn NaN
    df = df.dropna()
    
    print(f"\n✓ Còn lại {len(df):,} dòng sau tiền xử lý")
    
    return df


# ==============================
# 6. TRAIN MODELS
# ==============================
def train_multiple_models(X_train, X_test, y_train, y_test, label_encoder, use_smote=True):
    """
    Train và so sánh nhiều models
    """
    print("\n" + "="*70)
    print("🤖 TRAIN MULTIPLE MODELS")
    print("="*70)
    
    # SMOTE để cân bằng classes
    if use_smote:
        print("\n⏳ Áp dụng SMOTE để cân bằng classes...")
        smote = SMOTE(random_state=42)
        X_train_res, y_train_res = smote.fit_resample(X_train, y_train)
        print(f"   Trước SMOTE: {len(X_train):,} samples")
        print(f"   Sau SMOTE: {len(X_train_res):,} samples")
    else:
        X_train_res, y_train_res = X_train, y_train
    
    # Define models
    models = {
        'Decision Tree': DecisionTreeClassifier(
            max_depth=15,
            min_samples_split=50,
            min_samples_leaf=20,
            class_weight='balanced',
            random_state=42
        )
        # 'Random Forest': RandomForestClassifier(
        #     n_estimators=100,
        #     max_depth=15,
        #     min_samples_split=50,
        #     min_samples_leaf=20,
        #     class_weight='balanced',
        #     random_state=42,
        #     n_jobs=-1
        # ),
        # 'Gradient Boosting': GradientBoostingClassifier(
        #     n_estimators=100,
        #     max_depth=8,
        #     learning_rate=0.1,
        #     random_state=42
        # )
    }
    
    results = {}
    
    for name, model in models.items():
        print(f"\n{'='*70}")
        print(f"📊 Training: {name}")
        print(f"{'='*70}")
        
        # Train
        model.fit(X_train_res, y_train_res)
        
        # Predict
        y_pred_train = model.predict(X_train)
        y_pred_test = model.predict(X_test)
        
        # Metrics
        train_acc = accuracy_score(y_train, y_pred_train)
        test_acc = accuracy_score(y_test, y_pred_test)
        f1_weighted = f1_score(y_test, y_pred_test, average='weighted')
        f1_macro = f1_score(y_test, y_pred_test, average='macro')
        
        # Cross-validation
        cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='accuracy')
        
        print(f"\n📊 Metrics:")
        print(f"   Train Accuracy:     {train_acc:.4f} ({train_acc*100:.2f}%)")
        print(f"   Test Accuracy:      {test_acc:.4f} ({test_acc*100:.2f}%)")
        print(f"   F1 Score (weighted): {f1_weighted:.4f}")
        print(f"   F1 Score (macro):    {f1_macro:.4f}")
        print(f"   CV Accuracy:        {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
        
        # Overfitting check
        gap = train_acc - test_acc
        if gap > 0.15:
            print(f"   ⚠️  OVERFITTING! (gap = {gap*100:.1f}%)")
        elif gap > 0.08:
            print(f"   ⚠️  Có dấu hiệu overfitting (gap = {gap*100:.1f}%)")
        else:
            print(f"   ✓ Model generalize tốt (gap = {gap*100:.1f}%)")
        
        results[name] = {
            'model': model,
            'train_acc': train_acc,
            'test_acc': test_acc,
            'f1_weighted': f1_weighted,
            'f1_macro': f1_macro,
            'cv_mean': cv_scores.mean(),
            'cv_std': cv_scores.std(),
            'y_pred_test': y_pred_test
        }
    
    # So sánh models
    print(f"\n{'='*70}")
    print("📊 SO SÁNH MODELS")
    print(f"{'='*70}")
    print(f"\n{'Model':<20} {'Train Acc':>10} {'Test Acc':>10} {'F1 (w)':>10} {'CV Acc':>15}")
    print("-" * 70)
    
    for name, res in results.items():
        print(f"{name:<20} {res['train_acc']:>10.4f} {res['test_acc']:>10.4f} "
              f"{res['f1_weighted']:>10.4f} {res['cv_mean']:>10.4f} ± {res['cv_std']:.4f}")
    
    # Chọn best model (dựa trên F1 weighted)
    best_name = max(results, key=lambda x: results[x]['f1_weighted'])
    best_model = results[best_name]['model']
    
    print(f"\n🏆 Best Model: {best_name} (F1 = {results[best_name]['f1_weighted']:.4f})")
    
    return best_model, results, best_name


# ==============================
# 7. ĐÁNH GIÁ CHI TIẾT
# ==============================
def detailed_evaluation(model, X_test, y_test, label_encoder, model_name):
    """Đánh giá chi tiết model tốt nhất"""
    print(f"\n{'='*70}")
    print(f"📊 ĐÁNH GIÁ CHI TIẾT: {model_name}")
    print(f"{'='*70}")
    
    y_pred = model.predict(X_test)
    
    # Classification Report
    print(f"\n📋 Classification Report:")
    print(classification_report(y_test, y_pred, 
                                target_names=label_encoder.classes_, 
                                digits=4))
    
    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    
    print(f"\n📊 Confusion Matrix:")
    classes = label_encoder.classes_
    
    # Header
    print("\n" + " " * 15 + "PREDICTED")
    print(" " * 10, end="")
    for c in classes:
        print(f"{c[:8]:>10s}", end="")
    print()
    
    # Rows
    print("ACTUAL")
    for i, label in enumerate(classes):
        print(f"{label[:10]:10s}", end="")
        for j in range(len(classes)):
            print(f"{cm[i][j]:10d}", end="")
        print()
    
    # Feature Importance
    if hasattr(model, 'feature_importances_'):
        feature_importance = pd.DataFrame({
            'Feature': X_test.columns,
            'Importance': model.feature_importances_
        }).sort_values(by='Importance', ascending=False)
        
        print(f"\n📊 Top 10 Feature Importance:")
        for idx, row in feature_importance.head(10).iterrows():
            bar = "█" * int(row['Importance'] * 100)
            print(f"   {row['Feature']:20s}: {row['Importance']:.4f} {bar}")


# ==============================
# 8. LƯU MODEL
# ==============================
def save_model(model, feature_names, label_encoder, model_name, filename="air_quality_model.pkl"):
    """Lưu model và metadata"""
    print(f"\n{'='*70}")
    print("💾 LƯU MODEL")
    print(f"{'='*70}")
    
    model_data = {
        'model': model,
        'model_name': model_name,
        'feature_names': feature_names,
        'label_encoder': label_encoder,
        'training_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'version': '2.0'
    }
    
    with open(filename, 'wb') as f:
        pickle.dump(model_data, f)
    
    print(f"✓ Đã lưu model: {filename}")
    print(f"   - Model: {model_name}")
    print(f"   - Features: {len(feature_names)}")
    print(f"   - Classes: {len(label_encoder.classes_)}")
    print(f"   - Training date: {model_data['training_date']}")


# ==============================
# 9. VISUALIZATIONS
# ==============================
def plot_results(results, label_encoder, save_path="model_comparison.png"):
    """Vẽ biểu đồ so sánh models"""
    fig, axes = plt.subplots(1, 2, figsize=(15, 5))
    
    # Plot 1: Accuracy comparison
    models = list(results.keys())
    train_accs = [results[m]['train_acc'] for m in models]
    test_accs = [results[m]['test_acc'] for m in models]
    
    x = np.arange(len(models))
    width = 0.35
    
    axes[0].bar(x - width/2, train_accs, width, label='Train', alpha=0.8)
    axes[0].bar(x + width/2, test_accs, width, label='Test', alpha=0.8)
    axes[0].set_ylabel('Accuracy')
    axes[0].set_title('Model Accuracy Comparison')
    axes[0].set_xticks(x)
    axes[0].set_xticklabels(models, rotation=15, ha='right')
    axes[0].legend()
    axes[0].grid(axis='y', alpha=0.3)
    
    # Plot 2: F1 scores
    f1_weighted = [results[m]['f1_weighted'] for m in models]
    f1_macro = [results[m]['f1_macro'] for m in models]
    
    axes[1].bar(x - width/2, f1_weighted, width, label='F1 (weighted)', alpha=0.8)
    axes[1].bar(x + width/2, f1_macro, width, label='F1 (macro)', alpha=0.8)
    axes[1].set_ylabel('F1 Score')
    axes[1].set_title('F1 Score Comparison')
    axes[1].set_xticks(x)
    axes[1].set_xticklabels(models, rotation=15, ha='right')
    axes[1].legend()
    axes[1].grid(axis='y', alpha=0.3)
    
    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    print(f"\n✓ Đã lưu biểu đồ: {save_path}")
    plt.close()


# ==============================
# 10. MAIN PIPELINE
# ==============================
def main(csv_file, use_smote=True):
    """Main training pipeline"""
    print("\n" + "="*70)
    print("🚀 AIR QUALITY MODEL TRAINING PIPELINE v2.0")
    print("="*70)
    
    # 1. Load data
    df = load_data(csv_file)
    
    # 2. Create labels
    df = create_pollution_labels(df)
    
    # 3. Feature engineering
    df = create_features(df)
    
    # 4. Preprocess
    df = preprocess_data(df)
    
    # 5. Select features
    # Base features
    feature_cols = [
        'PM2.5', 'PM10', 'O3', 'CO', 'NO2', 'SO2',
        'Temperature', 'Humidity'
    ]
    
    # Add engineered features
    engineered_features = ['PM_ratio', 'Pollution_Index', 'Temp_Humidity']
    feature_cols.extend([f for f in engineered_features if f in df.columns])
    
    # Add temporal features if available
    temporal_features = ['Hour', 'DayOfWeek', 'Month', 'Is_Weekend', 'Is_Rush_Hour']
    feature_cols.extend([f for f in temporal_features if f in df.columns])
    
    print(f"\n📋 Selected {len(feature_cols)} features:")
    for i, f in enumerate(feature_cols, 1):
        print(f"   {i:2d}. {f}")
    
    X = df[feature_cols]
    y = df['Pollution_Level']
    
    # 6. Encode labels
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    
    print(f"\n📋 Label Encoding:")
    for i, label in enumerate(le.classes_):
        count = (y_encoded == i).sum()
        print(f"   {i} → {label:25s} ({count:6,d} samples)")
    
    # 7. Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, stratify=y_encoded, random_state=42
    )
    
    print(f"\n📊 Train/Test Split:")
    print(f"   Train: {len(X_train):,} samples ({len(X_train)/len(X)*100:.1f}%)")
    print(f"   Test:  {len(X_test):,} samples ({len(X_test)/len(X)*100:.1f}%)")
    
    # 8. Train models
    best_model, results, best_name = train_multiple_models(
        X_train, X_test, y_train, y_test, le, use_smote=use_smote
    )
    
    # 9. Detailed evaluation
    detailed_evaluation(best_model, X_test, y_test, le, best_name)
    
    # 10. Visualize
    plot_results(results, le)
    
    # 11. Save model
    save_model(best_model, feature_cols, le, best_name)
    
    print("\n" + "="*70)
    print("✅ TRAINING HOÀN TẤT!")
    print("="*70)
    
    return best_model, results, feature_cols, le


# ==============================
# 11. DEMO PREDICTION
# ==============================
def predict_demo(model_file="air_quality_model.pkl"):
    """Demo dự đoán với dữ liệu mẫu"""
    print("\n" + "="*70)
    print("🎯 DEMO DỰ ĐOÁN")
    print("="*70)
    
    # Load model
    with open(model_file, 'rb') as f:
        data = pickle.load(f)
    
    model = data['model']
    feature_names = data['feature_names']
    le = data['label_encoder']
    model_name = data.get('model_name', 'Unknown')
    
    print(f"\n✓ Đã load model: {model_name}")
    print(f"   Features: {len(feature_names)}")
    print(f"   Classes: {le.classes_.tolist()}")
    
    # Tạo dữ liệu mẫu
    sample_data = {
        'PM2.5': [52],
        'PM10': [78],
        'O3': [33.39],
        'CO': [574.68],
        'NO2': [13.02],
        'SO2': [23.54],
        'Temperature': [30.59],
        'Humidity': [74.28]
    }
    
    # Thêm engineered features nếu có
    if 'PM_ratio' in feature_names:
        sample_data['PM_ratio'] = [sample_data['PM2.5'][0] / sample_data['PM10'][0]]
    
    if 'Pollution_Index' in feature_names:
        sample_data['Pollution_Index'] = [
            sample_data['PM2.5'][0] * 0.35 +
            sample_data['PM10'][0] * 0.25 +
            sample_data['O3'][0] * 0.15 +
            sample_data['NO2'][0] * 0.10 +
            sample_data['SO2'][0] * 0.10 +
            sample_data['CO'][0] * 0.05
        ]
    
    if 'Temp_Humidity' in feature_names:
        sample_data['Temp_Humidity'] = [
            sample_data['Temperature'][0] * sample_data['Humidity'][0] / 100
        ]
    
    # Thêm temporal features nếu có (giả sử là giờ cao điểm)
    if 'Hour' in feature_names:
        sample_data['Hour'] = [18]  # 6 PM
    if 'DayOfWeek' in feature_names:
        sample_data['DayOfWeek'] = [2]  # Wednesday
    if 'Month' in feature_names:
        sample_data['Month'] = [12]  # December
    if 'Is_Weekend' in feature_names:
        sample_data['Is_Weekend'] = [0]
    if 'Is_Rush_Hour' in feature_names:
        sample_data['Is_Rush_Hour'] = [1]
    
    # Tạo DataFrame với đúng thứ tự features
    sample = pd.DataFrame(sample_data)
    sample = sample[feature_names]
    
    print(f"\n🧪 Sample Input:")
    for col in feature_names:
        if col in sample.columns:
            print(f"   {col:20s}: {sample[col].values[0]:.2f}")
    
    # Predict
    pred = model.predict(sample)[0]
    proba = model.predict_proba(sample)[0]
    label = le.inverse_transform([pred])[0]
    
    print(f"\n🎯 Prediction Result:")
    print(f"   Predicted Level: {label}")
    print(f"   Confidence: {proba.max():.2%}")
    
    print(f"\n📊 Probability Distribution:")
    sorted_idx = np.argsort(proba)[::-1]
    for idx in sorted_idx:
        class_label = le.inverse_transform([idx])[0]
        prob = proba[idx]
        bar = "█" * int(prob * 50)
        print(f"   {class_label:25s}: {prob:6.2%} {bar}")
    
    # Tính AQI thực tế để so sánh
    pm25_val = sample['PM2.5'].values[0]
    aqi_pm25 = calc_aqi_pm25(pm25_val)
    
    if aqi_pm25 <= 50:
        expected = 'Tốt'
    elif aqi_pm25 <= 100:
        expected = 'Trung bình'
    elif aqi_pm25 <= 150:
        expected = 'Không tốt cho người nhạy cảm'
    elif aqi_pm25 <= 200:
        expected = 'Không lành mạnh'
    elif aqi_pm25 <= 300:
        expected = 'Không tốt cho sức khỏe'
    else:
        expected = 'Nguy hiểm'
    
    print(f"\n✓ Expected (PM2.5={pm25_val:.1f} → AQI={aqi_pm25:.0f}): {expected}")
    
    if label == expected:
        print(f"✅ CORRECT! Model predicted '{label}'")
    else:
        print(f"⚠️  Different! Model: '{label}' vs Expected: '{expected}'")
        print(f"   Note: This may be due to other pollutants affecting the result")


# ==============================
# 12. TEST VỚI NHIỀU SCENARIOS
# ==============================
def test_scenarios(model_file="air_quality_model.pkl"):
    """Test model với nhiều scenarios khác nhau"""
    print("\n" + "="*70)
    print("🧪 TEST MULTIPLE SCENARIOS")
    print("="*70)
    
    # Load model
    with open(model_file, 'rb') as f:
        data = pickle.load(f)
    
    model = data['model']
    feature_names = data['feature_names']
    le = data['label_encoder']
    
    # Define test scenarios
    scenarios = {
        'Clean Air': {
            'PM2.5': 10, 'PM10': 20, 'O3': 30, 'CO': 1.5,
            'NO2': 20, 'SO2': 15, 'Temperature': 25, 'Humidity': 60
        },
        'Moderate Pollution': {
            'PM2.5': 30, 'PM10': 80, 'O3': 60, 'CO': 5,
            'NO2': 60, 'SO2': 40, 'Temperature': 28, 'Humidity': 70
        },
        'Heavy Traffic (Rush Hour)': {
            'PM2.5': 55, 'PM10': 120, 'O3': 45, 'CO': 8,
            'NO2': 90, 'SO2': 35, 'Temperature': 32, 'Humidity': 65
        },
        'Industrial Area': {
            'PM2.5': 45, 'PM10': 100, 'O3': 40, 'CO': 12,
            'NO2': 110, 'SO2': 80, 'Temperature': 30, 'Humidity': 55
        },
        'Severe Pollution': {
            'PM2.5': 160, 'PM10': 300, 'O3': 90, 'CO': 15,
            'NO2': 200, 'SO2': 150, 'Temperature': 35, 'Humidity': 45
        }
    }
    
    results = []
    
    for scenario_name, values in scenarios.items():
        print(f"\n{'─'*70}")
        print(f"📍 Scenario: {scenario_name}")
        print(f"{'─'*70}")
        
        # Prepare data
        test_data = values.copy()
        
        # Add engineered features
        if 'PM_ratio' in feature_names:
            test_data['PM_ratio'] = test_data['PM2.5'] / test_data['PM10']
        if 'Pollution_Index' in feature_names:
            test_data['Pollution_Index'] = (
                test_data['PM2.5'] * 0.35 + test_data['PM10'] * 0.25 +
                test_data['O3'] * 0.15 + test_data['NO2'] * 0.10 +
                test_data['SO2'] * 0.10 + test_data['CO'] * 0.05
            )
        if 'Temp_Humidity' in feature_names:
            test_data['Temp_Humidity'] = test_data['Temperature'] * test_data['Humidity'] / 100
        
        # Add temporal features (default values)
        if 'Hour' in feature_names:
            test_data['Hour'] = 18 if 'Rush Hour' in scenario_name else 14
        if 'DayOfWeek' in feature_names:
            test_data['DayOfWeek'] = 2
        if 'Month' in feature_names:
            test_data['Month'] = 12
        if 'Is_Weekend' in feature_names:
            test_data['Is_Weekend'] = 0
        if 'Is_Rush_Hour' in feature_names:
            test_data['Is_Rush_Hour'] = 1 if 'Rush Hour' in scenario_name else 0
        
        # Create DataFrame
        sample = pd.DataFrame({k: [v] for k, v in test_data.items()})
        sample = sample[feature_names]
        
        # Predict
        pred = model.predict(sample)[0]
        proba = model.predict_proba(sample)[0]
        label = le.inverse_transform([pred])[0]
        
        # Display key pollutants
        print(f"   PM2.5: {values['PM2.5']:.1f} | PM10: {values['PM10']:.1f} | "
              f"O3: {values['O3']:.1f} | NO2: {values['NO2']:.1f}")
        print(f"\n   🎯 Prediction: {label} (confidence: {proba.max():.1%})")
        
        results.append({
            'Scenario': scenario_name,
            'Predicted': label,
            'Confidence': proba.max()
        })
    
    # Summary
    print(f"\n{'='*70}")
    print("📊 SUMMARY")
    print(f"{'='*70}")
    print(f"\n{'Scenario':<30} {'Prediction':<25} {'Confidence':>12}")
    print("─" * 70)
    for r in results:
        print(f"{r['Scenario']:<30} {r['Predicted']:<25} {r['Confidence']:>11.1%}")


# ==============================
# RUN ALL
# ==============================
if __name__ == "__main__":
    import sys
    
    # Check if data file exists
    csv_file = "datasets/air_quality_data.csv"
    
    if len(sys.argv) > 1:
        csv_file = sys.argv[1]
    
    print("\n" + "="*70)
    print("🌍 AIR QUALITY PREDICTION MODEL - TRAINING & EVALUATION")
    print("="*70)
    print(f"📂 Data file: {csv_file}")
    
    try:
        # 1. Train models
        model, results, features, label_encoder = main(csv_file, use_smote=True)
        
        # 2. Demo prediction
        predict_demo()
        
        # 3. Test scenarios
        test_scenarios()
        
        print("\n" + "="*70)
        print("✅ ALL TASKS COMPLETED SUCCESSFULLY!")
        print("="*70)
        print("\n📁 Output files:")
        print("   - air_quality_model.pkl (trained model)")
        print("   - model_comparison.png (visualization)")
        
    except FileNotFoundError:
        print(f"\n❌ Error: File '{csv_file}' not found!")
        print("Usage: python train_model.py [path_to_csv]")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()