"""
Data filtering utility functions
"""
import pandas as pd


def filter_my_charts_data(df, use_iospl=False, hide_avante=False, hide_innovative=False):
    """
    Filter data for 'My Charts' section based on dashboard mode and filters
    
    Args:
        df: DataFrame to filter
        use_iospl: If True, using IOSPL mode
        hide_avante: If True, hide Avante data (only in IOSPL mode)
        hide_innovative: If True, hide Innovative dealer data (only in Avante mode)
        
    Returns:
        Filtered DataFrame
    """
    if df is None or df.empty:
        return df
    
    # Convert numeric columns
    if 'Value' in df.columns:
        df['Value'] = pd.to_numeric(df['Value'], errors='coerce')
    if 'Qty' in df.columns:
        df['Qty'] = pd.to_numeric(df['Qty'], errors='coerce')
    
    # IOSPL Mode: Apply filter based on hide_avante checkbox
    if use_iospl and 'Dealer Name' in df.columns:
        if hide_avante:
            # Show only Innovative data when checkbox is checked
            df = df[df['Dealer Name'].str.contains('Innovative', case=False, na=False)]
    
    # Avante Mode: Apply filter for Innovative (when checkbox is checked)
    if not use_iospl and hide_innovative and 'Dealer Name' in df.columns:
        df = df[~df['Dealer Name'].str.contains('Innovative', case=False, na=False)]
    
    return df


def filter_custom_chart_data(df, use_iospl=False, hide_avante=False, hide_innovative=False):
    """
    Filter data for custom chart builder based on dashboard mode and filters
    
    Args:
        df: DataFrame to filter
        use_iospl: If True, using IOSPL mode
        hide_avante: If True, hide Avante data (only in IOSPL mode)
        hide_innovative: If True, hide Innovative dealer data (only in Avante mode)
        
    Returns:
        Filtered DataFrame
    """
    if df is None or df.empty:
        return df
    
    # Convert numeric columns
    if 'Value' in df.columns:
        df['Value'] = pd.to_numeric(df['Value'], errors='coerce')
    if 'Qty' in df.columns:
        df['Qty'] = pd.to_numeric(df['Qty'], errors='coerce')
    
    # IOSPL Mode: Apply filter based on hide_avante checkbox
    if use_iospl and 'Dealer Name' in df.columns:
        if hide_avante:
            # Show only Innovative data when checkbox is checked
            df = df[df['Dealer Name'].str.contains('Innovative', case=False, na=False)]
    
    # Avante Mode: Apply filter for Innovative (when checkbox is checked)
    if not use_iospl and hide_innovative and 'Dealer Name' in df.columns:
        df = df[~df['Dealer Name'].str.contains('Innovative', case=False, na=False)]
    
    return df
