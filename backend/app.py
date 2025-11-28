# Flask应用入口
from flask import Flask
from backend.config import config
from backend.db import db
from backend.routes import api_bp

# 创建应用工厂
def create_app(config_name='default'):
    """创建Flask应用"""
    app = Flask(__name__)
    
    # 加载配置
    app.config.from_object(config[config_name])
    
    # 初始化数据库
    db.init_app(app)
    
    # 创建数据库表
    with app.app_context():
        db.create_all()
        
        # 初始化默认用户数据
        from backend.models import User
        if not User.query.first():
            default_users = [
                {
                    'id': 'u1',
                    'name': 'Alice Researcher',
                    'role': 'PARTICIPANT',
                    'avatar_url': 'https://picsum.photos/id/1/200/200',
                    'password': 'password1'
                },
                {
                    'id': 'u2',
                    'name': 'Bob Subject',
                    'role': 'PARTICIPANT',
                    'avatar_url': 'https://picsum.photos/id/2/200/200',
                    'password': 'password2'
                },
                {
                    'id': 'admin1',
                    'name': 'Dr. Admin',
                    'role': 'ADMIN',
                    'avatar_url': 'https://picsum.photos/id/3/200/200',
                    'password': 'adminpassword'
                }
            ]
            
            for user_data in default_users:
                user = User(**user_data)
                db.session.add(user)
            db.session.commit()
    
    # 注册蓝图
    app.register_blueprint(api_bp)
    
    return app

# 运行应用
if __name__ == '__main__':
    app = create_app()
    app.run(host=app.config['HOST'], port=app.config['PORT'], debug=app.config['DEBUG'])
