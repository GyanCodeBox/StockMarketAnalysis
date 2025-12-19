import time
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class SimpleCache:
    """
    A simple in-memory cache with TTL.
    """
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    def get(self, key: str) -> Optional[Any]:
        """Get item from cache if it hasn't expired"""
        if key in self._cache:
            item = self._cache[key]
            if time.time() < item['expires']:
                logger.debug(f"Cache hit for {key}")
                return item['data']
            else:
                logger.debug(f"Cache expired for {key}")
                del self._cache[key]
        return None

    def set(self, key: str, data: Any, ttl_seconds: int = 3600):
        """Set item in cache with a TTL"""
        self._cache[key] = {
            'data': data,
            'expires': time.time() + ttl_seconds
        }
        logger.debug(f"Cache set for {key} (TTL: {ttl_seconds}s)")

# Global cache instance
cache_manager = SimpleCache()
