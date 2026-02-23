"""
User Database Management Module
Handles user authentication, access control, and permissions
"""
import json
import os
import hashlib
import secrets
import string
from datetime import datetime
from typing import Optional, Dict, List

# Database file path
DB_FILE = 'users_database.json'

# Default superadmin credentials
SUPERADMIN_EMAIL = 'admin@avante.com'
SUPERADMIN_PASSWORD = 'Admin@123'  # Should be changed on first login


class UserDatabase:
    """Manages user authentication and permissions"""
    
    def __init__(self):
        self.db_file = DB_FILE
        self.users = self._load_database()
        self._ensure_superadmin()
    
    def _load_database(self) -> Dict:
        """Load users from JSON file"""
        if os.path.exists(self.db_file):
            try:
                with open(self.db_file, 'r') as f:
                    return json.load(f)
            except:
                return {}
        return {}
    
    def _save_database(self):
        """Save users to JSON file"""
        with open(self.db_file, 'w') as f:
            json.dump(self.users, f, indent=2)
    
    def _ensure_superadmin(self):
        """Ensure superadmin exists"""
        if SUPERADMIN_EMAIL not in self.users:
            self.users[SUPERADMIN_EMAIL] = {
                'name': 'Super Admin',
                'email': SUPERADMIN_EMAIL,
                'password': self._hash_password(SUPERADMIN_PASSWORD),
                'role': 'superadmin',
                'dashboard_access': ['avante', 'iospl'],
                'state_access': 'all',
                'created_at': datetime.now().isoformat(),
                'status': 'active',
                'credentials_sent': True
            }
            self._save_database()
    
    def _hash_password(self, password: str) -> str:
        """Hash password using SHA-256"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def generate_password(self, length: int = 12) -> str:
        """Generate a secure random password"""
        characters = string.ascii_letters + string.digits + "!@#$%&*"
        password = ''.join(secrets.choice(characters) for _ in range(length))
        if (any(c.isupper() for c in password) and 
            any(c.islower() for c in password) and
            any(c.isdigit() for c in password) and
            any(c in "!@#$%&*" for c in password)):
            return password
        return self.generate_password(length)
    
    def authenticate(self, email: str, password: str) -> Optional[Dict]:
        """Authenticate user and return user data if successful"""
        email = email.lower().strip()
        if email in self.users:
            user = self.users[email]
            if user['status'] == 'active':
                if user['password'] == self._hash_password(password):
                    return {
                        'email': user['email'],
                        'name': user['name'],
                        'role': user['role'],
                        'dashboard_access': user['dashboard_access'],
                        'state_access': user['state_access']
                    }
        return None
    
    def signup_user(self, name: str, email: str) -> Dict:
        """Register a new user (first-time signup)"""
        email = email.lower().strip()
        
        if email in self.users:
            return {'success': False, 'message': 'Email already registered'}
        
        password = self.generate_password()
        
        self.users[email] = {
            'name': name.strip(),
            'email': email,
            'password': self._hash_password(password),
            'plain_password': password,
            'role': 'user',
            'dashboard_access': [],
            'state_access': [],
            'created_at': datetime.now().isoformat(),
            'status': 'pending',
            'credentials_sent': False
        }
        
        self._save_database()
        
        return {
            'success': True,
            'message': 'Signup successful! Admin will assign access.',
            'password': password,
            'email': email
        }
    
    def get_all_users(self) -> List[Dict]:
        """Get all users (for access management dashboard)"""
        users_list = []
        for email, user in self.users.items():
            users_list.append({
                'email': user['email'],
                'name': user['name'],
                'role': user['role'],
                'dashboard_access': user.get('dashboard_access', []),
                'state_access': user.get('state_access', []),
                'status': user.get('status', 'active'),
                'credentials_sent': user.get('credentials_sent', False),
                'created_at': user.get('created_at', ''),
                'plain_password': user.get('plain_password', '')
            })
        return users_list
    
    def update_user_access(self, email: str, role: str, dashboard_access: List[str], 
                          state_access: List[str]) -> Dict:
        """Update user access permissions (admin function)"""
        email = email.lower().strip()
        
        if email not in self.users:
            return {'success': False, 'message': 'User not found'}
        
        if email == SUPERADMIN_EMAIL and role != 'superadmin':
            return {'success': False, 'message': 'Cannot modify superadmin role'}
        
        self.users[email]['role'] = role
        self.users[email]['dashboard_access'] = dashboard_access
        self.users[email]['state_access'] = state_access
        self.users[email]['status'] = 'active'
        self.users[email]['updated_at'] = datetime.now().isoformat()
        
        self._save_database()
        
        return {'success': True, 'message': 'Access updated successfully'}
    
    def mark_credentials_sent(self, email: str) -> Dict:
        """Mark that credentials have been sent to user"""
        email = email.lower().strip()
        
        if email not in self.users:
            return {'success': False, 'message': 'User not found'}
        
        self.users[email]['credentials_sent'] = True
        self.users[email]['last_email_sent'] = datetime.now().isoformat()
        
        if 'plain_password' in self.users[email]:
            del self.users[email]['plain_password']
        
        self._save_database()
        
        return {'success': True, 'message': 'Marked as sent'}
    
    def reset_password(self, email: str) -> Dict:
        """Generate new password for user"""
        email = email.lower().strip()
        
        if email not in self.users:
            return {'success': False, 'message': 'User not found'}
        
        new_password = self.generate_password()
        self.users[email]['password'] = self._hash_password(new_password)
        self.users[email]['plain_password'] = new_password
        self.users[email]['credentials_sent'] = False
        self.users[email]['password_reset_at'] = datetime.now().isoformat()
        
        self._save_database()
        
        return {
            'success': True,
            'message': 'Password reset successfully',
            'password': new_password
        }
    
    def delete_user(self, email: str) -> Dict:
        """Delete user (admin function)"""
        email = email.lower().strip()
        
        if email == SUPERADMIN_EMAIL:
            return {'success': False, 'message': 'Cannot delete superadmin'}
        
        if email in self.users:
            del self.users[email]
            self._save_database()
            return {'success': True, 'message': 'User deleted successfully'}
        
        return {'success': False, 'message': 'User not found'}
    
    def get_user(self, email: str) -> Optional[Dict]:
        """Get user details"""
        email = email.lower().strip()
        if email in self.users:
            return self.users[email]
        return None
    
    def check_access(self, email: str, dashboard: str, state: str = None) -> bool:
        """Check if user has access to specific dashboard and state"""
        user = self.get_user(email)
        if not user:
            return False
        
        if user['role'] in ['superadmin', 'admin']:
            return True
        
        if dashboard not in user.get('dashboard_access', []):
            return False
        
        if state:
            state_access = user.get('state_access', [])
            if state_access == 'all' or state_access == ['all']:
                return True
            if isinstance(state_access, list) and state in state_access:
                return True
            return False
        
        return True


# Global instance
user_db = UserDatabase()
