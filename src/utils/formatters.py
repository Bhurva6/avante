"""
Formatting utility functions for numbers, currency, and text
"""
import pandas as pd


def truncate_text(text, max_length=30):
    """
    Truncate text to max_length with ellipsis
    
    Args:
        text: Text to truncate
        max_length: Maximum length before truncation
        
    Returns:
        Truncated text with '...' if needed
    """
    if not text or not isinstance(text, str):
        return str(text)
    
    if len(text) <= max_length:
        return text
    return text[:max_length-3] + '...'


def format_indian_number(value):
    """
    Format number in Indian numbering system (lakhs, crores)
    
    Args:
        value: Numeric value to format
        
    Returns:
        Formatted string (e.g., "12,34,567")
    """
    try:
        value = float(value)
        
        if value < 0:
            negative = True
            value = abs(value)
        else:
            negative = False
        
        # Convert to string and split
        value_str = f"{value:.2f}"
        int_part, dec_part = value_str.split('.')
        
        # Indian number formatting
        if len(int_part) <= 3:
            formatted = int_part
        else:
            # Last 3 digits
            formatted = int_part[-3:]
            int_part = int_part[:-3]
            
            # Add commas every 2 digits
            while len(int_part) > 2:
                formatted = int_part[-2:] + ',' + formatted
                int_part = int_part[:-2]
            
            if int_part:
                formatted = int_part + ',' + formatted
        
        result = f"{formatted}.{dec_part}"
        
        if negative:
            result = f"-{result}"
        
        return result
        
    except (ValueError, TypeError):
        return str(value)


def format_inr(value):
    """
    Format value as Indian Rupees
    
    Args:
        value: Numeric value to format
        
    Returns:
        Formatted string with ₹ symbol (e.g., "₹12,34,567.00")
    """
    try:
        value = float(value)
        formatted = format_indian_number(value)
        return f"₹{formatted}"
    except (ValueError, TypeError):
        return "₹0.00"


def format_qty(value):
    """
    Format quantity value (no decimal places)
    
    Args:
        value: Numeric quantity value
        
    Returns:
        Formatted string (e.g., "12,34,567")
    """
    try:
        value = int(float(value))
        
        if value < 0:
            negative = True
            value = abs(value)
        else:
            negative = False
        
        value_str = str(value)
        
        # Indian number formatting
        if len(value_str) <= 3:
            formatted = value_str
        else:
            # Last 3 digits
            formatted = value_str[-3:]
            value_str = value_str[:-3]
            
            # Add commas every 2 digits
            while len(value_str) > 2:
                formatted = value_str[-2:] + ',' + formatted
                value_str = value_str[:-2]
            
            if value_str:
                formatted = value_str + ',' + formatted
        
        if negative:
            formatted = f"-{formatted}"
        
        return formatted
        
    except (ValueError, TypeError):
        return str(value)
