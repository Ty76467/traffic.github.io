-- 创建用户轨迹数据表
CREATE TABLE IF NOT EXISTS user_trajectories (
    user_id STRING,
    timestamp BIGINT,
    longitude DOUBLE,
    latitude DOUBLE,
    stay_duration INT
)
PARTITIONED BY (dt STRING)
STORED AS ORC;

-- 创建职住分布分析结果表
CREATE TABLE IF NOT EXISTS work_live_analysis_results (
    user_id STRING,
    location_type STRING,  -- 'workplace' or 'residence'
    longitude DOUBLE,
    latitude DOUBLE,
    night_duration INT,
    work_duration INT,
    visit_count INT
)
PARTITIONED BY (dt STRING)
STORED AS ORC; 