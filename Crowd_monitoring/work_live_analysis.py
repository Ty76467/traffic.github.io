from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *
import numpy as np
from datetime import datetime, timedelta
from flask import Flask, jsonify

app = Flask(__name__)

# 初始化Spark会话
spark = SparkSession.builder \
    .appName("WorkLiveAnalysis") \
    .config("spark.sql.warehouse.dir", "/user/hive/warehouse") \
    .enableHiveSupport() \
    .getOrCreate()

def process_trajectory_data():
    """处理用户轨迹数据"""
    # 从Hive读取数据
    df = spark.sql("""
        SELECT 
            user_id,
            timestamp,
            longitude,
            latitude,
            stay_duration
        FROM user_trajectories
        WHERE dt = current_date()
    """)
    
    # 数据预处理
    df = df.withColumn("timestamp", to_timestamp(col("timestamp")))
    df = df.withColumn("hour", hour(col("timestamp")))
    return df

def identify_work_live_locations(df):
    """识别工作地和居住地"""
    # 按用户分组
    user_groups = df.groupBy("user_id")
    
    work_live_locations = []
    for user_id, group in user_groups:
        # 计算每个位置的驻留时长
        location_stats = group.groupBy("longitude", "latitude").agg(
            sum("stay_duration").alias("total_duration"),
            count("*").alias("visit_count"),
            collect_list("hour").alias("hours")
        ).collect()
        
        for loc in location_stats:
            # 计算夜间驻留时长（22:00-6:00）
            night_hours = [h for h in loc["hours"] if h >= 22 or h <= 6]
            night_duration = len(night_hours) * 3600  # 转换为秒
            
            # 计算工作日驻留时长（9:00-18:00）
            work_hours = [h for h in loc["hours"] if 9 <= h <= 18]
            work_duration = len(work_hours) * 3600  # 转换为秒
            
            # 判断是否为居住地（夜间驻留>4小时）
            is_residence = night_duration >= 14400  # 4小时 = 14400秒
            
            # 判断是否为工作地（工作日驻留>6小时）
            is_workplace = work_duration >= 21600  # 6小时 = 21600秒
            
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

def calculate_density(work_live_locations, grid_size=0.01):
    """计算区域人口密度"""
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

@app.route('/api/work_live_analysis', methods=['GET'])
def get_work_live_analysis():
    """获取职住分布分析数据"""
    try:
        # 处理轨迹数据
        df = process_trajectory_data()
        
        # 识别职住地
        work_live_locations = identify_work_live_locations(df)
        
        # 计算密度
        density_grid = calculate_density(work_live_locations)
        
        # 准备返回数据
        result = {
            "work_live_locations": work_live_locations,
            "density_grid": density_grid,
            "timestamp": datetime.now().isoformat()
        }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001) 