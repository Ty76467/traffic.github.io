from flask import Flask, jsonify, request
from flask_cors import CORS
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import random

app = Flask(__name__)
CORS(app)

# 模拟路口数据
INTERSECTIONS = {
    'intersection1': {
        'name': '贵阳大道-北京路交叉口',
        'coordinates': [106.713478, 26.578343],
        'lanes': {
            'north': {'flow': 0, 'queue': 0},
            'south': {'flow': 0, 'queue': 0},
            'east': {'flow': 0, 'queue': 0},
            'west': {'flow': 0, 'queue': 0}
        }
    },
    'intersection2': {
        'name': '中华路-延安路交叉口',
        'coordinates': [106.715478, 26.580343],
        'lanes': {
            'north': {'flow': 0, 'queue': 0},
            'south': {'flow': 0, 'queue': 0},
            'east': {'flow': 0, 'queue': 0},
            'west': {'flow': 0, 'queue': 0}
        }
    }
}

class GeneticAlgorithm:
    def __init__(self, population_size=50, generations=100):
        self.population_size = population_size
        self.generations = generations
        self.mutation_rate = 0.1
        
    def initialize_population(self):
        """初始化种群，每个个体包含四个方向的绿灯时长"""
        return np.random.randint(20, 60, size=(self.population_size, 4))
    
    def fitness(self, individual, traffic_data):
        """计算适应度，考虑等待时间和通行效率"""
        total_waiting_time = 0
        total_throughput = 0
        
        for i, direction in enumerate(['north', 'south', 'east', 'west']):
            green_time = individual[i]
            flow = traffic_data[direction]['flow']
            queue = traffic_data[direction]['queue']
            
            # 计算等待时间
            waiting_time = queue * (120 - green_time)  # 假设周期为120秒
            total_waiting_time += waiting_time
            
            # 计算通行量
            throughput = min(flow * green_time, queue)
            total_throughput += throughput
        
        # 适应度函数：最大化通行量，最小化等待时间
        return total_throughput / (1 + total_waiting_time)
    
    def crossover(self, parent1, parent2):
        """单点交叉"""
        point = np.random.randint(1, len(parent1))
        child1 = np.concatenate([parent1[:point], parent2[point:]])
        child2 = np.concatenate([parent2[:point], parent1[point:]])
        return child1, child2
    
    def mutate(self, individual):
        """变异操作"""
        for i in range(len(individual)):
            if random.random() < self.mutation_rate:
                individual[i] = np.random.randint(20, 60)
        return individual
    
    def optimize(self, traffic_data):
        """运行遗传算法优化"""
        population = self.initialize_population()
        
        for _ in range(self.generations):
            # 计算适应度
            fitness_scores = [self.fitness(ind, traffic_data) for ind in population]
            
            # 选择
            selected_indices = np.argsort(fitness_scores)[-self.population_size//2:]
            selected_population = population[selected_indices]
            
            # 生成新一代
            new_population = []
            while len(new_population) < self.population_size:
                parent1, parent2 = random.sample(list(selected_population), 2)
                child1, child2 = self.crossover(parent1, parent2)
                child1 = self.mutate(child1)
                child2 = self.mutate(child2)
                new_population.extend([child1, child2])
            
            population = np.array(new_population)
        
        # 返回最优解
        best_index = np.argmax([self.fitness(ind, traffic_data) for ind in population])
        return population[best_index]

@app.route('/api/intersections', methods=['GET'])
def get_intersections():
    """获取所有路口信息"""
    return jsonify({
        'intersections': {k: {'name': v['name'], 'coordinates': v['coordinates']} 
                         for k, v in INTERSECTIONS.items()}
    })

@app.route('/api/traffic/<intersection_id>', methods=['GET'])
def get_traffic_data(intersection_id):
    """获取指定路口的实时交通数据"""
    if intersection_id not in INTERSECTIONS:
        return jsonify({'error': '路口不存在'}), 404
    
    # 模拟实时数据更新
    intersection = INTERSECTIONS[intersection_id]
    for direction in intersection['lanes'].values():
        direction['flow'] = random.randint(10, 50)  # 车流量
        direction['queue'] = random.randint(0, 20)  # 排队长度
    
    return jsonify({
        'lanes': intersection['lanes'],
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/optimize/<intersection_id>', methods=['GET'])
def optimize_signals(intersection_id):
    """优化信号灯配时"""
    if intersection_id not in INTERSECTIONS:
        return jsonify({'error': '路口不存在'}), 404
    
    # 获取当前交通数据
    traffic_data = INTERSECTIONS[intersection_id]['lanes']
    
    # 运行遗传算法
    ga = GeneticAlgorithm()
    optimal_times = ga.optimize(traffic_data)
    
    return jsonify({
        'optimal_times': {
            'north': int(optimal_times[0]),
            'south': int(optimal_times[1]),
            'east': int(optimal_times[2]),
            'west': int(optimal_times[3])
        },
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001) 