from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *
import numpy as np
from datetime import datetime
from flask import Flask, jsonify
from flask_cors import CORS
import math

app = Flask(__name__)
CORS(app)

# 初始化Spark会话
spark = SparkSession.builder \
    .appName("TravelModeAnalysis") \
    .config("spark.sql.warehouse.dir", "/user/hive/warehouse") \
    .enableHiveSupport() \
    .getOrCreate()

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

def identify_travel_mode(df):
    """识别出行方式"""
    # 按用户分组
    user_groups = df.groupBy("user_id")
    
    travel_modes = []
    for user_id, group in user_groups:
        # 按时间排序
        points = group.orderBy("timestamp").collect()
        
        if len(points) < 2:
            continue
            
        # 计算速度
        speeds = []
        for i in range(1, len(points)):
            prev = points[i-1]
            curr = points[i]
            
            # 计算距离
            distance = calculate_distance(
                prev["longitude"], prev["latitude"],
                curr["longitude"], curr["latitude"]
            )
            
            # 计算时间差（秒）
            time_diff = (curr["timestamp"] - prev["timestamp"]).total_seconds()
            
            if time_diff > 0:
                speed = distance / time_diff  # 米/秒
                speed_kmh = speed * 3.6  # 转换为km/h
                speeds.append(speed_kmh)
        
        if not speeds:
            continue
            
        # 计算平均速度
        avg_speed = sum(speeds) / len(speeds)
        
        # 根据速度判断出行方式
        if avg_speed > 20:  # 大于20km/h
            mode = "car"
        elif avg_speed < 12:  # 小于12km/h
            mode = "walking"
        else:
            mode = "bus"
        
        # 检查是否在地铁站附近
        for point in points:
            if is_near_subway_station(point["longitude"], point["latitude"]):
                mode = "subway"
                break
        
        travel_modes.append({
            "user_id": user_id,
            "mode": mode,
            "avg_speed": avg_speed,
            "points": [{
                "longitude": p["longitude"],
                "latitude": p["latitude"],
                "timestamp": p["timestamp"].isoformat()
            } for p in points]
        })
    
    return travel_modes

def is_near_subway_station(longitude, latitude, distance_threshold=500):
    """检查是否在地铁站附近（500米内）"""
    # 从Hive读取地铁站数据
    subway_stations = spark.sql("""
        SELECT longitude, latitude
        FROM subway_stations
    """).collect()
    
    for station in subway_stations:
        distance = calculate_distance(
            longitude, latitude,
            station["longitude"], station["latitude"]
        )
        if distance <= distance_threshold:
            return True
    return False

def calculate_mode_statistics(travel_modes):
    """计算出行方式统计"""
    mode_counts = {
        "car": 0,
        "bus": 0,
        "subway": 0,
        "walking": 0
    }
    
    for mode_data in travel_modes:
        mode_counts[mode_data["mode"]] += 1
    
    total = sum(mode_counts.values())
    if total == 0:
        return mode_counts
    
    return {
        mode: {
            "count": count,
            "percentage": round(count / total * 100, 1)
        }
        for mode, count in mode_counts.items()
    }

@app.route('/api/travel_mode_analysis', methods=['GET'])
def get_travel_mode_analysis():
    """获取出行方式分析数据"""
    try:
        # 从Hive读取轨迹数据
        df = spark.sql("""
            SELECT 
                user_id,
                timestamp,
                longitude,
                latitude
            FROM user_trajectories
            WHERE dt = current_date()
        """)
        
        # 数据预处理
        df = df.withColumn("timestamp", to_timestamp(col("timestamp")))
        
        # 识别出行方式
        travel_modes = identify_travel_mode(df)
        
        # 计算统计信息
        mode_stats = calculate_mode_statistics(travel_modes)
        
        # 准备返回数据
        result = {
            "travel_modes": travel_modes,
            "statistics": mode_stats,
            "timestamp": datetime.now().isoformat()
        }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5003) 