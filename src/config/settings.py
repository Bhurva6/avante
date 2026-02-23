"""
Application Configuration Settings
"""
import os
from datetime import datetime

# Application Settings
APP_NAME = "Orthopedic Implant Analytics Dashboard"
APP_VERSION = "2.0.0"

# Cache Configuration
REDIS_URL = os.getenv('REDIS_URL')
CACHE_DEFAULT_TIMEOUT = 300

if REDIS_URL:
    CACHE_CONFIG = {
        'CACHE_TYPE': 'RedisCache',
        'CACHE_REDIS_URL': REDIS_URL,
        'CACHE_DEFAULT_TIMEOUT': CACHE_DEFAULT_TIMEOUT
    }
    print("✅ Redis cache enabled")
else:
    CACHE_CONFIG = {
        'CACHE_TYPE': 'SimpleCache',
        'CACHE_DEFAULT_TIMEOUT': CACHE_DEFAULT_TIMEOUT,
        'CACHE_THRESHOLD': 100
    }
    print("⚠️ Using SimpleCache (Redis not available)")

# Date Settings
DEFAULT_DATE_FORMAT = "%d-%m-%Y"
DISPLAY_DATE_FORMAT = "%Y-%m-%d"

# Chart Settings
DEFAULT_CHART_HEIGHT = 400
DEFAULT_TOP_N = 10
CHART_COLORS = {
    'primary': '#2ECC71',
    'secondary': '#3498DB',
    'accent': '#E74C3C',
    'warning': '#F39C12'
}

# Map Settings
INDIA_CENTER_LAT = 22.5937
INDIA_CENTER_LON = 78.9629
DEFAULT_MAP_ZOOM = 5

# User Role Permissions
ROLES = {
    'superadmin': {
        'can_create_users': True,
        'can_edit_users': True,
        'can_delete_users': True,
        'can_access_all_dashboards': True,
        'can_access_all_states': True
    },
    'admin': {
        'can_create_users': True,
        'can_edit_users': True,
        'can_delete_users': False,
        'can_access_all_dashboards': True,
        'can_access_all_states': True
    },
    'user': {
        'can_create_users': False,
        'can_edit_users': False,
        'can_delete_users': False,
        'can_access_all_dashboards': False,
        'can_access_all_states': False
    }
}

# Email Configuration
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SENDER_EMAIL = os.getenv('SENDER_EMAIL', 'noreply@avante.com')
SENDER_PASSWORD = os.getenv('SENDER_PASSWORD', '')

# Database Settings
USER_DB_FILE = 'users_database.json'

# API Settings
AVANTE_API_BASE_URL = "http://avantemedicals.com/API/api.php"
IOSPL_API_BASE_URL = "http://avantemedicals.com/API/api.php"

# Logging
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
