"""
Production entrypoint for Railway deployment.
Uses gunicorn to serve the Flask app.
"""
import os
import subprocess
import sys

port = os.environ.get('PORT', '8080')

subprocess.run([
    sys.executable, '-m', 'gunicorn',
    '--bind', f'0.0.0.0:{port}',
    '--workers', '2',
    '--timeout', '120',
    'app:app'
], check=True)
