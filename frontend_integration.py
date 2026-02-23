"""
Flask Integration Module for Next.js Frontend
Add this to your main app.py to serve the Next.js frontend and handle CORS
"""

import os
from flask import send_from_directory
from flask_cors import CORS

def setup_nextjs_frontend(app):
    """
    Setup Next.js frontend serving with Flask
    
    Usage in app.py:
        from frontend_integration import setup_nextjs_frontend
        setup_nextjs_frontend(app)
    """
    
    # Enable CORS for all routes
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://localhost:5000"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Path to Next.js build output
    frontend_build_path = os.path.join(
        os.path.dirname(__file__), 
        'frontend-nextjs/out'
    )
    
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_nextjs_frontend(path):
        """
        Serve Next.js frontend files
        Falls back to index.html for client-side routing
        """
        # Check if path is a static file
        if path != '' and os.path.exists(os.path.join(frontend_build_path, path)):
            return send_from_directory(frontend_build_path, path)
        
        # Check if file exists without path
        full_path = os.path.join(frontend_build_path, path)
        if os.path.exists(full_path) and os.path.isfile(full_path):
            return send_from_directory(frontend_build_path, path)
        
        # Fallback to index.html for SPA routing
        if os.path.exists(os.path.join(frontend_build_path, 'index.html')):
            return send_from_directory(frontend_build_path, 'index.html')
        
        return {'error': 'Frontend not built. Run: npm run build'}, 404


def setup_api_endpoints(app):
    """
    Setup required API endpoints for Next.js frontend
    These are examples - adapt to your existing API structure
    """
    
    from flask import request, jsonify
    
    @app.route('/api/avante/sales', methods=['GET'])
    def get_avante_sales():
        """Get Avante sales data"""
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # TODO: Replace with your actual data fetching logic
        return jsonify({
            'status': 'success',
            'data': []
        })
    
    @app.route('/api/avante/stats', methods=['GET'])
    def get_avante_stats():
        """Get Avante dashboard statistics"""
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        return jsonify({
            'total_revenue': 0,
            'total_quantity': 0,
            'total_dealers': 0,
            'total_products': 0
        })
    
    @app.route('/api/avante/dealer-performance', methods=['GET'])
    def get_avante_dealer_performance():
        """Get dealer performance data"""
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        return jsonify([])
    
    @app.route('/api/avante/state-performance', methods=['GET'])
    def get_avante_state_performance():
        """Get state-wise performance"""
        return jsonify([])
    
    @app.route('/api/avante/category-performance', methods=['GET'])
    def get_avante_category_performance():
        """Get category-wise performance"""
        return jsonify([])
    
    @app.route('/api/avante/city-performance', methods=['GET'])
    def get_avante_city_performance():
        """Get city-wise performance"""
        return jsonify([])
    
    # Similar endpoints for IOSPL
    @app.route('/api/iospl/sales', methods=['GET'])
    def get_iospl_sales():
        """Get IOSPL sales data"""
        return jsonify({'status': 'success', 'data': []})
    
    @app.route('/api/iospl/stats', methods=['GET'])
    def get_iospl_stats():
        """Get IOSPL statistics"""
        return jsonify({
            'total_revenue': 0,
            'total_quantity': 0,
            'total_dealers': 0,
            'total_products': 0
        })
    
    @app.route('/api/login', methods=['POST'])
    def login():
        """Handle login requests"""
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        # TODO: Implement your authentication logic
        return jsonify({
            'status': 'success',
            'message': 'Login successful',
            'token': 'dummy-token'
        })


# Flask app.py integration example:
"""
import flask
from frontend_integration import setup_nextjs_frontend, setup_api_endpoints

app = flask.Flask(__name__)

# Setup Next.js frontend serving
setup_nextjs_frontend(app)

# Setup API endpoints
setup_api_endpoints(app)

# Your existing routes...

if __name__ == '__main__':
    app.run(debug=True, port=5000)
"""
