from urllib.parse import urlparse
import mysql.connector

from app.config.settings import DATABASE_URL


def get_db_connection():
    parsed = urlparse(DATABASE_URL)

    if not parsed.hostname:
        raise ValueError("Invalid DATABASE_URL: hostname is missing.")

    if not parsed.username:
        raise ValueError("Invalid DATABASE_URL: username is missing.")

    if not parsed.password:
        raise ValueError("Invalid DATABASE_URL: password is missing.")

    if not parsed.path or parsed.path == "/":
        raise ValueError("Invalid DATABASE_URL: database name is missing.")

    port = parsed.port or 3306

    return mysql.connector.connect(
        host=parsed.hostname,
        port=port,
        user=parsed.username,
        password=parsed.password,
        database=parsed.path.lstrip("/"),
    )