"""
Flask Integration Module for Next.js Frontend
Dashboard application entry point
"""
import os
from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
from frontend_integration import setup_nextjs_frontend
from api_client import AvanteAPIClient

# Create Flask app
app = Flask(__name__)

# Enable CORS
CORS(app)

# Setup frontend serving
setup_nextjs_frontend(app)

def _setup_nextjs_frontend(app):
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
    Setup API endpoints that fetch data from real Avante/IOSPL APIs
    """
    
    @app.route('/api/avante/sales', methods=['GET'])
    def get_avante_sales():
        """Get Avante sales data"""
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        
        try:
            # Fetch from real API
            api_response = AvanteAPIClient.get_avante_sales(start_date, end_date)
            
            # Extract data from response (API returns "report_data" field)
            sales_data = api_response.get('report_data', []) if isinstance(api_response.get('report_data'), list) else []
            
            return jsonify({
                'status': 'success',
                'data': sales_data,
                'count': len(sales_data)
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': str(e),
                'data': []
            }), 500
    
    @app.route('/api/avante/stats', methods=['GET'])
    def get_avante_stats():
        """Get Avante dashboard statistics"""
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        
        try:
            # Fetch from real API
            api_response = AvanteAPIClient.get_avante_sales(start_date, end_date)
            sales_data = api_response.get('report_data', []) if isinstance(api_response.get('report_data'), list) else []
            
            # Parse and calculate statistics
            stats = AvanteAPIClient.parse_sales_data(sales_data)
            
            return jsonify(stats)
        except Exception as e:
            return jsonify({
                'total_revenue': 0,
                'total_quantity': 0,
                'total_dealers': 0,
                'total_products': 0,
                'error': str(e)
            }), 500
    
    @app.route('/api/avante/dealer-performance', methods=['GET'])
    def get_avante_dealer_performance():
        """Get Avante dealer performance data"""
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        
        print(f"🔍 API Call: dealer-performance, start_date={start_date}, end_date={end_date}")
        
        try:
            api_response = AvanteAPIClient.get_avante_sales(start_date, end_date)
            sales_data = api_response.get('report_data', []) if isinstance(api_response.get('report_data'), list) else []
            
            dealer_performance = AvanteAPIClient.get_dealer_performance(sales_data)
            print(f"✅ Returning {len(dealer_performance)} dealer records")
            return jsonify(dealer_performance)
        except Exception as e:
            print(f"❌ Error in dealer-performance: {str(e)}")
            return jsonify([]), 500
    
    @app.route('/api/avante/state-performance', methods=['GET'])
    def get_avante_state_performance():
        """Get Avante state-wise performance"""
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        
        try:
            api_response = AvanteAPIClient.get_avante_sales(start_date, end_date)
            sales_data = api_response.get('report_data', []) if isinstance(api_response.get('report_data'), list) else []
            
            state_performance = AvanteAPIClient.get_state_performance(sales_data)
            return jsonify(state_performance)
        except Exception as e:
            return jsonify([]), 500
    
    @app.route('/api/avante/category-performance', methods=['GET'])
    def get_avante_category_performance():
        """Get Avante category-wise performance"""
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        
        try:
            api_response = AvanteAPIClient.get_avante_sales(start_date, end_date)
            sales_data = api_response.get('report_data', []) if isinstance(api_response.get('report_data'), list) else []
            
            category_performance = AvanteAPIClient.get_category_performance(sales_data)
            return jsonify(category_performance)
        except Exception as e:
            return jsonify([]), 500
    
    @app.route('/api/avante/city-performance', methods=['GET'])
    def get_avante_city_performance():
        """Get Avante city-wise performance"""
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        
        try:
            api_response = AvanteAPIClient.get_avante_sales(start_date, end_date)
            sales_data = api_response.get('report_data', []) if isinstance(api_response.get('report_data'), list) else []
            
            city_performance = AvanteAPIClient.get_city_performance(sales_data)
            return jsonify(city_performance)
        except Exception as e:
            return jsonify([]), 500
    
    # IOSPL endpoints
    @app.route('/api/iospl/sales', methods=['GET'])
    def get_iospl_sales():
        """Get IOSPL sales data"""
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        
        try:
            # Fetch from real API
            api_response = AvanteAPIClient.get_iospl_sales(start_date, end_date)
            
            # Extract data from response (API returns "report_data" field)
            sales_data = api_response.get('report_data', []) if isinstance(api_response.get('report_data'), list) else []
            
            return jsonify({
                'status': 'success',
                'data': sales_data,
                'count': len(sales_data)
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': str(e),
                'data': []
            }), 500
    
    @app.route('/api/iospl/stats', methods=['GET'])
    def get_iospl_stats():
        """Get IOSPL statistics"""
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        
        try:
            # Fetch from real API
            api_response = AvanteAPIClient.get_iospl_sales(start_date, end_date)
            sales_data = api_response.get('report_data', []) if isinstance(api_response.get('report_data'), list) else []
            
            # Parse and calculate statistics
            stats = AvanteAPIClient.parse_sales_data(sales_data)
            
            return jsonify(stats)
        except Exception as e:
            return jsonify({
                'total_revenue': 0,
                'total_quantity': 0,
                'total_dealers': 0,
                'total_products': 0,
                'error': str(e)
            }), 500
    
    @app.route('/api/iospl/dealer-performance', methods=['GET'])
    def get_iospl_dealer_performance():
        """Get IOSPL dealer performance data"""
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        
        try:
            api_response = AvanteAPIClient.get_iospl_sales(start_date, end_date)
            sales_data = api_response.get('report_data', []) if isinstance(api_response.get('report_data'), list) else []
            
            dealer_performance = AvanteAPIClient.get_dealer_performance(sales_data)
            return jsonify(dealer_performance)
        except Exception as e:
            return jsonify([]), 500
    
    @app.route('/api/iospl/state-performance', methods=['GET'])
    def get_iospl_state_performance():
        """Get IOSPL state-wise performance"""
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        
        try:
            api_response = AvanteAPIClient.get_iospl_sales(start_date, end_date)
            sales_data = api_response.get('report_data', []) if isinstance(api_response.get('report_data'), list) else []
            
            state_performance = AvanteAPIClient.get_state_performance(sales_data)
            return jsonify(state_performance)
        except Exception as e:
            return jsonify([]), 500
    
    @app.route('/api/iospl/category-performance', methods=['GET'])
    def get_iospl_category_performance():
        """Get IOSPL category-wise performance"""
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        
        try:
            api_response = AvanteAPIClient.get_iospl_sales(start_date, end_date)
            sales_data = api_response.get('report_data', []) if isinstance(api_response.get('report_data'), list) else []
            
            category_performance = AvanteAPIClient.get_category_performance(sales_data)
            return jsonify(category_performance)
        except Exception as e:
            return jsonify([]), 500
    
    @app.route('/api/iospl/city-performance', methods=['GET'])
    def get_iospl_city_performance():
        """Get IOSPL city-wise performance"""
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        
        try:
            api_response = AvanteAPIClient.get_iospl_sales(start_date, end_date)
            sales_data = api_response.get('report_data', []) if isinstance(api_response.get('report_data'), list) else []
            
            city_performance = AvanteAPIClient.get_city_performance(sales_data)
            return jsonify(city_performance)
        except Exception as e:
            return jsonify([]), 500
    
    @app.route('/api/login', methods=['POST'])
    def login():
        """Handle login requests"""
        data = request.get_json()
        username = data.get('username', '')
        password = data.get('password', '')
        
        # Simple authentication (you can make this more sophisticated)
        if username == "u2vp8kb" and password == "asdftuy#$%78@!":
            return jsonify({
                'status': 'success',
                'message': 'Login successful',
                'token': 'auth-token-' + username,
                'username': username
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Invalid credentials'
            }), 401


# Setup API endpoints
setup_api_endpoints(app)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 Starting Flask app on http://localhost:{port}")
    app.run(debug=True, port=port, host='0.0.0.0')