from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import pandas as pd
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Cho phép CORS để frontend gọi được

# ==================== CÁC ĐƯỜNG DẪN MODEL CỐ ĐỊNH ====================

# QUAN TRỌNG: Đặt đường dẫn đến file model của bạn ở đây
MODEL_PATHS = {
    'default': 'air_quality_v2.pkl',  # Model mặc định
    'hanoi': 'models/hanoi_model.pkl',   # Model cho Hà Nội
    'hcm': 'models/hcm_model.pkl',       # Model cho HCM
}

# Hoặc load tất cả models trong 1 thư mục
MODELS_FOLDER = 'models'  # Thư mục chứa tất cả models

# ==================== GLOBAL VARIABLES ====================

loaded_models = {}
model_metadata = {}

# ==================== HELPER FUNCTIONS ====================

def load_model_from_file(model_path):
    """Load model từ file pkl"""
    try:
        with open(model_path, 'rb') as f:
            model_data = pickle.load(f)
        
        # Xử lý các trường hợp cấu trúc pkl khác nhau
        if isinstance(model_data, dict):
            # Nếu pkl là dict chứa model và metadata
            model = model_data.get('model')
            feature_names = model_data.get('feature_names')
            label_encoder = model_data.get('label_encoder')
        else:
            # Nếu pkl chỉ là model thuần
            model = model_data
            feature_names = None
            label_encoder = None
        
        return {
            'model': model,
            'feature_names': feature_names,
            'label_encoder': label_encoder,
            'path': model_path
        }
    except Exception as e:
        print(f"Error loading model from {model_path}: {e}")
        return None

def load_all_models_from_folder(folder_path):
    """Load tất cả models từ một thư mục"""
    if not os.path.exists(folder_path):
        print(f"Folder {folder_path} không tồn tại")
        return
    
    for filename in os.listdir(folder_path):
        if filename.endswith('.pkl'):
            model_path = os.path.join(folder_path, filename)
            model_id = filename.replace('.pkl', '')
            
            print(f"Loading model: {filename}...")
            model_data = load_model_from_file(model_path)
            
            if model_data and model_data['model']:
                loaded_models[model_id] = model_data
                model_metadata[model_id] = {
                    'filename': filename,
                    'filepath': model_path,
                    'loaded_at': datetime.now().isoformat(),
                    'model_type': type(model_data['model']).__name__,
                    'has_feature_names': model_data['feature_names'] is not None,
                    'has_label_encoder': model_data['label_encoder'] is not None
                }
                print(f"Loaded: {model_id}")
            else:
                print(f"Failed to load: {filename}")

def load_predefined_models():
    """Load các models đã định nghĩa trong MODEL_PATHS"""
    for model_id, model_path in MODEL_PATHS.items():
        if os.path.exists(model_path):
            print(f"Loading model '{model_id}' from {model_path}...")
            model_data = load_model_from_file(model_path)
            
            if model_data and model_data['model']:
                loaded_models[model_id] = model_data
                model_metadata[model_id] = {
                    'filename': os.path.basename(model_path),
                    'filepath': model_path,
                    'loaded_at': datetime.now().isoformat(),
                    'model_type': type(model_data['model']).__name__,
                    'has_feature_names': model_data['feature_names'] is not None,
                    'has_label_encoder': model_data['label_encoder'] is not None
                }
                print(f"Model '{model_id}' loaded successfully")
            else:
                print(f"Failed to load model '{model_id}'")
        else:
            print(f"Model file not found: {model_path}")

def get_category_info(category_name):
    """Trả về màu sắc và thông tin cho mỗi category"""
    categories = {
        'Tốt': {'color': 'bg-green-500', 'level': 1},
        'Trung bình': {'color': 'bg-yellow-500', 'level': 2},
        'Kém': {'color': 'bg-orange-500', 'level': 3},
        'Xấu': {'color': 'bg-red-500', 'level': 4},
        'Good': {'color': 'bg-green-500', 'level': 1},
        'Moderate': {'color': 'bg-yellow-500', 'level': 2},
        'Không tốt cho người nhạy cảm': {'color': 'bg-orange-500', 'level': 3},
        'Không tốt cho sức khỏe': {'color': 'bg-red-500', 'level': 4},
        'Rất xấu': {'color': 'bg-purple-500', 'level': 5},
        'Nguy hại': {'color': 'bg-purple-500', 'level': 6}
    }
    return categories.get(category_name, {'color': 'bg-gray-500', 'level': 0})

