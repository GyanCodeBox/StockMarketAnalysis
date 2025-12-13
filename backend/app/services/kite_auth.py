"""
Kite Connect Authentication Helper

Provides utilities for automatic access token generation
"""
import os
import logging
from typing import Optional, Dict, Any
from urllib.parse import urlparse, parse_qs

logger = logging.getLogger(__name__)

try:
    from kiteconnect import KiteConnect
except ImportError:
    KiteConnect = None


class KiteAuth:
    """Helper class for Kite Connect authentication"""
    
    def __init__(self, api_key: str, api_secret: str):
        self.api_key = api_key
        self.api_secret = api_secret
        self.kite = None
        
        if KiteConnect:
            self.kite = KiteConnect(api_key=api_key)
    
    def get_login_url(self) -> Optional[str]:
        """
        Get the login URL for Kite Connect OAuth
        
        Returns:
            Login URL string or None if KiteConnect not available
        """
        if not self.kite:
            return None
        
        try:
            return self.kite.login_url()
        except Exception as e:
            logger.error(f"Error generating login URL: {e}")
            return None
    
    def extract_request_token(self, redirect_url: str) -> Optional[str]:
        """
        Extract request token from redirect URL
        
        Args:
            redirect_url: The URL redirected to after login
            
        Returns:
            Request token string or None if extraction fails
        """
        try:
            parsed_url = urlparse(redirect_url)
            query_params = parse_qs(parsed_url.query)
            
            if 'request_token' not in query_params:
                return None
            
            return query_params['request_token'][0]
        except Exception as e:
            logger.error(f"Error extracting request token: {e}")
            return None
    
    def generate_access_token(self, request_token: str) -> Optional[Dict[str, Any]]:
        """
        Generate access token from request token
        
        Args:
            request_token: Request token from OAuth redirect
            
        Returns:
            Dictionary with access_token and user info, or None if failed
        """
        if not self.kite:
            return None
        
        try:
            data = self.kite.generate_session(
                request_token,
                api_secret=self.api_secret
            )
            return data
        except Exception as e:
            logger.error(f"Error generating access token: {e}")
            return None
    
    def validate_access_token(self, access_token: str) -> bool:
        """
        Validate if an access token is still valid
        
        Args:
            access_token: Access token to validate
            
        Returns:
            True if valid, False otherwise
        """
        if not self.kite:
            return False
        
        try:
            self.kite.set_access_token(access_token)
            # Try a simple API call to validate
            self.kite.profile()
            return True
        except Exception as e:
            logger.warning(f"Access token validation failed: {e}")
            return False

