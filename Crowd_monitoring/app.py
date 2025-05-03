from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *
import numpy as np
from sklearn.cluster import KMeans
from datetime import datetime, timedelta
from flask import Flask, jsonify
from flask_cors import CORS
import math

# 初始化Flask应用
app = Flask(__name__)
app.url_map.strict_slashes = False
app.url_map.default_subdomain = 'traffic'
CORS(app)

# 初始化Spark会话
spark = SparkSession.builder \
    .appName("TrafficAnalysis") \
    .config("spark.sql.warehouse.dir", "/user/hive/warehouse") \
    .enableHiveSupport() \
    .getOrCreate()

# ========== 通用工具函数 ==========
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

def calculate_density(work_live_locations, grid_size=0.01):
    """计算区域人口密度"""
    if not work_live_locations:
        return {}
        
    # 创建网格
    min_lon = min(loc["longitude"] for loc in work_live_locations)
    max_lon = max(loc["longitude"] for loc in work_live_locations)
    min_lat = min(loc["latitude"] for loc in work_live_locations)
    max_lat = max(loc["latitude"] for loc in work_live_locations)
    
    # 初始化密度网格
    density_grid = {}
    for lon in np.arange(min_lon, max_lon, grid_size):
        for lat in np.arange(min_lat, max_lat, grid_size):
            density_grid[(lon, lat)] = {
                "workplace_count": 0,
                "residence_count": 0
            }
    
    # 计算每个网格的密度
    for loc in work_live_locations:
        grid_lon = round(loc["longitude"] / grid_size) * grid_size
        grid_lat = round(loc["latitude"] / grid_size) * grid_size
        if loc["type"] == "workplace":
            density_grid[(grid_lon, grid_lat)]["workplace_count"] += 1
        else:
            density_grid[(grid_lon, grid_lat)]["residence_count"] += 1
    
    return density_grid

# ========== 出行方式分析 ==========
def identify_travel_mode(df):
    """识别出行方式"""
    user_groups = df.groupBy("user_id")
    travel_modes = []
    
    for user_id, group in user_groups:
        points = group.orderBy("timestamp").collect()
        if len(points) < 2:
            continue
            
        speeds = []
        for i in range(1, len(points)):
            prev = points[i-1]
            curr = points[i]
            distance = calculate_distance(
                prev["longitude"], prev["latitude"],
                curr["longitude"], curr["latitude"]
            )
            time_diff = (curr["timestamp"] - prev["timestamp"]).total_seconds()
            
            if time_diff > 0:
                speed = distance / time_diff * 3.6  # 转换为km/h
                speeds.append(speed)
        
        if not speeds:
            continue
            
        avg_speed = sum(speeds) / len(speeds)
        mode = "car" if avg_speed > 20 else "walking" if avg_speed < 12 else "bus"
        
        if any(is_near_subway_station(p["longitude"], p["latitude"]) for p in points):
            mode = "subway"
        
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
    """检查是否在地铁站附近"""
    subway_stations = spark.sql("""
        SELECT longitude, latitude
        FROM subway_stations
    """).collect()
    
    return any(
        calculate_distance(longitude, latitude, station["longitude"], station["latitude"]) <= distance_threshold
        for station in subway_stations
    )

# ========== 职住分布分析 ==========
def identify_work_live_locations(df):
    """识别工作地和居住地"""
    user_groups = df.groupBy("user_id")
    work_live_locations = []
    
    for user_id, group in user_groups:
        location_stats = group.groupBy("longitude", "latitude").agg(
            sum("stay_duration").alias("total_duration"),
            count("*").alias("visit_count"),
            collect_list("hour").alias("hours")
        ).collect()
        
        for loc in location_stats:
            night_hours = [h for h in loc["hours"] if h >= 22 or h <= 6]
            work_hours = [h for h in loc["hours"] if 9 <= h <= 18]
            
            night_duration = len(night_hours) * 3600
            work_duration = len(work_hours) * 3600
            
            is_residence = night_duration >= 14400
            is_workplace = work_duration >= 21600
            
            if is_residence or is_workplace:
                work_live_locations.append({
                    "user_id": user_id,
                    "longitude": loc["longitude"],
                    "latitude": loc["latitude"],
                    "type": "residence" if is_residence else "workplace",
                    "night_duration": night_duration,
                    "work_duration": work_duration,
                    "visit_count": loc["visit_count"]
                })
    
    return work_live_locations

