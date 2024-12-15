import numpy as np
import librosa
from tensorflow.keras.models import load_model
import ffmpeg
import joblib
import os
import subprocess

TF_ENABLE_ONEDNN_OPTS=0

# Определение имени файла с параметрами масштабирования данных
scaler_filename = "emotion_recognition\\scaler.save"

# Загрузка модели и параметров масштабирования данных
model = load_model('emotion_recognition\\emotion_recognition_model.h5')
scaler = joblib.load(scaler_filename)

def map_emotions(emotion):
    if emotion in ['anger', 'disgust', 'fear', 'sadness']:
        return 0  # Негативные эмоции
    elif emotion in ['happiness', 'neutral', 'enthusiasm']:
        return 1  # Позитивные эмоции
    else:
        return None

def extract_features(audio_path, sr=16000):
    try:
        y, sr = librosa.load(audio_path, sr=sr)
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40)
        return np.mean(mfccs, axis=1)
    except Exception as e:
        print(f"Error processing {audio_path}: {e}")
        return None

def predict_emotion(audio_path):
    features = extract_features(audio_path)
    if features is not None:
        features = scaler.transform([features])
        features = np.expand_dims(features, axis=2)
        prediction = model.predict(features)
        predicted_class = np.argmax(prediction, axis=1)
        return 'Positive' if predicted_class[0] == 1 else 'Negative'
    else:
        return 'Error in feature extraction'