import pandas as pd
import json
import os
import re
import numpy as np
from scipy.interpolate import splprep, splev

def clean_coordinate_string(value):
    # 移除特殊字符（*、"等）和多余的空格
    cleaned = re.sub(r'[*"\'\n\r]', '', str(value))
    cleaned = re.sub(r'\s+', ' ', cleaned.strip())
    return cleaned

def smooth_boundary(coordinates, smoothing_factor=0.1):
    """
    使用样条插值平滑边界
    coordinates: 原始坐标点列表
    smoothing_factor: 平滑因子，值越大平滑效果越明显
    """
    if len(coordinates) < 4:
        return coordinates
        
    # 分离经纬度
    lngs = [coord[0] for coord in coordinates]
    lats = [coord[1] for coord in coordinates]
    
    # 创建参数化变量
    t = np.linspace(0, 1, len(coordinates))
    
    # 对经度和纬度分别进行样条插值
    try:
        # 经度插值
        tck_lng, u_lng = splprep([t], [lngs], s=smoothing_factor, k=3)
        # 纬度插值
        tck_lat, u_lat = splprep([t], [lats], s=smoothing_factor, k=3)
        
        # 生成更多的点
        t_new = np.linspace(0, 1, len(coordinates) * 2)
        
        # 计算新的坐标点
        lng_new = splev(t_new, tck_lng)[0]
        lat_new = splev(t_new, tck_lat)[0]
        
        # 组合新的坐标点
        smoothed_coords = [[lng, lat] for lng, lat in zip(lng_new, lat_new)]
        
        # 确保首尾相连
        if smoothed_coords[0] != smoothed_coords[-1]:
            smoothed_coords.append(smoothed_coords[0])
            
        return smoothed_coords
    except Exception as e:
        print(f"平滑处理时出错: {str(e)}")
        return coordinates

def parse_coordinates(value):
    try:
        cleaned_value = clean_coordinate_string(value)
        coordinates = []
        
        # 检查是否是包含多个坐标对的长字符串
        if ',' in cleaned_value and len(cleaned_value.split(',')) > 2:
            print(f"尝试解析多坐标字符串: {cleaned_value[:100]}...")
            # 将字符串分割成坐标对
            coord_pairs = cleaned_value.split(',')
            for pair in coord_pairs:
                parts = pair.strip().split()
                if len(parts) >= 2:
                    try:
                        lng = float(parts[0].strip())
                        lat = float(parts[1].strip())
                        if 100 < lng < 110 and 25 < lat < 30:  # 贵阳市的大致经纬度范围
                            coordinates.append([lng, lat])
                        else:
                            print(f"坐标超出范围: [{lng}, {lat}]")
                    except ValueError as e:
                        print(f"无法解析坐标对: {pair}, 错误: {str(e)}")
                        continue
            if coordinates:
                print(f"成功从长字符串中解析出 {len(coordinates)} 个坐标")
                return coordinates
            else:
                print("未能从长字符串中解析出任何有效坐标")
        
        # 尝试解析单个坐标对
        if ',' in cleaned_value:
            parts = cleaned_value.split(',')
            if len(parts) >= 2:
                try:
                    lat = float(parts[0].strip())
                    lng = float(parts[1].strip())
                    if 100 < lng < 110 and 25 < lat < 30:
                        return [[lng, lat]]
                    else:
                        print(f"坐标超出范围: [{lng}, {lat}]")
                except ValueError as e:
                    print(f"无法解析逗号分隔的坐标: {cleaned_value}, 错误: {str(e)}")
        else:
            parts = cleaned_value.split()
            if len(parts) >= 2:
                try:
                    lng = float(parts[0].strip())
                    lat = float(parts[1].strip())
                    if 100 < lng < 110 and 25 < lat < 30:
                        return [[lng, lat]]
                    else:
                        print(f"坐标超出范围: [{lng}, {lat}]")
                except ValueError as e:
                    print(f"无法解析空格分隔的坐标: {cleaned_value}, 错误: {str(e)}")
                
        if not coordinates:
            print(f"坐标格式不正确: {cleaned_value[:100]}...")
        return None
    except Exception as e:
        print(f"解析坐标时发生错误: {str(e)}")
        print(f"原始值: {value[:100]}...")
        return None