def extract_decision_path(model, X):
    """Trích xuất decision path từ Decision Tree"""
    try:
        # Lấy decision path
        decision_path = model.decision_path(X)
        node_indicator = decision_path.toarray()[0]
        
        # Lấy thông tin về cây
        tree = model.tree_
        feature_names = model.feature_names_in_.tolist()
        
        path_nodes = []
        nodes = np.where(node_indicator == 1)[0]
        
        for node_id in nodes[:-1]:  # Bỏ node cuối (leaf)
            feature_id = tree.feature[node_id]
            threshold = tree.threshold[node_id]
            
            if feature_id >= 0 and feature_id < len(feature_names):
                feature_name = feature_names[feature_id]
                
                # Xác định đi left hay right
                left_child = tree.children_left[node_id]
                right_child = tree.children_right[node_id]
                
                if len(nodes) > list(nodes).index(node_id) + 1:
                    next_node = nodes[list(nodes).index(node_id) + 1]
                    direction = "left" if next_node == left_child else "right"
                else:
                    direction = "left"
                
                path_nodes.append({
                    'id': int(node_id),
                    'feature': feature_name,
                    'threshold': float(threshold),
                    'direction': direction,
                    'samples': int(tree.n_node_samples[node_id])
                })
        
        return path_nodes
    except Exception as e:
        print(f"Error extracting decision path: {e}")
        return []

def build_rule_string(decision_path):
    """Tạo rule string từ decision path"""
    if not decision_path:
        return "No decision path available"
    
    rules = []
    for node in decision_path:
        operator = "≤" if node['direction'] == "left" else ">"
        rules.append(f"{node['feature']} {operator} {node['threshold']:.2f}")
    
    return "IF " + " AND ".join(rules) + " THEN [PREDICTION]"

# ==================== API ENDPOINTS ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'loaded_models': len(loaded_models),
        'models': list(loaded_models.keys())
    })

