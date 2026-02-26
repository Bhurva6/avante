"""
Flask Dashboard Application
Serves Next.js frontend and provides API endpoints for Avante/IOSPL sales data
"""
import os
from dotenv import load_dotenv
load_dotenv()  # Load .env before anything else

from flask import Flask, request, jsonify
from flask_cors import CORS
from frontend_integration import setup_nextjs_frontend
from src.api.avante_client import APIClient
from src.api.iospl_client import APIClientIOSPL
from src.auth.database import user_db
from src.utils.email_service import email_service

app = Flask(__name__)
CORS(app)
setup_nextjs_frontend(app)


# ─────────────────────────────────────────────
# Data processing helpers
# ─────────────────────────────────────────────

def process_stats(sales_data):
    """Calculate summary statistics from raw sales data."""
    if not sales_data:
        return {'total_revenue': 0, 'total_quantity': 0, 'total_dealers': 0, 'total_products': 0}
    total_revenue = sum(float(r.get('SV', 0) or 0) for r in sales_data)
    total_quantity = sum(float(r.get('SQ', 0) or 0) for r in sales_data)
    dealers = {r.get('comp_nm', '') for r in sales_data if r.get('comp_nm')}
    products = {r.get('category_name', '') for r in sales_data if r.get('category_name')}
    return {
        'total_revenue': total_revenue,
        'total_quantity': total_quantity,
        'total_dealers': len(dealers),
        'total_products': len(products),
    }


def process_dealer_performance(sales_data):
    """Aggregate sales by dealer, sorted by revenue descending."""
    dealer_map = {}
    for r in sales_data:
        name = (r.get('comp_nm') or 'Unknown').strip()
        sv = float(r.get('SV', 0) or 0)
        sq = float(r.get('SQ', 0) or 0)
        if name not in dealer_map:
            dealer_map[name] = {'dealer_name': name, 'total_sales': 0.0, 'total_quantity': 0.0}
        dealer_map[name]['total_sales'] += sv
        dealer_map[name]['total_quantity'] += sq
    result = list(dealer_map.values())
    result.sort(key=lambda x: x['total_sales'], reverse=True)
    return result


def process_state_performance(sales_data):
    """Aggregate sales by state, sorted by revenue descending."""
    state_map = {}
    for r in sales_data:
        state = (r.get('state') or 'Unknown').strip()
        sv = float(r.get('SV', 0) or 0)
        sq = float(r.get('SQ', 0) or 0)
        if state not in state_map:
            state_map[state] = {'state': state, 'total_sales': 0.0, 'total_quantity': 0.0}
        state_map[state]['total_sales'] += sv
        state_map[state]['total_quantity'] += sq
    result = list(state_map.values())
    result.sort(key=lambda x: x['total_sales'], reverse=True)
    return result


def process_category_performance(sales_data):
    """Aggregate sales by product/category, sorted by revenue descending."""
    cat_map = {}
    for r in sales_data:
        product = (r.get('category_name') or 'Unknown').strip()
        parent = (r.get('parent_category') or 'Other').strip()
        dealer = (r.get('comp_nm') or '').strip()
        sv = float(r.get('SV', 0) or 0)
        sq = float(r.get('SQ', 0) or 0)
        if product not in cat_map:
            cat_map[product] = {
                'product_name': product,
                'parent_category': parent,
                'dealer_name': dealer,
                'total_sales': 0.0,
                'total_quantity': 0.0,
            }
        cat_map[product]['total_sales'] += sv
        cat_map[product]['total_quantity'] += sq
    result = list(cat_map.values())
    result.sort(key=lambda x: x['total_sales'], reverse=True)
    return result


def process_city_performance(sales_data):
    """Aggregate sales by city, sorted by revenue descending."""
    city_map = {}
    for r in sales_data:
        city = (r.get('city') or 'Unknown').strip()
        state = (r.get('state') or '').strip()
        sv = float(r.get('SV', 0) or 0)
        sq = float(r.get('SQ', 0) or 0)
        if city not in city_map:
            city_map[city] = {'city': city, 'state': state, 'total_sales': 0.0, 'total_quantity': 0.0}
        city_map[city]['total_sales'] += sv
        city_map[city]['total_quantity'] += sq
    result = list(city_map.values())
    result.sort(key=lambda x: x['total_sales'], reverse=True)
    return result


# ─────────────────────────────────────────────
# API Endpoints
# ─────────────────────────────────────────────

