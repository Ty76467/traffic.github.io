from kafka import KafkaProducer
import json
import random
import time
from datetime import datetime

# 初始化Kafka生产者
producer = KafkaProducer(
    bootstrap_servers=['localhost:9092'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

# 模拟数据生成
def generate_mock_data():
    # 模拟太原街等区域
    areas = {
        "taiyuan_street": {
            "center": [106.65, 26.65],
            "radius": 0.01
        },
        "shopping_mall": {
            "center": [106.67, 26.67],
            "radius": 0.008
        },
        "scenic_spot": {
            "center": [106.63, 26.63],
            "radius": 0.012
        }
    }
    
    # 随机选择一个区域
    area_name = random.choice(list(areas.keys()))
    area = areas[area_name]
    
    # 在区域内随机生成点
    angle = random.uniform(0, 2 * 3.14159)
    radius = random.uniform(0, area["radius"])
    longitude = area["center"][0] + radius * random.uniform(-1, 1)
    latitude = area["center"][1] + radius * random.uniform(-1, 1)
    
    return {
        "user_id": f"user_{random.randint(1000, 9999)}",
        "timestamp": datetime.now().isoformat(),
        "longitude": longitude,
        "latitude": latitude
    }

# 持续发送数据
while True:
    try:
        # 生成模拟数据
        data = generate_mock_data()
        
        # 发送到Kafka
        producer.send('mobile_signals', value=data)
        
        # 控制发送频率
        time.sleep(0.1)  # 每秒发送10条数据
        
    except Exception as e:
        print(f"发送数据失败: {e}")
        time.sleep(1)  # 出错时等待1秒后重试 