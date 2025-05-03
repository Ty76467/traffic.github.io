-- 创建移动信令数据表
CREATE TABLE IF NOT EXISTS mobile_signals (
    user_id STRING,
    base_station_id STRING,
    timestamp BIGINT,
    longitude DOUBLE,
    latitude DOUBLE
)
PARTITIONED BY (dt STRING)
STORED AS ORC;

-- 创建出行驻留分析结果表
CREATE TABLE IF NOT EXISTS travel_analysis_results (
    user_id STRING,
    stay_point_id STRING,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    longitude DOUBLE,
    latitude DOUBLE,
    cluster_id INT,
    points_count INT
)
PARTITIONED BY (dt STRING)
STORED AS ORC; 