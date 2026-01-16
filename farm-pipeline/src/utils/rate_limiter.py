"""
Rate Limiting Module

Provides rate limiting utilities to prevent API throttling
and respect API rate limits.
"""

import asyncio
import time
from typing import Optional, Dict
from collections import deque
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class RateLimitConfig:
    """Configuration for rate limiting"""
    max_requests: int  # Maximum requests
    time_window: float  # Time window in seconds
    burst_size: Optional[int] = None  # Optional burst size


class RateLimiter:
    """
    Token bucket rate limiter

    Allows a certain number of requests per time window,
    with optional burst capacity.

    Example:
        # Allow 10 requests per second with burst of 20
        limiter = RateLimiter(max_requests=10, time_window=1.0, burst_size=20)

        async with limiter:
            result = await make_api_call()
    """

    def __init__(
        self,
        max_requests: int,
        time_window: float = 1.0,
        burst_size: Optional[int] = None
    ):
        """
        Initialize rate limiter

        Args:
            max_requests: Maximum number of requests per time window
            time_window: Time window in seconds
            burst_size: Optional burst size (default: max_requests)
        """
        self.max_requests = max_requests
        self.time_window = time_window
        self.burst_size = burst_size or max_requests

        self.tokens = self.burst_size
        self.last_update = time.time()
        self.lock = asyncio.Lock()

    async def acquire(self, tokens: int = 1):
        """
        Acquire tokens (wait if necessary)

        Args:
            tokens: Number of tokens to acquire
        """
        async with self.lock:
            while True:
                # Refill tokens based on time elapsed
                now = time.time()
                elapsed = now - self.last_update
                refill = elapsed * (self.max_requests / self.time_window)

                self.tokens = min(self.burst_size, self.tokens + refill)
                self.last_update = now

                # Check if we have enough tokens
                if self.tokens >= tokens:
                    self.tokens -= tokens
                    return

                # Calculate wait time
                tokens_needed = tokens - self.tokens
                wait_time = (tokens_needed / self.max_requests) * self.time_window

                logger.debug(f"Rate limit reached, waiting {wait_time:.2f}s")

                # Release lock while waiting
                self.lock.release()
                await asyncio.sleep(wait_time)
                await self.lock.acquire()

    async def __aenter__(self):
        """Context manager support"""
        await self.acquire()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager support"""
        return False


class AdaptiveRateLimiter:
    """
    Adaptive rate limiter that adjusts based on API responses

    Automatically backs off when encountering rate limit errors
    and gradually increases rate when successful.

    Example:
        limiter = AdaptiveRateLimiter(initial_rate=10, min_rate=1, max_rate=50)

        async with limiter:
            try:
                result = await make_api_call()
                limiter.on_success()
            except RateLimitError:
                limiter.on_rate_limit()
    """

    def __init__(
        self,
        initial_rate: float = 10.0,
        min_rate: float = 1.0,
        max_rate: float = 100.0,
        increase_factor: float = 1.1,
        decrease_factor: float = 0.5
    ):
        """
        Initialize adaptive rate limiter

        Args:
            initial_rate: Initial requests per second
            min_rate: Minimum requests per second
            max_rate: Maximum requests per second
            increase_factor: Factor to increase rate on success
            decrease_factor: Factor to decrease rate on error
        """
        self.current_rate = initial_rate
        self.min_rate = min_rate
        self.max_rate = max_rate
        self.increase_factor = increase_factor
        self.decrease_factor = decrease_factor

        self.limiter = RateLimiter(
            max_requests=int(initial_rate),
            time_window=1.0,
            burst_size=int(initial_rate * 2)
        )

        self.success_count = 0
        self.consecutive_successes = 0
        self.lock = asyncio.Lock()

    async def acquire(self):
        """Acquire permission to make a request"""
        await self.limiter.acquire()

    def on_success(self):
        """Call this after a successful API call"""
        self.consecutive_successes += 1

        # Gradually increase rate after consistent successes
        if self.consecutive_successes >= 10:
            self._increase_rate()
            self.consecutive_successes = 0

    def on_rate_limit(self):
        """Call this when encountering a rate limit error"""
        self.consecutive_successes = 0
        self._decrease_rate()

    def _increase_rate(self):
        """Increase the rate limit"""
        old_rate = self.current_rate
        self.current_rate = min(
            self.max_rate,
            self.current_rate * self.increase_factor
        )

        if self.current_rate != old_rate:
            logger.info(
                f"Increasing rate limit: {old_rate:.1f} → {self.current_rate:.1f} req/s"
            )
            self._update_limiter()

    def _decrease_rate(self):
        """Decrease the rate limit"""
        old_rate = self.current_rate
        self.current_rate = max(
            self.min_rate,
            self.current_rate * self.decrease_factor
        )

        if self.current_rate != old_rate:
            logger.warning(
                f"Decreasing rate limit due to errors: {old_rate:.1f} → {self.current_rate:.1f} req/s"
            )
            self._update_limiter()

    def _update_limiter(self):
        """Update the internal limiter with new rate"""
        self.limiter = RateLimiter(
            max_requests=int(self.current_rate),
            time_window=1.0,
            burst_size=int(self.current_rate * 2)
        )

    async def __aenter__(self):
        """Context manager support"""
        await self.acquire()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager support"""
        return False


