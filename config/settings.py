from pathlib import Path


class Settings:
    """
    应用程序设置类
    """
    
    # 项目根目录
    ROOT_DIR = Path(__file__).parent.parent
    
    # 数据目录
    DATA_DIR = ROOT_DIR / "data"
    
    # 媒体目录
    MEDIA_DIRS = {
        "image": DATA_DIR / "image",
        "video": DATA_DIR / "video",
        "audio": DATA_DIR / "audio"
    }
    
    # 数据库配置
    DATABASES = {
        "users": DATA_DIR / "users.db",
        "experiments": DATA_DIR / "experiments.db"
    }
    
    # 配置文件
    CONFIG_FILES = {
        "management": DATA_DIR / "manage_config.yaml",
        "feedback": DATA_DIR / "feedback.json"
    }
    
    # 页面配置
    PAGE_CONFIG = {
        "title": "阅读实验平台",
        "icon": "📄",
        "layout": "wide"
    }
    
    # 导航配置
    NAVIGATION_PAGES = [
        {
            "path": "pages/1_homepage.py",
            "title": "主页",
            "icon": "🏠"
        },
        {
            "path": "pages/2_information.py",
            "title": "信息注册",
            "icon": "📰"
        },
        {
            "path": "pages/3_reading.py",
            "title": "材料阅读",
            "icon": "🔍"
        },
        {
            "path": "pages/4_publish.py",
            "title": "项目管理",
            "icon": "📲"
        },
    ]
    
    # 学历选项
    DEGREE_OPTIONS = [
        "初中及以下", 
        "高中、高职、中专或技校", 
        "大学专科",
        "大学本科", 
        "硕士研究生", 
        "博士研究生"
    ]

    # 职业选项
    JOB_OPTIONS = [
        "党的机关、国家机关、群众团体和社会组织、企事业单位负责人",
        "专业技术人员（如科学研究、工程技术人员等）",
        "个体工商户或私营企业主",
        "社会和生活服务人员（如批发、零售、物流、金融、房地产服务人员等）",
        "农、林、牧、渔业生产及辅助人员",
        "生产制造及有关人员（农副食品加工、纺织品加工制作人员等）",
        "学生",
    ]
    
    # 性别选项
    SEX_OPTIONS = ["男性", "女性"]
    
    # AI功能选项
    AI_FUNCTION_OPTIONS = ["文本摘要", "图像生成", "语音生成", "视频生成"]

    ADMIN_EMAIL = "jiajuntang1101@smail.nju.edu.cn"
    
    @classmethod
    def ensure_directories(cls) -> None:
        """
        确保所有必要的目录存在
        """
        # 确保数据目录存在
        cls.DATA_DIR.mkdir(exist_ok=True)
        
        # 确保媒体目录存在
        for dir_path in cls.MEDIA_DIRS.values():
            dir_path.mkdir(exist_ok=True)
    
    @classmethod
    def get_database_path(cls, db_name: str) -> str:
        """
        获取数据库文件路径
        
        Args:
            db_name: 数据库名称
            
        Returns:
            str: 数据库文件路径
        """
        return str(cls.DATABASES.get(db_name, cls.DATA_DIR / f"{db_name}.db"))
    
    @classmethod
    def get_config_path(cls, config_name: str) -> str:
        """
        获取配置文件路径
        
        Args:
            config_name: 配置名称
            
        Returns:
            str: 配置文件路径
        """
        return str(cls.CONFIG_FILES.get(config_name, cls.DATA_DIR / f"{config_name}.yaml"))


# 创建全局设置实例
settings = Settings()