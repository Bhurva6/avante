"""
Email Service for sending access credentials and notifications
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict
import os
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Email configuration
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SENDER_EMAIL = os.getenv('SENDER_EMAIL', 'noreply@avante.com')
SENDER_PASSWORD = os.getenv('SENDER_PASSWORD', '')
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@avante.com')

# Constants for email messages
EMAIL_SERVICE_NOT_CONFIGURED = 'Email service not configured. Please set SMTP_SERVER, SMTP_PORT, SENDER_EMAIL, and SENDER_PASSWORD environment variables.'
NOT_ASSIGNED = 'Not assigned'
ALL_STATES = 'All States'


class EmailService:
    """Handle sending emails for credentials and notifications"""
    
    def __init__(self):
        self.smtp_server = SMTP_SERVER
        self.smtp_port = SMTP_PORT
        self.sender_email = SENDER_EMAIL
        self.sender_password = SENDER_PASSWORD
        self.admin_email = ADMIN_EMAIL
    
    def send_credentials(self, recipient_email: str, recipient_name: str, 
                        password: str, dashboard_access: list, state_access: list) -> Dict:
        """Send access credentials to user"""
        
        try:
            html_content = self._create_credential_email(
                recipient_name, recipient_email, password, 
                dashboard_access, state_access
            )
            
            message = MIMEMultipart('alternative')
            message['Subject'] = '✅ Your Avante Dashboard Access Granted'
            message['From'] = self.sender_email
            message['To'] = recipient_email
            
            html_part = MIMEText(html_content, 'html')
            message.attach(html_part)
            
            if self.sender_password:
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.sender_email, self.sender_password)
                    server.send_message(message)
                
                logger.info(f'Credentials sent to {recipient_email}')
                return {
                    'success': True,
                    'message': f'Credentials sent successfully to {recipient_email}'
                }
            else:
                logger.warning('Email service not configured - credentials email not sent')
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
            logger.error(f'Failed to send credentials email to {recipient_email}: {str(e)}')
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
    
    def send_access_request_notification(self, user_email: str, user_name: str, 
                                        requested_states: list) -> Dict:
        """Send notification to admin about new access request"""
        try:
            html_content = self._create_access_request_email(user_email, user_name, requested_states)
            
            message = MIMEMultipart('alternative')
            message['Subject'] = f'🔔 New Access Request from {user_name}'
            message['From'] = self.sender_email
            message['To'] = self.admin_email
            
            html_part = MIMEText(html_content, 'html')
            message.attach(html_part)
            
            if self.sender_password:
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.sender_email, self.sender_password)
                    server.send_message(message)
                
                logger.info(f'Access request notification sent to {self.admin_email} for {user_email}')
                return {
                    'success': True,
                    'message': 'Access request notification sent to admin'
                }
            else:
                logger.warning('Email service not configured - access request notification not sent')
                return {
                    'success': True,
                    'message': EMAIL_SERVICE_NOT_CONFIGURED
                }
        
        except Exception as e:
            logger.error(f'Failed to send access request notification: {str(e)}')
            return {
                'success': False,
                'message': f'Failed to send notification: {str(e)}'
            }
    
    def send_access_approved_email(self, recipient_email: str, recipient_name: str,
                                   dashboard_access: list, state_access: list) -> Dict:
        """Send email to user when access is approved"""
        try:
            html_content = self._create_approval_email(recipient_name, dashboard_access, state_access)
            
            message = MIMEMultipart('alternative')
            message['Subject'] = '✅ Your Dashboard Access Has Been Approved!'
            message['From'] = self.sender_email
            message['To'] = recipient_email
            
            html_part = MIMEText(html_content, 'html')
            message.attach(html_part)
            
            if self.sender_password:
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.sender_email, self.sender_password)
                    server.send_message(message)
                
                logger.info(f'Access approval email sent to {recipient_email}')
                return {
                    'success': True,
                    'message': f'Approval notification sent to {recipient_email}'
                }
            else:
                logger.warning('Email service not configured - approval email not sent')
                return {
                    'success': True,
                    'message': EMAIL_SERVICE_NOT_CONFIGURED
                }
        
        except Exception as e:
            logger.error(f'Failed to send approval email to {recipient_email}: {str(e)}')
            return {
                'success': False,
                'message': f'Failed to send email: {str(e)}'
            }
    
    def send_access_rejected_email(self, recipient_email: str, recipient_name: str) -> Dict:
        """Send email to user when access request is rejected"""
        try:
            html_content = self._create_rejection_email(recipient_name)
            
            message = MIMEMultipart('alternative')
            message['Subject'] = '❌ Your Dashboard Access Request'
            message['From'] = self.sender_email
            message['To'] = recipient_email
            
            html_part = MIMEText(html_content, 'html')
            message.attach(html_part)
            
            if self.sender_password:
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.sender_email, self.sender_password)
                    server.send_message(message)
                
                logger.info(f'Access rejection email sent to {recipient_email}')
                return {
                    'success': True,
                    'message': f'Rejection notification sent to {recipient_email}'
                }
            else:
                logger.warning('Email service not configured - rejection email not sent')
                return {
                    'success': True,
                    'message': 'Email service not configured.'
                }
        
        except Exception as e:
            logger.error(f'Failed to send rejection email to {recipient_email}: {str(e)}')
            return {
                'success': False,
                'message': f'Failed to send email: {str(e)}'
            }
    
    def send_access_revoked_email(self, recipient_email: str, recipient_name: str) -> Dict:
        """Send email to user when access is revoked"""
        try:
            html_content = self._create_revoke_email(recipient_name)
            
            message = MIMEMultipart('alternative')
            message['Subject'] = '⚠️ Your Dashboard Access Has Been Revoked'
            message['From'] = self.sender_email
            message['To'] = recipient_email
            
            html_part = MIMEText(html_content, 'html')
            message.attach(html_part)
            
            if self.sender_password:
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.sender_email, self.sender_password)
                    server.send_message(message)
                
                logger.info(f'Access revoke email sent to {recipient_email}')
                return {
                    'success': True,
                    'message': f'Revoke notification sent to {recipient_email}'
                }
            else:
                logger.warning('Email service not configured - revoke email not sent')
                return {
                    'success': True,
                    'message': 'Email service not configured.'
                }
        
        except Exception as e:
            logger.error(f'Failed to send revoke email to {recipient_email}: {str(e)}')
            return {
                'success': False,
                'message': f'Failed to send email: {str(e)}'
            }
    
    def _create_credential_email(self, name: str, email: str, password: str,
                                dashboard_access: list, state_access: list) -> str:
        """Create HTML email template for credentials"""
        
        # Format dashboard access
        if isinstance(dashboard_access, list):
            dashboard_list = ', '.join([d.upper() for d in dashboard_access])
        else:
            dashboard_list = NOT_ASSIGNED
        
        # Format state access
        if (isinstance(state_access, str) and state_access == 'all') or (isinstance(state_access, list) and state_access == ['all']):
            state_list = ALL_STATES
        elif isinstance(state_access, list) and len(state_access) > 0:
            state_list = ', '.join(state_access)
        else:
            state_list = NOT_ASSIGNED
        
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
    
    def _create_access_request_email(self, user_email: str, user_name: str, requested_states: list) -> str:
        """Create HTML email template for access request notification to admin"""
        states_list = ', '.join(requested_states) if requested_states else 'Not specified'
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; padding: 30px; text-align: center; }}
                .content {{ padding: 30px; }}
                .request-box {{ background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 5px; }}
                .action-button {{ background-color: #6366f1; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; display: inline-block; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔔 New Access Request</h1>
                </div>
                <div class="content">
                    <p>Hello Admin,</p>
                    <p>A new user has requested access to the Avante Dashboard.</p>
                    <div class="request-box">
                        <p><strong>Name:</strong> {user_name}</p>
                        <p><strong>Email:</strong> {user_email}</p>
                        <p><strong>Requested States:</strong> {states_list}</p>
                    </div>
                    <p>Please review this request and approve or reject it from the Access Management panel.</p>
                    <a href="http://localhost:3000/" class="action-button">Review Request →</a>
                </div>
            </div>
        </body>
        </html>
        """
        return html
    
    def _create_approval_email(self, name: str, dashboard_access: list, state_access: list) -> str:
        """Create HTML email template for access approval notification"""
        dashboard_list = ', '.join([d.upper() for d in dashboard_access]) if dashboard_access else NOT_ASSIGNED
        
        if isinstance(state_access, list) and len(state_access) > 0:
            state_list = ', '.join(state_access)
        else:
            state_list = ALL_STATES
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; }}
                .content {{ padding: 30px; }}
                .access-box {{ background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 5px; }}
                .login-button {{ background-color: #10b981; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; display: inline-block; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Access Approved!</h1>
                </div>
                <div class="content">
                    <p>Hello <strong>{name}</strong>,</p>
                    <p>Great news! Your access request has been <strong>approved</strong>. You now have access to the Avante Dashboard.</p>
                    <div class="access-box">
                        <p><strong>Dashboard Access:</strong> {dashboard_list}</p>
                        <p><strong>State Access:</strong> {state_list}</p>
                    </div>
                    <p>You can now log in to your account and start using the dashboard.</p>
                    <a href="http://localhost:3000/login" class="login-button">Login to Dashboard →</a>
                </div>
            </div>
        </body>
        </html>
        """
        return html
    
    def _create_rejection_email(self, name: str) -> str:
        """Create HTML email template for access rejection notification"""
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; }}
                .content {{ padding: 30px; }}
                .message-box {{ background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 5px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>❌ Access Request Declined</h1>
                </div>
                <div class="content">
                    <p>Hello <strong>{name}</strong>,</p>
                    <p>Thank you for your interest in accessing the Avante Dashboard. Unfortunately, your access request has been <strong>declined</strong> at this time.</p>
                    <div class="message-box">
                        <p>If you believe this is an error or would like more information, please contact the administrator.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        return html
    
    def _create_revoke_email(self, name: str) -> str:
        """Create HTML email template for access revocation notification"""
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; }}
                .content {{ padding: 30px; }}
                .warning-box {{ background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 5px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⚠️ Access Revoked</h1>
                </div>
                <div class="content">
                    <p>Hello <strong>{name}</strong>,</p>
                    <p>Your access to the Avante Dashboard has been <strong>revoked</strong>. You will no longer be able to log in or access any dashboard features.</p>
                    <div class="warning-box">
                        <p>If you have questions about this action, please contact the administrator.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        return html


# Global instance
email_service = EmailService()