# ========== 出行驻留分析 ==========
def identify_stay_points(df, time_threshold=1800, distance_threshold=200):
    """识别驻留点"""
    user_groups = df.groupBy("user_id")
    stay_points = []
    
    for user_id, group in user_groups:
        points = group.orderBy("timestamp").collect()
        if not points:
            continue
            
        current_stay = {
            "start_time": points[0]["timestamp"],
            "end_time": points[0]["timestamp"],
            "longitude": points[0]["longitude"],
            "latitude": points[0]["latitude"],
            "points": [points[0]]
        }
        
        for point in points[1:]:
            time_diff = (point["timestamp"] - current_stay["end_time"]).total_seconds()
            distance = calculate_distance(
                current_stay["longitude"], current_stay["latitude"],
                point["longitude"], point["latitude"]
            )
            
            if time_diff <= time_threshold and distance <= distance_threshold:
                current_stay["end_time"] = point["timestamp"]
                current_stay["points"].append(point)
            else:
                if len(current_stay["points"]) >= 3:
                    stay_points.append(current_stay)
                current_stay = {
                    "start_time": point["timestamp"],
                    "end_time": point["timestamp"],
                    "longitude": point["longitude"],
                    "latitude": point["latitude"],
                    "points": [point]
                }
    
    return stay_points

def cluster_stay_points(stay_points, n_clusters=5):
    """对驻留点进行聚类"""
    if not stay_points:
        return []
    
    X = np.array([[p["longitude"], p["latitude"]] for p in stay_points])
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    kmeans.fit(X)
    
    for i, point in enumerate(stay_points):
        point["cluster"] = int(kmeans.labels_[i])
    
    return stay_points

# ========== API路由 ==========
@app.route('/api/travel_mode_analysis', methods=['GET'])
def get_travel_mode_analysis():
    """获取出行方式分析数据"""
    try:
        df = spark.sql("""
            SELECT user_id, timestamp, longitude, latitude
            FROM user_trajectories
            WHERE dt = current_date()
        """)
        df = df.withColumn("timestamp", to_timestamp(col("timestamp")))
        
        travel_modes = identify_travel_mode(df)
        mode_stats = calculate_mode_statistics(travel_modes)
        
        return jsonify({
            "travel_modes": travel_modes,
            "statistics": mode_stats,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/work_live_analysis', methods=['GET'])
def get_work_live_analysis():
    """获取职住分布分析数据"""
    try:
        df = spark.sql("""
            SELECT user_id, timestamp, longitude, latitude, stay_duration
            FROM user_trajectories
            WHERE dt = current_date()
        """)
        df = df.withColumn("timestamp", to_timestamp(col("timestamp")))
        df = df.withColumn("hour", hour(col("timestamp")))
        
        work_live_locations = identify_work_live_locations(df)
        density_grid = calculate_density(work_live_locations)
        
        return jsonify({
            "work_live_locations": work_live_locations,
            "density_grid": density_grid,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/travel_analysis', methods=['GET'])
def get_travel_analysis():
    """获取出行驻留分析数据"""
    try:
        df = spark.sql("""
            SELECT user_id, base_station_id, timestamp, longitude, latitude
            FROM mobile_signals
            WHERE dt = current_date()
        """)
        df = df.withColumn("timestamp", to_timestamp(col("timestamp")))
        
        stay_points = identify_stay_points(df)
        clustered_points = cluster_stay_points(stay_points)
        
        return jsonify({
            "stay_points": clustered_points,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5003)