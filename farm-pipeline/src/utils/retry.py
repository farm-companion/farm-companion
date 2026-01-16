"""
Retry Logic with Exponential Backoff

Provides decorators and utilities for retrying failed operations
with exponential backoff and jitter.
"""

import asyncio
import functools
import logging
import random
from typing import Callable, Optional, Tuple, Type

logger = logging.getLogger(__name__)


def exponential_backoff(
    attempt: int,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    jitter: bool = True
) -> float:
    """
    Calculate exponential backoff delay with optional jitter

    Args:
        attempt: Current retry attempt (0-indexed)
        base_delay: Base delay in seconds
        max_delay: Maximum delay in seconds
        jitter: Add random jitter to prevent thundering herd

    Returns:
        Delay in seconds
    """
    delay = min(base_delay * (2 ** attempt), max_delay)

    if jitter:
        # Add random jitter (±25%)
        jitter_range = delay * 0.25
        delay = delay + random.uniform(-jitter_range, jitter_range)

    return max(0, delay)


def retry_async(
    max_attempts: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exceptions: Tuple[Type[Exception], ...] = (Exception,),
    on_retry: Optional[Callable] = None
):
    """
    Decorator for retrying async functions with exponential backoff

    Args:
        max_attempts: Maximum number of retry attempts
        base_delay: Base delay between retries (seconds)
        max_delay: Maximum delay between retries (seconds)
        exceptions: Tuple of exception types to retry on
        on_retry: Optional callback function called before each retry

    Example:
        @retry_async(max_attempts=3, base_delay=2)
        async def fetch_data(url: str):
            async with httpx.AsyncClient() as client:
                response = await client.get(url)
                response.raise_for_status()
                return response.json()
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None

            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e

                    if attempt == max_attempts - 1:
                        # Last attempt, re-raise
                        logger.error(
                            f"Function {func.__name__} failed after {max_attempts} attempts: {e}"
                        )
                        raise

                    # Calculate backoff delay
                    delay = exponential_backoff(attempt, base_delay, max_delay)

                    logger.warning(
                        f"Attempt {attempt + 1}/{max_attempts} failed for {func.__name__}: {e}. "
                        f"Retrying in {delay:.2f}s..."
                    )

                    # Call retry callback if provided
                    if on_retry:
                        try:
                            await on_retry(attempt, e, delay)
                        except Exception as callback_error:
                            logger.error(f"Retry callback failed: {callback_error}")

                    # Wait before retry
                    await asyncio.sleep(delay)

            # Should never reach here, but just in case
            raise last_exception

        return wrapper
    return decorator


def retry_sync(
    max_attempts: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exceptions: Tuple[Type[Exception], ...] = (Exception,)
):
    """
    Decorator for retrying synchronous functions with exponential backoff

    Args:
        max_attempts: Maximum number of retry attempts
        base_delay: Base delay between retries (seconds)
        max_delay: Maximum delay between retries (seconds)
        exceptions: Tuple of exception types to retry on

    Example:
        @retry_sync(max_attempts=3, base_delay=2)
        def save_to_file(path: str, data: str):
            with open(path, 'w') as f:
                f.write(data)
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            import time
            last_exception = None

            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e

                    if attempt == max_attempts - 1:
                        logger.error(
                            f"Function {func.__name__} failed after {max_attempts} attempts: {e}"
                        )
                        raise

                    delay = exponential_backoff(attempt, base_delay, max_delay)

                    logger.warning(
                        f"Attempt {attempt + 1}/{max_attempts} failed for {func.__name__}: {e}. "
                        f"Retrying in {delay:.2f}s..."
                    )

                    time.sleep(delay)

            raise last_exception

        return wrapper
    return decorator


class RetryContext:
    """
    Context manager for retry logic

    Example:
        async with RetryContext(max_attempts=3, base_delay=2) as retry:
            async with httpx.AsyncClient() as client:
                response = await client.get(url)
                if response.status_code != 200:
                    retry.should_retry(ValueError("Bad status"))
                return response.json()
    """

    def __init__(
        self,
        max_attempts: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        exceptions: Tuple[Type[Exception], ...] = (Exception,)
    ):
        self.max_attempts = max_attempts
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exceptions = exceptions
        self.attempt = 0

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type and issubclass(exc_type, self.exceptions):
            self.attempt += 1

            if self.attempt < self.max_attempts:
                delay = exponential_backoff(
                    self.attempt - 1,
                    self.base_delay,
                    self.max_delay
                )

                logger.warning(
                    f"Attempt {self.attempt}/{self.max_attempts} failed: {exc_val}. "
                    f"Retrying in {delay:.2f}s..."
                )

                await asyncio.sleep(delay)
                return True  # Suppress exception and retry

            logger.error(
                f"Operation failed after {self.max_attempts} attempts: {exc_val}"
            )

        return False  # Re-raise exception

    def should_retry(self, exception: Exception):
        """Manually trigger a retry"""
        raise exception


# Common retry configurations

# For API calls (aggressive retry)
API_RETRY_CONFIG = {
    'max_attempts': 5,
    'base_delay': 1.0,
    'max_delay': 30.0,
    'exceptions': (ConnectionError, TimeoutError)
}

# For database operations (moderate retry)
DB_RETRY_CONFIG = {
    'max_attempts': 3,
    'base_delay': 0.5,
    'max_delay': 10.0,
}

# For file I/O (quick retry)
FILE_RETRY_CONFIG = {
    'max_attempts': 3,
    'base_delay': 0.1,
    'max_delay': 1.0,
}
