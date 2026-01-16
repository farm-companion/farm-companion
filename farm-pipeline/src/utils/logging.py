"""
Comprehensive Logging System

Provides structured logging with multiple output formats and handlers.
"""

import logging
import sys
import json
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
import functools


class JSONFormatter(logging.Formatter):
    """
    JSON formatter for structured logging
    Outputs logs in JSON format for easy parsing
    """

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }

        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = {
                'type': record.exc_info[0].__name__,
                'message': str(record.exc_info[1]),
                'traceback': self.formatException(record.exc_info)
            }

        # Add extra fields
        if hasattr(record, 'extra_fields'):
            log_data.update(record.extra_fields)

        return json.dumps(log_data)


class ColoredFormatter(logging.Formatter):
    """
    Colored formatter for console output
    Makes logs easier to read in terminal
    """

    COLORS = {
        'DEBUG': '\033[36m',     # Cyan
        'INFO': '\033[32m',      # Green
        'WARNING': '\033[33m',   # Yellow
        'ERROR': '\033[31m',     # Red
        'CRITICAL': '\033[35m',  # Magenta
        'RESET': '\033[0m',      # Reset
    }

    def format(self, record: logging.LogRecord) -> str:
        # Add color to level name
        levelname = record.levelname
        if levelname in self.COLORS:
            record.levelname = (
                f"{self.COLORS[levelname]}{levelname}{self.COLORS['RESET']}"
            )

        # Format message
        formatted = super().format(record)

        # Reset levelname for next use
        record.levelname = levelname

        return formatted


def setup_logger(
    name: str,
    level: str = 'INFO',
    log_file: Optional[Path] = None,
    json_format: bool = False,
    console: bool = True
) -> logging.Logger:
    """
    Set up a logger with console and optional file output

    Args:
        name: Logger name (usually __name__)
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Optional path to log file
        json_format: Use JSON format for logs
        console: Enable console output

    Returns:
        Configured logger

    Example:
        logger = setup_logger(__name__, level='DEBUG', log_file=Path('logs/app.log'))
        logger.info('Application started')
        logger.error('Something went wrong', extra={'extra_fields': {'user_id': 123}})
    """
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper()))

    # Remove existing handlers
    logger.handlers = []

    # Console handler
    if console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(getattr(logging, level.upper()))

        if json_format:
            console_formatter = JSONFormatter()
        else:
            console_formatter = ColoredFormatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )

        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)

    # File handler
    if log_file:
        log_file.parent.mkdir(parents=True, exist_ok=True)

        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        file_handler.setLevel(getattr(logging, level.upper()))

        if json_format:
            file_formatter = JSONFormatter()
        else:
            file_formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )

        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)

    return logger


def log_function_call(logger: logging.Logger, level: str = 'DEBUG'):
    """
    Decorator to log function calls with arguments and return values

    Args:
        logger: Logger instance
        level: Log level for function calls

    Example:
        @log_function_call(logger, level='INFO')
        async def fetch_data(url: str):
            return await client.get(url)
    """
    def decorator(func):
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            logger.log(
                getattr(logging, level.upper()),
                f"Calling {func.__name__} with args={args}, kwargs={kwargs}"
            )

            try:
                result = await func(*args, **kwargs)
                logger.log(
                    getattr(logging, level.upper()),
                    f"{func.__name__} completed successfully"
                )
                return result
            except Exception as e:
                logger.error(f"{func.__name__} failed with error: {e}", exc_info=True)
                raise

        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            logger.log(
                getattr(logging, level.upper()),
                f"Calling {func.__name__} with args={args}, kwargs={kwargs}"
            )

            try:
                result = func(*args, **kwargs)
                logger.log(
                    getattr(logging, level.upper()),
                    f"{func.__name__} completed successfully"
                )
                return result
            except Exception as e:
                logger.error(f"{func.__name__} failed with error: {e}", exc_info=True)
                raise

        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator


class PerformanceLogger:
    """
    Context manager for logging execution time

    Example:
        with PerformanceLogger(logger, 'fetch_farms'):
            farms = await fetch_farms()
    """

    def __init__(self, logger: logging.Logger, operation: str, level: str = 'INFO'):
        self.logger = logger
        self.operation = operation
        self.level = level
        self.start_time = None

    def __enter__(self):
        self.start_time = datetime.now()
        self.logger.log(
            getattr(logging, self.level.upper()),
            f"Starting {self.operation}"
        )
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = (datetime.now() - self.start_time).total_seconds()

        if exc_type:
            self.logger.error(
                f"{self.operation} failed after {duration:.2f}s: {exc_val}"
            )
        else:
            self.logger.log(
                getattr(logging, self.level.upper()),
                f"{self.operation} completed in {duration:.2f}s"
            )

        return False  # Don't suppress exceptions


class ProgressLogger:
    """
    Logger for tracking progress of long-running operations

    Example:
        progress = ProgressLogger(logger, total=1000, operation='Processing farms')
        for farm in farms:
            process_farm(farm)
            progress.update(1)
    """

    def __init__(
        self,
        logger: logging.Logger,
        total: int,
        operation: str = 'Processing',
        log_interval: int = 10
    ):
        self.logger = logger
        self.total = total
        self.operation = operation
        self.log_interval = log_interval
        self.current = 0
        self.start_time = datetime.now()

    def update(self, n: int = 1):
        """Update progress by n items"""
        self.current += n

        # Log at intervals
        if self.current % self.log_interval == 0 or self.current == self.total:
            percentage = (self.current / self.total) * 100
            elapsed = (datetime.now() - self.start_time).total_seconds()
            rate = self.current / elapsed if elapsed > 0 else 0
            eta = (self.total - self.current) / rate if rate > 0 else 0

            self.logger.info(
                f"{self.operation}: {self.current}/{self.total} ({percentage:.1f}%) "
                f"- {rate:.1f} items/s - ETA: {eta:.0f}s"
            )

    def complete(self):
        """Mark operation as complete"""
        elapsed = (datetime.now() - self.start_time).total_seconds()
        rate = self.total / elapsed if elapsed > 0 else 0

        self.logger.info(
            f"{self.operation} complete: {self.total} items in {elapsed:.1f}s "
            f"({rate:.1f} items/s)"
        )


# Default logger for the application
def get_default_logger() -> logging.Logger:
    """Get default logger for the application"""
    return setup_logger(
        'farm_pipeline',
        level='INFO',
        log_file=Path('logs/farm_pipeline.log')
    )
