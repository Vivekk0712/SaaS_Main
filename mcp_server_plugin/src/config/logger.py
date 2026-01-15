"""Logging configuration."""
import logging
import sys
from typing import Any
from .env import settings


def setup_logger(name: str = "mcp_server") -> logging.Logger:
    """Setup structured logger."""
    logger = logging.getLogger(name)
    
    # Set level
    level_map = {
        "debug": logging.DEBUG,
        "info": logging.INFO,
        "warn": logging.WARNING,
        "error": logging.ERROR,
    }
    logger.setLevel(level_map.get(settings.LOG_LEVEL.lower(), logging.INFO))
    
    # Console handler
    handler = logging.StreamHandler(sys.stdout)
    
    # Format
    if settings.is_production:
        # JSON format for production
        formatter = logging.Formatter(
            '{"time":"%(asctime)s","level":"%(levelname)s","name":"%(name)s","msg":"%(message)s"}'
        )
    else:
        # Human-readable for development
        formatter = logging.Formatter(
            "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
    
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    
    return logger


# Global logger instance
logger = setup_logger()
