"""
Lightweight TTL in-memory cache so repeated dashboard refreshes
don't re-scan the Parquet file.
"""
import time
import functools
from typing import Any, Callable

_store: dict[str, tuple[Any, float]] = {}
DEFAULT_TTL = 300  # 5 minutes


def cached(ttl: int = DEFAULT_TTL):
    """Decorator – caches the return value of sync functions by their args."""
    def decorator(fn: Callable):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            key = f"{fn.__qualname__}:{args}:{kwargs}"
            if key in _store:
                value, expires = _store[key]
                if time.monotonic() < expires:
                    return value
            result = fn(*args, **kwargs)
            _store[key] = (result, time.monotonic() + ttl)
            return result
        return wrapper
    return decorator


def invalidate_all():
    _store.clear()
