"""Pytest configuration for FamilyHub backend tests.

Sets up environment so that Pydantic Settings can find .env
regardless of where pytest is invoked from.
"""
import os
import sys

# Ensure project root .env is discoverable
_project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_env_path = os.path.join(os.path.dirname(_project_root), ".env")

if os.path.exists(_env_path) and "SECRET_KEY" not in os.environ:
    # Load SECRET_KEY from project root .env
    with open(_env_path) as f:
        for line in f:
            if line.startswith("SECRET_KEY="):
                _, _, value = line.partition("=")
                os.environ["SECRET_KEY"] = value.strip()
                break

# Add backend dir to path so `app.*` imports work
_backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)
