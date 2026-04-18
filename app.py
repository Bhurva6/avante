"""
Flask Dashboard Application
Serves Next.js frontend and provides API endpoints for Avante/IOSPL sales data
"""
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
load_dotenv()  # Load .env before anything else

from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
from frontend_integration import setup_nextjs_frontend
from src.api.avante_client import APIClient
from src.api.iospl_client import APIClientIOSPL
from src.auth.database import user_db
from src.utils.email_service import email_service

app = Flask(__name__)
CORS(app)
setup_nextjs_frontend(app)


# ─────────────────────────────────────────────
# Authorization helper
# ─────────────────────────────────────────────

def require_superadmin(f):
    """Decorator to require superadmin authorization"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get the user email from request headers or query params
        auth_header = request.headers.get('X-User-Email', '').strip().lower()
        query_email = request.args.get('user_email', '').strip().lower()
        user_email = auth_header or query_email or ''
        
        if not user_email:
            return jsonify({'status': 'error', 'message': 'Unauthorized: Missing user email'}), 401
        
        user = user_db.get_user(user_email)
        if not user or user.get('role') != 'superadmin':
            return jsonify({'status': 'error', 'message': 'Unauthorized: Only superadmin can perform this action'}), 403
        
        return f(*args, **kwargs)
    return decorated_function


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


def _parse_api_date(date_str):
    """Parse a DD-MM-YYYY date string; return None if invalid."""
    try:
        return datetime.strptime(date_str.strip(), '%d-%m-%Y')
    except Exception:
        return None


def _filter_by_states(sales_data, states_param):
    """Filter raw sales records to only those whose state is in states_param.

    states_param is a comma-separated string (e.g. 'Maharashtra,Gujarat').
    Matching is case-insensitive so raw API data like 'MAHARASHTRA' matches
    a DB-stored value of 'Maharashtra'.
    Returns the original list unchanged when states_param is empty / not supplied.
    """
    if not states_param:
        return sales_data
    allowed = {s.strip().lower() for s in states_param.split(',') if s.strip()}
    if not allowed:
        return sales_data
    return [r for r in sales_data if (r.get('state') or '').strip().lower() in allowed]


def _resolve_states_param():
    """Return the effective states filter string for the current request.

    If the requesting user is a non-superadmin with restricted state access,
    their DB-stored states override whatever the frontend sent.
    This prevents a user from bypassing their restrictions by omitting the param.
    State names are lowercased here; _filter_by_states lowercases both sides.
    """
    email = request.headers.get('X-User-Email', '').strip().lower()
    if email:
        user = user_db.get_user(email)
        if user and user.get('role') != 'superadmin':
            state_access = user.get('state_access', [])
            # state_access can be 'all', ['all'], [], or a real list of states
            if state_access and state_access not in ('all', ['all']):
                if isinstance(state_access, list) and len(state_access) > 0:
                    return ','.join(s.strip() for s in state_access if s.strip())
    # Fall back to query param (superadmin or no email header)
    return request.args.get('states', '').strip()


def _compute_previous_period(start_str, end_str):
    """Return the same-length period immediately before (start_str, end_str)."""
    start = _parse_api_date(start_str)
    end = _parse_api_date(end_str)
    if not start or not end or end < start:
        return None, None
    duration = (end - start).days
    prev_end = start - timedelta(days=1)
    prev_start = prev_end - timedelta(days=duration)
    return prev_start.strftime('%d-%m-%Y'), prev_end.strftime('%d-%m-%Y')


def _build_non_billing_dealers(current_data, prev_data):
    """
    Compare two periods of sales data.
    Returns dealers present in prev_data that have 50 %+ revenue decline in current_data.
    """
    # Aggregate current period by dealer
    current_map = {}
    for r in current_data:
        name = (r.get('comp_nm') or 'Unknown').strip()
        sv = float(r.get('SV', 0) or 0)
        if name not in current_map:
            current_map[name] = {
                'total': 0.0,
                'city': (r.get('city') or '').strip(),
                'state': (r.get('state') or '').strip(),
            }
        current_map[name]['total'] += sv

    # Aggregate previous period by dealer, track last billing date
    prev_map = {}
    for r in prev_data:
        name = (r.get('comp_nm') or 'Unknown').strip()
        sv = float(r.get('SV', 0) or 0)
        raw_date = (r.get('create_date') or r.get('sale_date') or '').strip()
        if name not in prev_map:
            prev_map[name] = {
                'total': 0.0,
                'city': (r.get('city') or '').strip(),
                'state': (r.get('state') or '').strip(),
                'last_date': raw_date,
            }
        prev_map[name]['total'] += sv
        if raw_date:
            prev_map[name]['last_date'] = raw_date  # keep most-recent

    today = datetime.now()
    result = []
    for dealer_name, prev_info in prev_map.items():
        prev_sales = prev_info['total']
        if prev_sales <= 0:
            continue
        current_sales = current_map.get(dealer_name, {}).get('total', 0.0)
        decline_pct = ((prev_sales - current_sales) / prev_sales) * 100
        if decline_pct < 50:
            continue  # only include dealers with significant decline

        # Parse last billing date
        days_since = 0
        last_billing_iso = None
        raw_date = prev_info.get('last_date', '')
        if raw_date:
            dt = _parse_api_date(raw_date)
            if not dt:
                try:
                    dt = datetime.strptime(raw_date[:10], '%Y-%m-%d')
                except Exception:
                    dt = None
            if dt:
                days_since = max(0, (today - dt).days)
                last_billing_iso = dt.strftime('%Y-%m-%d')

        result.append({
            'dealer_name': dealer_name,
            'city': prev_info.get('city', ''),
            'state': prev_info.get('state', ''),
            'last_billing_date': last_billing_iso,
            'previous_period_sales': round(prev_sales, 2),
            'current_period_sales': round(current_sales, 2),
            'decline_percentage': round(decline_pct, 1),
            'days_since_last_billing': days_since,
        })

    result.sort(key=lambda x: x['decline_percentage'], reverse=True)
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
        states_param = _resolve_states_param()
        try:
            api_response = APIClient().get_sales_report(start_date, end_date)
            sales_data = _filter_by_states(api_response.get('report_data') or [], states_param)
            return jsonify({'status': 'success', 'data': sales_data, 'count': len(sales_data)})
        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e), 'data': []}), 500

    @app.route('/api/avante/stats', methods=['GET'])
    def get_avante_stats():
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        states_param = _resolve_states_param()
        try:
            api_response = APIClient().get_sales_report(start_date, end_date)
            sales_data = _filter_by_states(api_response.get('report_data') or [], states_param)
            return jsonify(process_stats(sales_data))
        except Exception as e:
            return jsonify({'total_revenue': 0, 'total_quantity': 0, 'total_dealers': 0, 'total_products': 0, 'error': str(e)}), 500

    @app.route('/api/avante/dealer-performance', methods=['GET'])
    def get_avante_dealer_performance():
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        states_param = _resolve_states_param()
        try:
            api_response = APIClient().get_sales_report(start_date, end_date)
            sales_data = _filter_by_states(api_response.get('report_data') or [], states_param)
            return jsonify(process_dealer_performance(sales_data))
        except Exception as e:
            return jsonify([]), 500

    @app.route('/api/avante/state-performance', methods=['GET'])
    def get_avante_state_performance():
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        states_param = _resolve_states_param()
        try:
            api_response = APIClient().get_sales_report(start_date, end_date)
            sales_data = _filter_by_states(api_response.get('report_data') or [], states_param)
            return jsonify(process_state_performance(sales_data))
        except Exception as e:
            return jsonify([]), 500

    @app.route('/api/avante/category-performance', methods=['GET'])
    def get_avante_category_performance():
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        states_param = _resolve_states_param()
        try:
            api_response = APIClient().get_sales_report(start_date, end_date)
            sales_data = _filter_by_states(api_response.get('report_data') or [], states_param)
            return jsonify(process_category_performance(sales_data))
        except Exception as e:
            return jsonify([]), 500

    @app.route('/api/avante/city-performance', methods=['GET'])
    def get_avante_city_performance():
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        states_param = _resolve_states_param()
        try:
            api_response = APIClient().get_sales_report(start_date, end_date)
            sales_data = _filter_by_states(api_response.get('report_data') or [], states_param)
            return jsonify(process_city_performance(sales_data))
        except Exception as e:
            return jsonify([]), 500

    # ── IOSPL endpoints ───────────────────────

    @app.route('/api/iospl/sales', methods=['GET'])
    def get_iospl_sales():
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        states_param = _resolve_states_param()
        try:
            api_response = APIClientIOSPL().get_sales_report(start_date, end_date)
            sales_data = _filter_by_states(api_response.get('report_data') or [], states_param)
            return jsonify({'status': 'success', 'data': sales_data, 'count': len(sales_data)})
        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e), 'data': []}), 500

    @app.route('/api/iospl/stats', methods=['GET'])
    def get_iospl_stats():
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        states_param = _resolve_states_param()
        try:
            api_response = APIClientIOSPL().get_sales_report(start_date, end_date)
            sales_data = _filter_by_states(api_response.get('report_data') or [], states_param)
            return jsonify(process_stats(sales_data))
        except Exception as e:
            return jsonify({'total_revenue': 0, 'total_quantity': 0, 'total_dealers': 0, 'total_products': 0, 'error': str(e)}), 500

    @app.route('/api/iospl/dealer-performance', methods=['GET'])
    def get_iospl_dealer_performance():
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        states_param = _resolve_states_param()
        try:
            api_response = APIClientIOSPL().get_sales_report(start_date, end_date)
            sales_data = _filter_by_states(api_response.get('report_data') or [], states_param)
            return jsonify(process_dealer_performance(sales_data))
        except Exception as e:
            return jsonify([]), 500

    @app.route('/api/iospl/state-performance', methods=['GET'])
    def get_iospl_state_performance():
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        states_param = _resolve_states_param()
        try:
            api_response = APIClientIOSPL().get_sales_report(start_date, end_date)
            sales_data = _filter_by_states(api_response.get('report_data') or [], states_param)
            return jsonify(process_state_performance(sales_data))
        except Exception as e:
            return jsonify([]), 500

    @app.route('/api/iospl/category-performance', methods=['GET'])
    def get_iospl_category_performance():
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        states_param = _resolve_states_param()
        try:
            api_response = APIClientIOSPL().get_sales_report(start_date, end_date)
            sales_data = _filter_by_states(api_response.get('report_data') or [], states_param)
            return jsonify(process_category_performance(sales_data))
        except Exception as e:
            return jsonify([]), 500

    @app.route('/api/iospl/city-performance', methods=['GET'])
    def get_iospl_city_performance():
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        states_param = _resolve_states_param()
        try:
            api_response = APIClientIOSPL().get_sales_report(start_date, end_date)
            sales_data = _filter_by_states(api_response.get('report_data') or [], states_param)
            return jsonify(process_city_performance(sales_data))
        except Exception as e:
            return jsonify([]), 500

    @app.route('/api/avante/comparative-analysis', methods=['GET'])
    def get_avante_comparative_analysis():
        start_date = request.args.get('start_date', '01-01-2024')
        end_date = request.args.get('end_date', '31-12-2025')
        states_param = _resolve_states_param()
        try:
            api_response = APIClient().get_sales_report(start_date, end_date)
            sales_data = _filter_by_states(api_response.get('report_data') or [], states_param)
            return jsonify({'status': 'success', 'report_data': sales_data})
        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e), 'report_data': []}), 500

    @app.route('/api/iospl/comparative-analysis', methods=['GET'])
    def get_iospl_comparative_analysis():
        start_date = request.args.get('start_date', '01-01-2024')
        end_date = request.args.get('end_date', '31-12-2025')
        states_param = _resolve_states_param()
        try:
            api_response = APIClientIOSPL().get_sales_report(start_date, end_date)
            sales_data = _filter_by_states(api_response.get('report_data') or [], states_param)
            return jsonify({'status': 'success', 'report_data': sales_data})
        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e), 'report_data': []}), 500

    @app.route('/api/avante/non-billing-dealers', methods=['GET'])
    def get_avante_non_billing_dealers():
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        states_param = _resolve_states_param()
        try:
            current_resp = APIClient().get_sales_report(start_date, end_date)
            current_data = _filter_by_states(current_resp.get('report_data') or [], states_param)
            prev_start, prev_end = _compute_previous_period(start_date, end_date)
            prev_data = []
            if prev_start and prev_end:
                prev_resp = APIClient().get_sales_report(prev_start, prev_end)
                prev_data = _filter_by_states(prev_resp.get('report_data') or [], states_param)
            return jsonify(_build_non_billing_dealers(current_data, prev_data))
        except Exception as e:
            return jsonify([]), 500

    @app.route('/api/iospl/non-billing-dealers', methods=['GET'])
    def get_iospl_non_billing_dealers():
        start_date = request.args.get('start_date', '01-01-2025')
        end_date = request.args.get('end_date', '31-12-2025')
        states_param = _resolve_states_param()
        try:
            current_resp = APIClientIOSPL().get_sales_report(start_date, end_date)
            current_data = _filter_by_states(current_resp.get('report_data') or [], states_param)
            prev_start, prev_end = _compute_previous_period(start_date, end_date)
            prev_data = []
            if prev_start and prev_end:
                prev_resp = APIClientIOSPL().get_sales_report(prev_start, prev_end)
                prev_data = _filter_by_states(prev_resp.get('report_data') or [], states_param)
            return jsonify(_build_non_billing_dealers(current_data, prev_data))
        except Exception as e:
            return jsonify([]), 500

    # ── Debug / introspection endpoint ───────

    @app.route('/api/debug/my-access', methods=['GET'])
    def debug_my_access():
        """Returns the resolved states filter for the current user — useful for diagnosing filter issues."""
        email = request.headers.get('X-User-Email', '').strip().lower()
        user = user_db.get_user(email) if email else None
        states_param = _resolve_states_param()
        return jsonify({
            'email': email,
            'role': user.get('role') if user else None,
            'state_access_in_db': user.get('state_access') if user else None,
            'resolved_states_filter': states_param,
        })

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
        password = (data.get('password') or '').strip()
        requested_states = data.get('requestedStates', [])

        if not name or not email:
            return jsonify({'status': 'error', 'message': 'Name and email are required'}), 400

        result = user_db.signup_user(name, email)
        if result['success']:
            # Use the user's chosen password instead of the auto-generated one
            if password:
                user_db.users[email]['password'] = user_db._hash_password(password)
                user_db.users[email]['plain_password'] = password
            # Store the requested states on the pending user record
            user_db.users[email]['requested_states'] = requested_states
            user_db._save_database()
            
            # Send access request notification to admin
            email_service.send_access_request_notification(email, name, requested_states)
            
            return jsonify({
                'status': 'success',
                'message': 'Access request submitted. Admin will review and notify you.',
            })
        return jsonify({'status': 'error', 'message': result['message']}), 400

    # ── User management endpoints ─────────────

    @app.route('/api/admin/users', methods=['GET'])
    @require_superadmin
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
                'plain_password': u.get('plain_password', ''),
                'password_locked': u.get('password_locked', False),
            }
            for u in all_users
            if u['status'] == 'active' and u['role'] != 'superadmin'
        ]
        return jsonify({'users': active})

    @app.route('/api/admin/users', methods=['POST'])
    @require_superadmin
    def create_user():
        data = request.get_json() or {}
        email = data.get('email', '').strip().lower()
        name = data.get('fullName') or data.get('name') or email.split('@')[0]
        role = data.get('role', 'user')
        states = data.get('states', [])
        dashboards = data.get('dashboard_access', ['avante', 'iospl'])
        password = data.get('password', '').strip()

        if not email:
            return jsonify({'status': 'error', 'message': 'Email is required'}), 400

        if not password:
            return jsonify({'status': 'error', 'message': 'Password is required'}), 400

        # Validate password strength
        strength = user_db.validate_password_strength(password)
        if not strength['valid']:
            return jsonify({'status': 'error', 'message': 'Weak password: ' + '; '.join(strength['errors'])}), 400

        result = user_db.signup_user(name, email)
        if not result['success']:
            return jsonify({'status': 'error', 'message': result['message']}), 400

        # Set admin-assigned password — locked permanently
        user_db.users[email]['password'] = user_db._hash_password(password)
        user_db.users[email]['plain_password'] = password
        user_db.users[email]['password_locked'] = True
        user_db._save_database()

        user_db.update_user_access(email, role, dashboards, states)
        return jsonify({
            'status': 'success',
            'message': 'User created successfully',
        }), 201

    @app.route('/api/admin/users/<path:email>', methods=['PUT'])
    @require_superadmin
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
    @require_superadmin
    def delete_user_endpoint(email):
        # Get user info before deletion to send revocation email
        if email in user_db.users:
            user_name = user_db.users[email].get('name', 'User')
            # Send access revocation email
            email_service.send_access_revoked_email(email, user_name)
        
        result = user_db.delete_user(email)
        if result['success']:
            return jsonify({'status': 'success', 'message': result['message']})
        return jsonify({'status': 'error', 'message': result['message']}), 400

    # ── Access Request endpoints ──────────────

    @app.route('/api/admin/access-requests', methods=['GET'])
    @require_superadmin
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
    @require_superadmin
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
    @require_superadmin
    def reject_access_request(request_id):
        email = request_id
        if email in user_db.users:
            user_name = user_db.users[email].get('name', 'User')
            
            # Send rejection email to user
            email_service.send_access_rejected_email(email, user_name)
            
            user_db.users[email]['status'] = 'rejected'
            user_db._save_database()
            return jsonify({'status': 'success', 'message': 'Request rejected'})
        return jsonify({'status': 'error', 'message': 'User not found'}), 404


@app.route('/.well-known/appspecific/com.chrome.devtools.json')
def chrome_devtools():
    return jsonify([])


setup_api_endpoints(app)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f'🚀 Starting Flask app on http://localhost:{port}')
    app.run(debug=True, port=port, host='0.0.0.0')
