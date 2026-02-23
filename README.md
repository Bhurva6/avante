# 🏥 Avante Orthopedic Implant Analytics Dashboard

A professional, production-ready analytics dashboard for monitoring and analyzing orthopedic implant sales data across India. Built with Dash/Plotly for interactive visualizations and real-time data analysis.

## ✨ Features

### 📊 Dual Dashboard System
- **Avante Dashboard** - Main sales analytics for Avante Medicals
- **IOSPL Dashboard** - Dedicated IOSPL analytics
- Seamless toggle between both dashboards

### 📈 Analytics & Visualizations
- **Sales Overview** - Revenue, quantity, dealers, products metrics with trends
- **Geographic Analysis** - Interactive India map with state/city breakdowns
- **Dealer Performance** - Top dealers by revenue and quantity
- **Product Analysis** - Category-wise sales, trending products
- **Time Series** - Revenue trends, daily/weekly/monthly patterns
- **Comparative Analysis** - Period-over-period comparisons
- **Custom Chart Builder** - Create and save custom visualizations

### 🎯 Advanced Features
- **Slow-Moving Items Tracker** - Identify products with low sales velocity
- **Inactive Dealers Dashboard** - Track dealers with no recent activity
- **Time Comparative Analysis** - Multi-period trend analysis
- **CRM Data Table** - Comprehensive sales data with advanced filtering
- **Export Capabilities** - Download reports in Excel format
- **Interactive Maps** - Leaflet-based geographic visualizations

### 🔐 Authentication & Access Control
- Secure login system with encrypted passwords (SHA-256)
- Role-based access control (Superadmin, Admin, User)
- Dashboard-specific permissions (Avante/IOSPL)
- State-level access restrictions
- User management panel for admins

### 🚀 Performance
- Redis caching for fast data loading (optional)
- Optimized API calls with memoization
- Responsive UI with modern Lux theme
- Mobile-friendly interface

## 🏗️ Project Structure

```
dashboard/
├── app.py                      # Main Dash application (9760 lines - to be refactored)
├── wsgi.py                     # WSGI server configuration
├── requirements.txt            # Python dependencies
├── Procfile                    # Railway/Heroku deployment
├── runtime.txt                 # Python 3.13
├── railway.json                # Railway configuration
├── vercel.json                 # Vercel configuration
├── pyproject.toml              # Project metadata
├── src/                        # Modular source code
│   ├── api/                    # API clients
│   │   ├── avante_client.py   # ✅ Avante ERP API
│   │   └── iospl_client.py    # ✅ IOSPL ERP API
│   ├── auth/                   # Authentication
│   │   └── database.py        # ✅ User database management
│   ├── config/                 # Configuration
│   │   └── settings.py        # ✅ App settings & constants
│   └── utils/                  # Utilities
│       ├── formatters.py      # ✅ Number/currency formatting
│       ├── filters.py         # ✅ Data filtering
│       └── email_service.py   # ✅ Email service
├── assets/                     # Static assets
│   ├── custom.css             # Custom styles
│   ├── fullscreen_charts.js   # Chart interactions
│   └── indian_number_format.js # Number formatting
└── users_database.json         # User credentials database
```

## 🚀 Quick Start

### Prerequisites
- Python 3.9+ (3.13 recommended)
- Redis (optional, for caching)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Bhurva6/sales-dashboard.git
cd sales-dashboard
```

2. **Create virtual environment**
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables** (optional)
Create a `.env` file:
```bash
REDIS_URL=redis://localhost:6379
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=noreply@avante.com
SENDER_PASSWORD=your_password
LOG_LEVEL=INFO
```

5. **Run the application**
```bash
python app.py
```

The dashboard will be available at `http://localhost:8050`

### Default Login Credentials
```
Email: admin@avante.com
Password: Admin@123
```

## 🔌 API Configuration

### Avante API
- **Endpoint**: `http://avantemedicals.com/API/api.php?action=get_sales_report`
- **Authentication**: Username: `u2vp8kb`, Password: `asdftuy#$%78@!`
- **Method**: POST
- **Request Body**:
```json
{
    "startdate": "dd-mm-yyyy",
    "enddate": "dd-mm-yyyy"
}
```

### IOSPL API
- **Endpoint**: `http://avantemedicals.com/API/api.php?action=get_iospl_sales_report`
- **Authentication**: Username: `u2vp8kb`, Password: `asdftuy#$%78@!`
- **Method**: POST
- **Request Body**:
```json
{
    "startdate": "dd-mm-yyyy",
    "enddate": "dd-mm-yyyy"
}
```

