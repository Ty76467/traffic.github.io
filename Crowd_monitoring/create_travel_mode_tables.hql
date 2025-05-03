-- 创建地铁站数据表
CREATE TABLE IF NOT EXISTS subway_stations (
    station_id STRING,
    station_name STRING,
    longitude DOUBLE,
    latitude DOUBLE
)
STORED AS ORC;

-- 创建出行方式分析结果表
CREATE TABLE IF NOT EXISTS travel_mode_results (
    user_id STRING,
    travel_mode STRING,
    avg_speed DOUBLE,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    points_count INT
)
PARTITIONED BY (dt STRING)
STORED AS ORC; 