class MultiServiceRateLimiter:
    """
    Rate limiter that manages limits for multiple services

    Example:
        limiter = MultiServiceRateLimiter({
            'deepseek': RateLimitConfig(max_requests=10, time_window=1.0),
            'google': RateLimitConfig(max_requests=100, time_window=60.0),
        })

        async with limiter.get('deepseek'):
            result = await call_deepseek_api()
    """

    def __init__(self, configs: Dict[str, RateLimitConfig]):
        """
        Initialize multi-service rate limiter

        Args:
            configs: Dictionary mapping service names to rate limit configs
        """
        self.limiters = {
            service: RateLimiter(
                max_requests=config.max_requests,
                time_window=config.time_window,
                burst_size=config.burst_size
            )
            for service, config in configs.items()
        }

    def get(self, service: str) -> RateLimiter:
        """Get rate limiter for a specific service"""
        if service not in self.limiters:
            raise ValueError(f"Unknown service: {service}")
        return self.limiters[service]

    def add_service(self, service: str, config: RateLimitConfig):
        """Add a new service to the rate limiter"""
        self.limiters[service] = RateLimiter(
            max_requests=config.max_requests,
            time_window=config.time_window,
            burst_size=config.burst_size
        )


# Common rate limit configurations

# DeepSeek API (conservative)
DEEPSEEK_RATE_LIMIT = RateLimitConfig(
    max_requests=10,    # 10 requests per second
    time_window=1.0,
    burst_size=20       # Allow burst of 20
)

# Google Places API
GOOGLE_PLACES_RATE_LIMIT = RateLimitConfig(
    max_requests=100,   # 100 requests per second
    time_window=1.0,
    burst_size=200
)

# Generic API (moderate)
GENERIC_API_RATE_LIMIT = RateLimitConfig(
    max_requests=30,    # 30 requests per second
    time_window=1.0,
    burst_size=60
)


# Convenience functions

async def rate_limited_call(
    func,
    *args,
    rate_limiter: Optional[RateLimiter] = None,
    **kwargs
):
    """
    Make a rate-limited function call

    Args:
        func: Function to call
        rate_limiter: Optional rate limiter (default: 10 req/s)
        *args: Positional arguments for func
        **kwargs: Keyword arguments for func

    Returns:
        Result of func

    Example:
        result = await rate_limited_call(
            fetch_data,
            url,
            rate_limiter=limiter
        )
    """
    if rate_limiter is None:
        rate_limiter = RateLimiter(max_requests=10, time_window=1.0)

    async with rate_limiter:
        return await func(*args, **kwargs)
