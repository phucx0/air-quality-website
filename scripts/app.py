from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import pandas as pd
import numpy as np
import os

app = Flask(__name__)
CORS(app)

MODEL_PATH = './air_quality_final_model.pkl'
loaded_data = None

# Load model khi khởi động
if os.path.exists(MODEL_PATH):
    with open(MODEL_PATH, 'rb') as f:
        loaded_data = pickle.load(f)
    print("Model & Metadata loaded successfully!")
else:
    print("ERROR: File air_quality_final_model.pkl not found!")

@app.route('/api/predict', methods=['POST'])
def predict():
    if loaded_data is None:
        return jsonify({'success': False, 'error': 'Model not loaded'}), 500
    try:
        raw_json = request.get_json()
        # Hỗ trợ cả data phẳng hoặc data bọc trong key 'features'
        data = raw_json.get('features', raw_json)
        
        # Ánh xạ tên cột (Mapping)
        mapping = {'PM25': 'PM2.5', 'temp': 'Temperature', 'humidity': 'Humidity'}
        final_data = {mapping.get(k, k): v for k, v in data.items()}

        # Tạo DataFrame
        input_df = pd.DataFrame([final_data])
        features = loaded_data['features']
        
        # Bổ sung các cột thiếu (Lag/Mean/Time)
        for col in features:
            if col not in input_df.columns:
                base_col = col.split('_')[0]
                input_df[col] = input_df[base_col] if base_col in input_df.columns else 0
        
        input_df = input_df[features] # Sắp xếp cột

        # Dự đoán
        model = loaded_data['model']
        encoder = loaded_data['encoder']
        
        pred_num = model.predict(input_df)
        pred_label = encoder.inverse_transform(pred_num)[0]
        
        # Tính xác suất cho tất cả các lớp
        all_probs = model.predict_proba(input_df)[0]
        classes = encoder.classes_
        probabilities_dict = {classes[i]: float(all_probs[i]) for i in range(len(classes))}

        return jsonify({
            'success': True,
            'prediction': pred_label,
            'confidence': f"{np.max(all_probs)}",
            'all_probabilities': probabilities_dict
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)