def read_excel_coordinates(file_path):
    try:
        print(f"\n开始处理文件: {file_path}")
        # 读取Excel文件的所有内容
        df = pd.read_excel(file_path, header=None, engine='openpyxl')
        coordinates = []
        
        print(f"Excel文件大小: {len(df)} 行 x {len(df.columns)} 列")
        
        # 遍历所有单元格
        for row in range(len(df)):
            for col in range(len(df.columns)):
                value = df.iloc[row, col]
                if pd.notna(value):  # 确保值不是NaN
                    print(f"\n处理单元格 [{row+1}, {col+1}] 的值:")
                    print(f"原始值: {str(value)[:100]}...")
                    coords = parse_coordinates(value)
                    if coords:
                        coordinates.extend(coords)
                        print(f"从该单元格成功解析 {len(coords)} 个坐标")
        
        # 确保多边形闭合（首尾坐标相同）
        if coordinates and coordinates[0] != coordinates[-1]:
            coordinates.append(coordinates[0])
            print(f"添加闭合点: {coordinates[-1]}")
            
        print(f"文件处理完成，共获取 {len(coordinates)} 个坐标点")
        
        # 如果没有找到任何坐标，尝试打印文件的前几行内容
        if not coordinates:
            print("\n文件内容预览:")
            print(df.head())
            
        return coordinates
    except Exception as e:
        print(f"读取文件 {file_path} 时出错: {str(e)}")
        return None

def read_txt_coordinates(file_path):
    try:
        print(f"\n开始处理文件: {file_path}")
        coordinates = []
        
        # 读取txt文件
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        print(f"文件共有 {len(lines)} 行")
        
        # 处理每一行
        for i, line in enumerate(lines):
            if line.strip():  # 确保行不是空的
                print(f"\n处理第 {i+1} 行:")
                print(f"原始值: {line[:100]}...")
                coords = parse_coordinates(line)
                if coords:
                    coordinates.extend(coords)
                    print(f"从该行成功解析 {len(coords)} 个坐标")
        
        # 确保多边形闭合（首尾坐标相同）
        if coordinates and coordinates[0] != coordinates[-1]:
            coordinates.append(coordinates[0])
            print(f"添加闭合点: {coordinates[-1]}")
            
        print(f"文件处理完成，共获取 {len(coordinates)} 个坐标点")
        
        # 如果没有找到任何坐标，尝试打印文件的前几行内容
        if not coordinates:
            print("\n文件内容预览:")
            for i, line in enumerate(lines[:5]):
                print(f"第 {i+1} 行: {line}")
            
        return coordinates
    except Exception as e:
        print(f"读取文件 {file_path} 时出错: {str(e)}")
        return None

def generate_geojson():
    # 定义区域和对应的文件
    excel_regions = {
        '乌当区': '乌当区.xlsx',
        '开阳县': '开阳县.xlsx'
    }
    
    txt_regions = {
        '白云区': 'E:\\cursor\\交通大数据\\白云区.txt',
        '观山湖区': 'E:\\cursor\\交通大数据\\观山湖区.txt',
        '修文县': 'E:\\cursor\\交通大数据\\修文县.txt',
        '云岩区': 'E:\\cursor\\交通大数据\\云岩区.txt',
        '息烽县': 'E:\\cursor\\交通大数据\\息烽县.txt',
        '清镇市': 'E:\\cursor\\交通大数据\\清镇市.txt',
        '花溪区': 'E:\\cursor\\交通大数据\\花溪区.txt'
    }
    
    # 创建GeoJSON结构
    geojson = {
        "type": "FeatureCollection",
        "features": []
    }
    
    # 处理Excel文件
    for region_name, file_path in excel_regions.items():
        print(f"\n处理 {region_name} (Excel文件)...")
        coordinates = read_excel_coordinates(file_path)
        if coordinates:
            feature = {
                "type": "Feature",
                "properties": {
                    "name": region_name
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [coordinates]
                }
            }
            geojson["features"].append(feature)
            print(f"已成功处理 {region_name} 的数据，坐标点数量: {len(coordinates)}")
        else:
            print(f"无法处理 {region_name} 的数据")
    
    # 处理txt文件
    for region_name, file_path in txt_regions.items():
        print(f"\n处理 {region_name} (txt文件)...")
        coordinates = read_txt_coordinates(file_path)
        if coordinates:
            feature = {
                "type": "Feature",
                "properties": {
                    "name": region_name
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [coordinates]
                }
            }
            geojson["features"].append(feature)
            print(f"已成功处理 {region_name} 的数据，坐标点数量: {len(coordinates)}")
        else:
            print(f"无法处理 {region_name} 的数据")
    
    # 保存结果到GeoJSON文件
    print("\n保存GeoJSON数据到文件...")
    with open('guiyang.json', 'w', encoding='utf-8') as f:
        json.dump(geojson, f, ensure_ascii=False, indent=2)
    
    print(f"GeoJSON数据已保存到 guiyang.json 文件，共包含 {len(geojson['features'])} 个区域的数据")
    
    # 打印每个区域的坐标点数量
    print("\n各区域坐标点数量统计:")
    for feature in geojson["features"]:
        region_name = feature["properties"]["name"]
        coords = feature["geometry"]["coordinates"][0]
        print(f"{region_name}: {len(coords)} 个坐标点")

if __name__ == "__main__":
    generate_geojson() 