### API Response Format
Both APIs return data in this format:
```json
{
    "status": "success",
    "report_data": [
        {
            "cust_id": "38",
            "id": "12",
            "comp_nm": "DEALER NAME",
            "city": "CITY NAME",
            "state": "STATE NAME",
            "parent_category": "Category Name",
            "category_name": "Product Name",
            "meta_keyword": "PRODUCT-CODE",
            "SQ": "56",      // Quantity
            "SV": "1412.13"  // Sales Value
        }
    ]
}
```

**Column Mapping**:
- `comp_nm` → Dealer Name
- `parent_category` → Category
- `category_name` → Product
- `meta_keyword` → Code
- `SQ` → Qty
- `SV` → Value

## 🔧 Configuration

### Cache Configuration
```python
# With Redis (Production)
REDIS_URL=redis://localhost:6379

# Without Redis (Development) - Uses SimpleCache
# Just don't set REDIS_URL
```

### Email Configuration
For sending user credentials via email:
```bash
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=your-email@domain.com
SENDER_PASSWORD=your-app-password
```

## 📦 Deployment

### Railway
```bash
railway up
```

### Vercel
```bash
vercel deploy
```

### Heroku
```bash
git push heroku main
```

### Docker
```dockerfile
FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8050
CMD ["gunicorn", "wsgi:server", "-w", "4", "-b", "0.0.0.0:8050"]
```

## 🔐 User Management

### Roles
- **Superadmin** - Full access, cannot be modified
- **Admin** - Can manage users, access all dashboards/states
- **User** - Limited access based on assigned permissions

### Access Control
- Dashboard-specific access (Avante, IOSPL)
- State-level data filtering
- User creation and management
- Password generation and reset
- Email credentials to new users

## 🎨 Customization

### Adding New Charts
Charts are defined in `app.py` (to be refactored into `src/components/charts.py`):
```python
def _create_custom_chart(df, value_col):
    fig = px.bar(df, x='Category', y=value_col)
    return apply_modern_chart_style(fig, "Custom Chart")
```

### Custom Filters
Add filtering logic in `src/utils/filters.py`:
```python
def filter_custom_data(df, **kwargs):
    # Your filtering logic
    return filtered_df
```

### Styling
Modify `assets/custom.css` for custom styling.

## 📊 Data Flow

1. **User Login** → Authentication via `src/auth/database.py`
2. **Date Selection** → Converted to DD-MM-YYYY format
3. **API Call** → `src/api/avante_client.py` or `src/api/iospl_client.py`
4. **Data Processing** → Column mapping, cleaning, numeric conversion
5. **Caching** → Redis/SimpleCache for 5 minutes
6. **Visualization** → Plotly charts with modern styling
7. **Filtering** → Interactive dropdowns and selections

## 🐛 Troubleshooting

### Port already in use
```bash
lsof -ti:8050 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :8050   # Windows
```

### Import errors
```bash
# Ensure src/ is in Python path
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

### Cache issues
```bash
# Clear Redis cache
redis-cli FLUSHALL

# Or restart without cache
unset REDIS_URL
```

### No data showing
- Check API endpoints are accessible
- Verify date format (DD-MM-YYYY)
- Check browser console for errors
- Verify API returns 'status': 'success'

## 📝 Development

### Code Structure
- Main application: `app.py` (currently monolithic - 9760 lines)
- Modular components: `src/` directory
- Static assets: `assets/`
- Configuration: `src/config/settings.py`

### Linting
```bash
black src/
flake8 src/
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential.

## 👥 Authors

- Bhurva Sharma - [@Bhurva6](https://github.com/Bhurva6)

## 🙏 Acknowledgments

- [Dash](https://dash.plotly.com/) - Python framework for building web applications
- [Plotly](https://plotly.com/) - Interactive charting library
- [Dash Bootstrap Components](https://dash-bootstrap-components.opensource.faculty.ai/) - Bootstrap components for Dash
- [Dash Leaflet](https://www.dash-leaflet.com/) - Leaflet maps for Dash
- [Flask-Caching](https://flask-caching.readthedocs.io/) - Caching extension

## 📞 Support

For issues or questions:
1. Check existing issues on GitHub
2. Create a new issue with detailed description
3. Contact the development team

## 🔄 Version History

- **v2.0.0** (Current) - Modular refactoring, dual API support, improved performance
- **v1.x** - Initial release with core features

## � Known Issues

- **Frontend showing empty**: Chart callbacks may have React child errors
- **Date column warnings**: API doesn't provide Date field (synthetic date added)
- **Monolithic app.py**: Needs to be broken down into modular components

## 📌 Roadmap

- [ ] Break down `app.py` into modular components
- [ ] Add unit tests for all modules
- [ ] Implement proper error handling
- [ ] Add data export to PDF
- [ ] Implement real-time data updates
- [ ] Add predictive analytics
- [ ] Mobile app version

---

**Built with ❤️ for Avante Healthcare Solutions**

**Last Updated**: February 11, 2025
