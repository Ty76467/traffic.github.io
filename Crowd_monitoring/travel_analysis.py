from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *
import numpy as np
from sklearn.cluster import KMeans
import json
from flask import Flask, jsonify
from datetime import datetime, timedelta

app = Flask(__name__)

# 初始化Spark会话
spark = SparkSession.builder \
    .appName("TravelAnalysis") \
    .config("spark.sql.warehouse.dir", "/user/hive/warehouse") \
    .enableHiveSupport() \
    .getOrCreate()

def process_mobile_data():
    """处理移动信令数据"""
    # 从Hive读取数据
    df = spark.sql("""
        SELECT 
            user_id,
            base_station_id,
            timestamp,
            longitude,
            latitude
        FROM mobile_signals
        WHERE dt = current_date()
    """)
    
    # 数据预处理
    df = df.withColumn("timestamp", to_timestamp(col("timestamp")))
    return df

def identify_stay_points(df, time_threshold=1800, distance_threshold=200):
    """识别驻留点"""
    # 按用户分组
    user_groups = df.groupBy("user_id")
    
    stay_points = []
    for user_id, group in user_groups:
        points = group.orderBy("timestamp").collect()
        
        # 初始化驻留点
        current_stay = {
            "start_time": points[0]["timestamp"],
            "end_time": points[0]["timestamp"],
            "longitude": points[0]["longitude"],
            "latitude": points[0]["latitude"],
            "points": [points[0]]
        }
        
        for i in range(1, len(points)):
            point = points[i]
            time_diff = (point["timestamp"] - current_stay["end_time"]).total_seconds()
            distance = calculate_distance(
                current_stay["longitude"], current_stay["latitude"],
                point["longitude"], point["latitude"]
            )
            
            if time_diff <= time_threshold and distance <= distance_threshold:
                current_stay["end_time"] = point["timestamp"]
                current_stay["points"].append(point)
            else:
                if len(current_stay["points"]) >= 3:  # 至少3个点才认为是有效驻留
                    stay_points.append(current_stay)
                current_stay = {
                    "start_time": point["timestamp"],
                    "end_time": point["timestamp"],
                    "longitude": point["longitude"],
                    "latitude": point["latitude"],
                    "points": [point]
                }
    
    return stay_points

def calculate_distance(lon1, lat1, lon2, lat2):
    """计算两点之间的距离（米）"""
    R = 6371000  # 地球半径（米）
    phi1 = np.radians(lat1)
    phi2 = np.radians(lat2)
    delta_phi = np.radians(lat2 - lat1)
    delta_lambda = np.radians(lon2 - lon1)
    
    a = np.sin(delta_phi/2)**2 + np.cos(phi1) * np.cos(phi2) * np.sin(delta_lambda/2)**2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
    return R * c

def cluster_stay_points(stay_points, n_clusters=5):
    """对驻留点进行聚类"""
    if not stay_points:
        return []
    
    # 准备聚类数据
    X = np.array([[p["longitude"], p["latitude"]] for p in stay_points])
    
    # 使用K-means聚类
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    kmeans.fit(X)
    
    # 为每个驻留点添加聚类标签
    for i, point in enumerate(stay_points):
        point["cluster"] = int(kmeans.labels_[i])
    
    return stay_points

@app.route('/api/travel_analysis', methods=['GET'])
def get_travel_analysis():
    """获取出行驻留分析数据"""
    try:
        # 处理移动信令数据
        df = process_mobile_data()
        
        # 识别驻留点
        stay_points = identify_stay_points(df)
        
        # 聚类分析
        clustered_points = cluster_stay_points(stay_points)
        
        # 准备返回数据
        result = {
            "stay_points": clustered_points,
            "timestamp": datetime.now().isoformat()
        }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000) 