@app.route('/api/models', methods=['GET'])
def list_models():
    """Liệt kê tất cả models đã load"""
    models_info = []
    for model_id, metadata in model_metadata.items():
        models_info.append({
            'id': model_id,
            'name': metadata['filename'],
            'type': metadata['model_type'],
            'loaded_at': metadata['loaded_at'],
            'path': metadata['filepath'],
            'is_loaded': model_id in loaded_models,
            'has_feature_names': metadata['has_feature_names'],
            'has_label_encoder': metadata['has_label_encoder']
        })
    
    return jsonify({
        'models': models_info,
        'count': len(models_info)
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    """
    Dự đoán chất lượng không khí
    
    """
    try:
        data = request.json
        model_id = data.get('model_id', 'default')  # Mặc định dùng model 'default'
        features = data.get('features')
        
        if not features:
            return jsonify({'error': 'Missing features'}), 400
        
        # Kiểm tra model có tồn tại không
        if model_id not in loaded_models:
            return jsonify({
                'error': f'Model "{model_id}" not found',
                'available_models': list(loaded_models.keys()),
                'message': 'Please use one of the available models or check MODEL_PATHS in code'
            }), 404
        
        model_data = loaded_models[model_id]
        model = model_data['model']
        feature_names = model_data['feature_names']
        label_encoder = model_data['label_encoder']
        
        # Chuẩn bị dữ liệu đầu vào
        if feature_names:
            feature_order = feature_names
        else:
            # Default order
            feature_order = ['TSP', 'O3', 'CO', 'NO2', 'SO2', 'Temperature', 'Humidity']
        
        # Tạo array features theo đúng thứ tự
        X = np.array([[features.get(f, 0) for f in feature_order]])
        
        # Dự đoán
        prediction_encoded = model.predict(X)[0]
        
        # Decode prediction nếu có label encoder
        if label_encoder:
            try:
                prediction = label_encoder.inverse_transform([prediction_encoded])[0]
            except:
                prediction = str(prediction_encoded)
        else:
            prediction = str(prediction_encoded)
        
        # Tính confidence (xác suất)
        try:
            probabilities = model.predict_proba(X)[0]
            confidence = float(probabilities.max())
            all_probs = {
                str(label_encoder.inverse_transform([i])[0] if label_encoder else i): float(prob)
                for i, prob in enumerate(probabilities)
            }
        except:
            confidence = 0
            all_probs = {}
        
        # Lấy decision path (chỉ cho Decision Tree)
        decision_path = []
        rule = ""
        
        try:
            if hasattr(model, 'tree_'):  # Kiểm tra xem có phải Decision Tree không
                decision_path = extract_decision_path(model, X)
                rule = build_rule_string(decision_path)
                rule = rule.replace('[PREDICTION]', prediction)
        except Exception as e:
            print(f"Error extracting decision path: {e}")
        
        # Lấy thông tin category
        category_info = get_category_info(prediction)
        
        return jsonify({
            'success': True,
            'prediction': {
                'category': prediction,
                'confidence': confidence,
                'color': category_info['color'],
                'level': category_info['level'],
                'all_probabilities': all_probs
            },
            'decision_path': decision_path,
            'rule': rule,
            'features_used': feature_order,
            'model_id': model_id,
            'model_type': type(model).__name__,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'Prediction failed'
        }), 500

@app.route('/api/predict-batch', methods=['POST'])
def predict_batch():
    """
    Dự đoán cho nhiều samples cùng lúc
    
    Request body:
    {
        "model_id": "default",
        "samples": [
            {"TSP": 150, "PM2.5": 45, ...},
            {"TSP": 120, "PM2.5": 30, ...}
        ]
    }
    """
    try:
        data = request.json
        model_id = data.get('model_id', 'default')
        samples = data.get('samples')
        
        if not samples:
            return jsonify({'error': 'Missing samples'}), 400
        
        if model_id not in loaded_models:
            return jsonify({
                'error': f'Model "{model_id}" not found',
                'available_models': list(loaded_models.keys())
            }), 404
        
        model_data = loaded_models[model_id]
        model = model_data['model']
        feature_names = model_data['feature_names']
        label_encoder = model_data['label_encoder']
        
        feature_order = feature_names or ['TSP', 'O3', 'CO', 'NO2', 'SO2', 'Temperature', 'Humidity']
        
        # Tạo array cho tất cả samples
        X = np.array([[sample.get(f, 0) for f in feature_order] for sample in samples])
        
        # Dự đoán
        predictions_encoded = model.predict(X)
        
        # Decode predictions
        if label_encoder:
            predictions = label_encoder.inverse_transform(predictions_encoded)
        else:
            predictions = [str(p) for p in predictions_encoded]
        
        # Tính confidence
        try:
            probabilities = model.predict_proba(X)
            confidences = [float(prob.max()) for prob in probabilities]
        except:
            confidences = [0.85] * len(predictions)
        
        # Format results
        results = []
        for i, pred in enumerate(predictions):
            category_info = get_category_info(pred)
            results.append({
                'index': i,
                'category': pred,
                'confidence': confidences[i],
                'color': category_info['color'],
                'level': category_info['level']
            })
        
        return jsonify({
            'success': True,
            'predictions': results,
            'count': len(results),
            'model_id': model_id,
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'Batch prediction failed'
        }), 500

@app.route('/api/model-info/<model_id>', methods=['GET'])
def get_model_info(model_id):
    """Lấy thông tin chi tiết về model"""
    if model_id not in loaded_models:
        return jsonify({
            'error': f'Model "{model_id}" not found',
            'available_models': list(loaded_models.keys())
        }), 404
    
    model_data = loaded_models[model_id]
    model = model_data['model']
    metadata = model_metadata.get(model_id, {})
    
    info = {
        'model_id': model_id,
        'model_type': type(model).__name__,
        'metadata': metadata,
        'has_feature_names': model_data['feature_names'] is not None,
        'has_label_encoder': model_data['label_encoder'] is not None,
        'feature_names': model_data['feature_names']
    }
    
    # Thêm thông tin về Decision Tree nếu có
    if hasattr(model, 'tree_'):
        info['tree_info'] = {
            'n_features': int(model.n_features_in_),
            'n_classes': int(model.n_classes_),
            'max_depth': int(model.get_depth()),
            'n_leaves': int(model.get_n_leaves())
        }
        
        if hasattr(model, 'feature_importances_'):
            feature_names = model_data['feature_names'] or [f'feature_{i}' for i in range(model.n_features_in_)]
            importances = model.feature_importances_
            info['feature_importance'] = {
                name: float(imp) for name, imp in zip(feature_names, importances)
            }
    
    return jsonify(info)

@app.route('/api/reload-models', methods=['POST'])
def reload_models():
    """Reload tất cả models (dùng khi cập nhật file model)"""
    global loaded_models, model_metadata
    loaded_models = {}
    model_metadata = {}
    
    print("\n" + "="*60)
    print("RELOADING ALL MODELS...")
    print("="*60)
    
    # Load predefined models
    load_predefined_models()
    
    # Load models từ folder
    if os.path.exists(MODELS_FOLDER):
        load_all_models_from_folder(MODELS_FOLDER)
    
    print("="*60)
    print(f" Reloaded {len(loaded_models)} models")
    print("="*60 + "\n")
    
    return jsonify({
        'success': True,
        'message': f'Reloaded {len(loaded_models)} models',
        'models': list(loaded_models.keys())
    })

# ==================== KHỞI TẠO & RUN SERVER ====================

def initialize_models():
    """Khởi tạo và load tất cả models khi start server"""
    print("\n" + "="*60)
    print("AIR QUALITY PREDICTION API")
    print("="*60)
    print("LOADING MODELS...")
    print("="*60)
    
    # Load predefined models từ MODEL_PATHS
    load_predefined_models()
    
    # Load tất cả models từ MODELS_FOLDER
    if os.path.exists(MODELS_FOLDER):
        print(f"\nScanning folder: {MODELS_FOLDER}")
        load_all_models_from_folder(MODELS_FOLDER)
    else:
        print(f"\nFolder '{MODELS_FOLDER}' not found. Create it to auto-load models.")
    
    print("\n" + "="*60)
    print(f" LOADED {len(loaded_models)} MODELS SUCCESSFULLY")
    print("="*60)
    
    if loaded_models:
        print("\nAvailable models:")
        for model_id in loaded_models.keys():
            print(f"   • {model_id}")
    else:
        print("\nNO MODELS LOADED!")
        print("Please check:")
        print("   1. MODEL_PATHS in code")
        print("   2. Files exist at specified paths")
        print("   3. MODELS_FOLDER contains .pkl files")
    
    print("="*60)
    print("Server starting on http://localhost:5000")
    print("="*60 + "\n")

if __name__ == '__main__':
    # Load models trước khi start server
    initialize_models()
    
    # Start Flask server
    app.run(debug=True, host='0.0.0.0', port=5000)