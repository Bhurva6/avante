"""Authentication module"""
from .database import user_db, UserDatabase
from .ui import create_login_page, create_signup_page, create_admin_panel

__all__ = ['user_db', 'UserDatabase', 'create_login_page', 'create_signup_page', 'create_admin_panel']
