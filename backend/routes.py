# API路由
from flask import Blueprint, request, jsonify
from backend.models import User
from backend.db import db

# 创建蓝图
api_bp = Blueprint('api', __name__, url_prefix='/api')

@api_bp.route('/users', methods=['GET'])
def get_users():
    """获取所有用户"""
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@api_bp.route('/users/<string:id>', methods=['GET'])
def get_user(id):
    """获取单个用户"""
    user = User.query.get(id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict())

@api_bp.route('/users', methods=['POST'])
def create_user():
    """创建用户"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    # 检查必填字段
    required_fields = ['id', 'name', 'role']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400

    # 检查用户是否已存在
    existing_user = User.query.get(data['id'])
    if existing_user:
        return jsonify({'error': 'User already exists'}), 400

    # 创建新用户
    new_user = User(
        id=data['id'],
        name=data['name'],
        role=data['role'],
        avatar_url=data.get('avatar_url'),
        password=data.get('password')
    )

    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify(new_user.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/users/<string:id>', methods=['PUT'])
def update_user(id):
    """更新用户"""
    user = User.query.get(id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    # 更新用户信息
    if 'name' in data:
        user.name = data['name']
    if 'role' in data:
        user.role = data['role']
    if 'avatar_url' in data:
        user.avatar_url = data['avatar_url']
    if 'password' in data:
        user.password = data['password']

    try:
        db.session.commit()
        return jsonify(user.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/users/<string:id>', methods=['DELETE'])
def delete_user(id):
    """删除用户"""
    user = User.query.get(id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/login', methods=['POST'])
def login():
    """用户登录"""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    # 检查必填字段
    if 'id' not in data:
        return jsonify({'error': 'Missing required field: id'}), 400

    # 查找用户
    user = User.query.get(data['id'])
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401

    # 这里可以添加密码验证逻辑
    # if user.password != data.get('password'):
    #     return jsonify({'error': 'Invalid credentials'}), 401

    return jsonify({
        'success': True,
        'user': user.to_dict()
    })