def setup_api_endpoints(app):
    """Register all API endpoints."""

    # ── Avante endpoints ──────────────────────

    @app.route('/api/avante/sales', methods=['GET'])
    def get_avante_sales():
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        try:
            api_response = APIClient().get_sales_report(start_date, end_date)
            sales_data = api_response.get('report_data') or []
            return jsonify({'status': 'success', 'data': sales_data, 'count': len(sales_data)})
        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e), 'data': []}), 500

    @app.route('/api/avante/stats', methods=['GET'])
    def get_avante_stats():
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        try:
            api_response = APIClient().get_sales_report(start_date, end_date)
            sales_data = api_response.get('report_data') or []
            return jsonify(process_stats(sales_data))
        except Exception as e:
            return jsonify({'total_revenue': 0, 'total_quantity': 0, 'total_dealers': 0, 'total_products': 0, 'error': str(e)}), 500

    @app.route('/api/avante/dealer-performance', methods=['GET'])
    def get_avante_dealer_performance():
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        try:
            api_response = APIClient().get_sales_report(start_date, end_date)
            sales_data = api_response.get('report_data') or []
            return jsonify(process_dealer_performance(sales_data))
        except Exception as e:
            return jsonify([]), 500

    @app.route('/api/avante/state-performance', methods=['GET'])
    def get_avante_state_performance():
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        try:
            api_response = APIClient().get_sales_report(start_date, end_date)
            sales_data = api_response.get('report_data') or []
            return jsonify(process_state_performance(sales_data))
        except Exception as e:
            return jsonify([]), 500

    @app.route('/api/avante/category-performance', methods=['GET'])
    def get_avante_category_performance():
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        try:
            api_response = APIClient().get_sales_report(start_date, end_date)
            sales_data = api_response.get('report_data') or []
            return jsonify(process_category_performance(sales_data))
        except Exception as e:
            return jsonify([]), 500

    @app.route('/api/avante/city-performance', methods=['GET'])
    def get_avante_city_performance():
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        try:
            api_response = APIClient().get_sales_report(start_date, end_date)
            sales_data = api_response.get('report_data') or []
            return jsonify(process_city_performance(sales_data))
        except Exception as e:
            return jsonify([]), 500

    # ── IOSPL endpoints ───────────────────────

    @app.route('/api/iospl/sales', methods=['GET'])
    def get_iospl_sales():
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        try:
            api_response = APIClientIOSPL().get_sales_report(start_date, end_date)
            sales_data = api_response.get('report_data') or []
            return jsonify({'status': 'success', 'data': sales_data, 'count': len(sales_data)})
        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e), 'data': []}), 500

    @app.route('/api/iospl/stats', methods=['GET'])
    def get_iospl_stats():
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        try:
            api_response = APIClientIOSPL().get_sales_report(start_date, end_date)
            sales_data = api_response.get('report_data') or []
            return jsonify(process_stats(sales_data))
        except Exception as e:
            return jsonify({'total_revenue': 0, 'total_quantity': 0, 'total_dealers': 0, 'total_products': 0, 'error': str(e)}), 500

    @app.route('/api/iospl/dealer-performance', methods=['GET'])
    def get_iospl_dealer_performance():
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        try:
            api_response = APIClientIOSPL().get_sales_report(start_date, end_date)
            sales_data = api_response.get('report_data') or []
            return jsonify(process_dealer_performance(sales_data))
        except Exception as e:
            return jsonify([]), 500

    @app.route('/api/iospl/state-performance', methods=['GET'])
    def get_iospl_state_performance():
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        try:
            api_response = APIClientIOSPL().get_sales_report(start_date, end_date)
            sales_data = api_response.get('report_data') or []
            return jsonify(process_state_performance(sales_data))
        except Exception as e:
            return jsonify([]), 500

    @app.route('/api/iospl/category-performance', methods=['GET'])
    def get_iospl_category_performance():
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        try:
            api_response = APIClientIOSPL().get_sales_report(start_date, end_date)
            sales_data = api_response.get('report_data') or []
            return jsonify(process_category_performance(sales_data))
        except Exception as e:
            return jsonify([]), 500

    @app.route('/api/iospl/city-performance', methods=['GET'])
    def get_iospl_city_performance():
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        try:
            api_response = APIClientIOSPL().get_sales_report(start_date, end_date)
            sales_data = api_response.get('report_data') or []
            return jsonify(process_city_performance(sales_data))
        except Exception as e:
            return jsonify([]), 500

    # ── Authentication endpoints ──────────────

    @app.route('/api/login', methods=['POST'])
    def login():
        data = request.get_json() or {}
        email = (data.get('email') or data.get('username') or '').strip()
        password = (data.get('password') or '').strip()

        # UserDatabase authentication (handles admin@avante.com and all managed users)
        user_data = user_db.authenticate(email, password)

        # Legacy credential fallback
        if not user_data and email == 'u2vp8kb' and password == 'asdftuy#$%78@!':
            user_data = {
                'email': 'u2vp8kb',
                'name': 'Admin',
                'role': 'superadmin',
                'dashboard_access': ['avante', 'iospl'],
                'state_access': 'all',
            }

        if user_data:
            state_access = user_data.get('state_access', [])
            states = [] if state_access in ('all', ['all']) else (
                state_access if isinstance(state_access, list) else []
            )
            return jsonify({
                'status': 'success',
                'message': 'Login successful',
                'token': f'auth-token-{email}',
                'email': email,
                'name': user_data.get('name', email),
                'role': user_data.get('role', 'user'),
                'states': states,
                'dashboard_access': user_data.get('dashboard_access', []),
            })

        return jsonify({'status': 'error', 'message': 'Invalid credentials'}), 401

    @app.route('/api/signup', methods=['POST'])
    def signup():
        data = request.get_json() or {}
        name = data.get('fullName') or data.get('name', '')
        email = data.get('email', '').strip().lower()
        requested_states = data.get('requestedStates', [])

        if not name or not email:
            return jsonify({'status': 'error', 'message': 'Name and email are required'}), 400

        result = user_db.signup_user(name, email)
        if result['success']:
            # Store the requested states on the pending user record
            user_db.users[email]['requested_states'] = requested_states
            user_db._save_database()
            return jsonify({
                'status': 'success',
                'message': 'Access request submitted. Admin will review and notify you.',
            })
        return jsonify({'status': 'error', 'message': result['message']}), 400

    # ── User management endpoints ─────────────

    @app.route('/api/admin/users', methods=['GET'])
    def get_users():
        all_users = user_db.get_all_users()
        active = [
            {
                'id': u['email'],
                'email': u['email'],
                'name': u.get('name', ''),
                'role': u['role'],
                'allowedStates': (
                    [] if u.get('state_access') in ('all', ['all'])
                    else (u.get('state_access') or [])
                ),
                'dashboard_access': u.get('dashboard_access', []),
                'status': u['status'],
                'createdAt': u.get('created_at', ''),
            }
            for u in all_users
            if u['status'] == 'active' and u['role'] != 'superadmin'
        ]
        return jsonify({'users': active})

    @app.route('/api/admin/users', methods=['POST'])
    def create_user():
        data = request.get_json() or {}
        email = data.get('email', '').strip().lower()
        name = data.get('fullName') or data.get('name') or email.split('@')[0]
        role = data.get('role', 'user')
        states = data.get('states', [])
        dashboards = data.get('dashboard_access', ['avante', 'iospl'])
        password = data.get('password')

        if not email:
            return jsonify({'status': 'error', 'message': 'Email is required'}), 400

        result = user_db.signup_user(name, email)
        if not result['success']:
            return jsonify({'status': 'error', 'message': result['message']}), 400

        # Override password if provided by admin
        if password:
            user_db.users[email]['password'] = user_db._hash_password(password)
            if 'plain_password' in user_db.users[email]:
                del user_db.users[email]['plain_password']
            user_db._save_database()

        user_db.update_user_access(email, role, dashboards, states)
        return jsonify({
            'status': 'success',
            'message': 'User created successfully',
            'password': password or result.get('password', ''),
        }), 201

    @app.route('/api/admin/users/<path:email>', methods=['PUT'])
    def update_user_endpoint(email):
        data = request.get_json() or {}
        role = data.get('role', 'user')
        states = data.get('states', [])
        dashboards = data.get('dashboard_access', ['avante', 'iospl'])
        result = user_db.update_user_access(email, role, dashboards, states)
        if result['success']:
            return jsonify({'status': 'success', 'message': result['message']})
        return jsonify({'status': 'error', 'message': result['message']}), 400

    @app.route('/api/admin/users/<path:email>', methods=['DELETE'])
    def delete_user_endpoint(email):
        result = user_db.delete_user(email)
        if result['success']:
            return jsonify({'status': 'success', 'message': result['message']})
        return jsonify({'status': 'error', 'message': result['message']}), 400

    # ── Access Request endpoints ──────────────

    @app.route('/api/admin/access-requests', methods=['GET'])
    def get_access_requests():
        all_users = user_db.get_all_users()
        pending = [
            {
                'id': u['email'],
                'email': u['email'],
                'fullName': u.get('name', ''),
                'requestedStates': user_db.users.get(u['email'], {}).get('requested_states', []),
                'status': 'pending',
                'requestedAt': u.get('created_at', ''),
            }
            for u in all_users if u['status'] == 'pending'
        ]
        return jsonify({'requests': pending})

    @app.route('/api/admin/access-requests/<path:request_id>/approve', methods=['POST'])
    def approve_access_request(request_id):
        email = request_id
        data = request.get_json() or {}
        states = data.get('states') or user_db.users.get(email, {}).get('requested_states', [])
        dashboards = data.get('dashboard_access', ['avante', 'iospl'])
        role = data.get('role', 'user')
        result = user_db.update_user_access(email, role, dashboards, states)
        if result['success']:
            # Send approval email with credentials
            user = user_db.users.get(email, {})
            plain_pw = user.get('plain_password', '(use your sign-up password)')
            name = user.get('name', email)
            try:
                email_service.send_credentials(email, name, plain_pw, dashboards, states)
            except Exception as e:
                print(f'Email send failed: {e}')
            return jsonify({'status': 'success', 'message': 'Request approved'})
        return jsonify({'status': 'error', 'message': result['message']}), 400

    @app.route('/api/admin/access-requests/<path:request_id>/reject', methods=['POST'])
    def reject_access_request(request_id):
        email = request_id
        if email in user_db.users:
            user_db.users[email]['status'] = 'rejected'
            user_db._save_database()
            return jsonify({'status': 'success', 'message': 'Request rejected'})
        return jsonify({'status': 'error', 'message': 'User not found'}), 404


setup_api_endpoints(app)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f'🚀 Starting Flask app on http://localhost:{port}')
    app.run(debug=True, port=port, host='0.0.0.0')
