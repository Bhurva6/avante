"""
Email Service for sending access credentials
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict
import os

# Email configuration
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SENDER_EMAIL = os.getenv('SENDER_EMAIL', 'noreply@avante.com')
SENDER_PASSWORD = os.getenv('SENDER_PASSWORD', '')


class EmailService:
    """Handle sending emails for credentials"""
    
    def __init__(self):
        self.smtp_server = SMTP_SERVER
        self.smtp_port = SMTP_PORT
        self.sender_email = SENDER_EMAIL
        self.sender_password = SENDER_PASSWORD
    
    def send_credentials(self, recipient_email: str, recipient_name: str, 
                        password: str, dashboard_access: list, state_access: list) -> Dict:
        """Send access credentials to user"""
        
        try:
            html_content = self._create_credential_email(
                recipient_name, recipient_email, password, 
                dashboard_access, state_access
            )
            
            message = MIMEMultipart('alternative')
            message['Subject'] = 'Your Avante Dashboard Access Credentials'
            message['From'] = self.sender_email
            message['To'] = recipient_email
            
            html_part = MIMEText(html_content, 'html')
            message.attach(html_part)
            
            if self.sender_password:
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.sender_email, self.sender_password)
                    server.send_message(message)
                
                return {
                    'success': True,
                    'message': f'Credentials sent successfully to {recipient_email}'
                }
            else:
                return {
                    'success': True,
                    'message': 'Email service not configured. Share credentials manually.',
                    'credentials': {
                        'email': recipient_email,
                        'password': password,
                        'dashboard_access': dashboard_access,
                        'state_access': state_access
                    }
                }
        
        except Exception as e:
            return {
                'success': False,
                'message': f'Failed to send email: {str(e)}',
                'credentials': {
                    'email': recipient_email,
                    'password': password,
                    'dashboard_access': dashboard_access,
                    'state_access': state_access
                }
            }
    
    def _create_credential_email(self, name: str, email: str, password: str,
                                dashboard_access: list, state_access: list) -> str:
        """Create HTML email template for credentials"""
        
        # Format dashboard access
        if isinstance(dashboard_access, list):
            dashboard_list = ', '.join([d.upper() for d in dashboard_access])
        else:
            dashboard_list = 'Not assigned'
        
        # Format state access
        if state_access == 'all' or state_access == ['all']:
            state_list = 'All States'
        elif isinstance(state_access, list) and len(state_access) > 0:
            state_list = ', '.join(state_access)
        else:
            state_list = 'Not assigned'
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; }}
                .content {{ padding: 30px; }}
                .credentials-box {{ background-color: #f8f9fa; border-left: 4px solid #6366f1; padding: 20px; margin: 20px 0; border-radius: 5px; }}
                .credential-value {{ color: #333; font-size: 16px; font-family: 'Courier New', monospace; margin-top: 5px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏥 Avante Dashboard</h1>
                    <p>Access Credentials</p>
                </div>
                <div class="content">
                    <p>Hello <strong>{name}</strong>,</p>
                    <p>Your access to the Avante Dashboard has been granted.</p>
                    <div class="credentials-box">
                        <p><strong>Email:</strong> <span class="credential-value">{email}</span></p>
                        <p><strong>Password:</strong> <span class="credential-value">{password}</span></p>
                    </div>
                    <p><strong>Dashboard Access:</strong> {dashboard_list}</p>
                    <p><strong>State Access:</strong> {state_list}</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html


# Global instance
email_service = EmailService()
