from urllib.parse import urlparse

import mysql.connector

from app.config.settings import DATABASE_URL


def get_db_connection():
    parsed = urlparse(DATABASE_URL)

    return mysql.connector.connect(
        host=parsed.hostname,
        port=parsed.port,
        user=parsed.username,
        password=parsed.password,
        database=parsed.path.lstrip("/"),
    )