"""
Avante API Client - Clean Implementation
Fetches sales data from Avante Medicals ERP API
"""

import os
import requests
import logging
import pandas as pd
from datetime import datetime
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('avante_api')


class APIClient:
    """API Client for Avante ERP Sales Data"""

    BASE_URL = "http://order.avantemedicals.com/API/api.php"

    def __init__(self, username: str = None, password: str = None):
        """Initialize API client. Credentials come from args, then env vars."""
        self.username = username or os.getenv('AVANTE_API_USERNAME', '')
        self.password = password or os.getenv('AVANTE_API_PASSWORD', '')
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json'
        })
        self._token: Optional[str] = None

    def _login(self) -> bool:
        """Authenticate against the ERP API and cache the bearer token."""
        if not self.username or not self.password:
            logger.error("❌ AVANTE_API_USERNAME/AVANTE_API_PASSWORD not configured")
            return False

        try:
            url = f"{self.BASE_URL}?action=login"
            response = self.session.post(
                url,
                json={"username": self.username, "password": self.password},
                timeout=30
            )
            response.raise_for_status()
            data = response.json()

            token = data.get('token')
            if data.get('status') == 'success' and token:
                self._token = token
                self.session.headers.update({'Authorization': f'Bearer {token}'})
                logger.info("✅ Avante ERP login successful")
                return True

            logger.error(f"❌ Avante ERP login failed: {data.get('message', 'Unknown error')}")
            return False
        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Avante ERP login request failed: {str(e)}")
            return False

    def _ensure_token(self) -> bool:
        if self._token:
            return True
        return self._login()

    def get_sales_report(self, start_date: str, end_date: str) -> Dict[str, Any]:
        """
        Fetch Avante sales report data from the API

        Args:
            start_date: Start date in DD-MM-YYYY format (e.g., "01-01-2025")
            end_date: End date in DD-MM-YYYY format (e.g., "31-12-2025")

        Returns:
            Dictionary with 'status' and 'report_data' keys
        """
        logger.info(f"📥 Fetching Avante sales data: {start_date} to {end_date}")

        if not self._ensure_token():
            return {'status': 'error', 'message': 'Authentication failed', 'report_data': []}

        try:
            url = f"{self.BASE_URL}?action=get_sales_report"

            payload = {
                "startdate": start_date,
                "enddate": end_date
            }

            logger.debug(f"Request URL: {url}")
            logger.debug(f"Request Payload: {payload}")

            response = self.session.post(url, json=payload, timeout=30)

            # Token may have expired — retry once after a fresh login
            if response.status_code == 401:
                self._token = None
                if not self._ensure_token():
                    return {'status': 'error', 'message': 'Authentication failed', 'report_data': []}
                response = self.session.post(url, json=payload, timeout=30)

            response.raise_for_status()

            data = response.json()

            if data.get('status') == 'success':
                record_count = len(data.get('report_data', []))
                logger.info(f"✅ Successfully fetched {record_count} Avante records")
                return data
            else:
                logger.error(f"❌ API returned error: {data.get('message', 'Unknown error')}")
                return {'status': 'error', 'message': data.get('message', 'Unknown error'), 'report_data': []}

        except requests.exceptions.RequestException as e:
            logger.error(f"❌ Request failed: {str(e)}")
            return {'status': 'error', 'message': str(e), 'report_data': []}
        except Exception as e:
            logger.error(f"❌ Unexpected error: {str(e)}")
            return {'status': 'error', 'message': str(e), 'report_data': []}
    
    def get_sales_dataframe(self, start_date: str, end_date: str) -> pd.DataFrame:
        """
        Fetch sales data and return as pandas DataFrame with standardized columns
        
        Args:
            start_date: Start date in DD-MM-YYYY format
            end_date: End date in DD-MM-YYYY format
            
        Returns:
            DataFrame with standardized columns
        """
        response = self.get_sales_report(start_date, end_date)
        
        if response.get('status') != 'success':
            logger.warning("No data returned from API")
            return pd.DataFrame()
        
        data = response.get('report_data', [])
        
        if not data:
            logger.warning("Empty report_data from API")
            return pd.DataFrame()
        
        # Convert to DataFrame
        df = pd.DataFrame(data)
        
        # Standardize column names
        column_mapping = {
            'comp_nm': 'Dealer Name',
            'city': 'City',
            'state': 'State',
            'parent_category': 'Category',
            'category_name': 'Product',
            'meta_keyword': 'Code',
            'SQ': 'Qty',
            'SV': 'Value'
        }
        
        df = df.rename(columns=column_mapping)
        
        # Convert numeric columns
        if 'Qty' in df.columns:
            df['Qty'] = pd.to_numeric(df['Qty'], errors='coerce').fillna(0)
        
        if 'Value' in df.columns:
            df['Value'] = pd.to_numeric(df['Value'], errors='coerce').fillna(0)
        
        # Clean text columns
        text_columns = ['Dealer Name', 'City', 'State', 'Category', 'Product', 'Code']
        for col in text_columns:
            if col in df.columns:
                df[col] = df[col].astype(str).str.strip()
        
        logger.info(f"📊 DataFrame created with {len(df)} rows and {len(df.columns)} columns")
        
        return df
