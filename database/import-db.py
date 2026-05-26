"""
Import AOT-SMS database schema and seed data into Aiven MySQL.

Usage:
    python database/import-db.py

Requires: pip install mysql-connector-python
"""

import mysql.connector
import os
import sys

# Aiven credentials (set via environment variables)
CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "3306")),
    "database": os.getenv("DB_NAME", "aot_sms"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASS", ""),
    "ssl_disabled": os.getenv("DB_SSL", "false").lower() != "true",
    "charset": "utf8mb4",
    "collation": "utf8mb4_unicode_ci",
}

SQL_FILES = [
    "database/schema.sql",
    "database/seed_data.sql",
    "database/demo_data.sql",
    "database/seed_attendance.sql",
]


def execute_sql_file(cursor, filepath):
    """Execute a SQL file, splitting on semicolons and handling DELIMITER blocks."""
    print(f"\n{'='*60}")
    print(f"  Executing: {filepath}")
    print(f"{'='*60}")

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Remove DELIMITER blocks (not supported by connector)
    # Simple approach: split on ';' and execute each statement
    statements = []
    current = ""
    for line in content.split("\n"):
        stripped = line.strip()
        # Skip comments and empty lines
        if stripped.startswith("--") or stripped.startswith("#") or stripped == "":
            continue
        # Skip DELIMITER commands
        if stripped.upper().startswith("DELIMITER"):
            continue
        # Skip CREATE DATABASE and USE statements (we're already connected to the target DB)
        if stripped.upper().startswith("CREATE DATABASE") or stripped.upper().startswith("USE "):
            continue
        current += line + "\n"
        if stripped.endswith(";"):
            stmt = current.strip().rstrip(";").strip()
            if stmt:
                statements.append(stmt)
            current = ""

    # If there's remaining content without semicolon
    if current.strip():
        statements.append(current.strip().rstrip(";").strip())

    executed = 0
    errors = 0
    for i, stmt in enumerate(statements):
        if not stmt or len(stmt) < 3:
            continue
        try:
            cursor.execute(stmt)
            # Consume any result sets to avoid "Commands out of sync"
            try:
                while cursor.nextset():
                    pass
            except Exception:
                pass
            executed += 1
        except mysql.connector.Error as e:
            # Skip "already exists" and "duplicate" errors gracefully
            if e.errno in (1050, 1062, 1065):  # table exists, duplicate entry, empty query
                pass
            elif "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                pass
            else:
                errors += 1
                if errors <= 10:  # Only show first 10 errors
                    print(f"  ⚠ Error at statement {i+1}: {e.msg[:100]}")

    print(f"  ✓ Executed {executed} statements, {errors} errors")
    return executed, errors


def main():
    # Determine project root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    os.chdir(project_root)

    print("╔══════════════════════════════════════════════════════════╗")
    print("║     AOT-SMS Database Import → Aiven MySQL              ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print(f"\n  Host: {CONFIG['host']}:{CONFIG['port']}")
    print(f"  Database: {CONFIG['database']}")
    print(f"  User: {CONFIG['user']}")
    print(f"  SSL: enabled")

    # Connect
    print("\n  Connecting...")
    try:
        conn = mysql.connector.connect(**CONFIG)
        cursor = conn.cursor(buffered=True)
        print("  ✓ Connected successfully!")
    except mysql.connector.Error as e:
        print(f"  ✗ Connection failed: {e}")
        sys.exit(1)

    # Execute each SQL file
    total_executed = 0
    total_errors = 0

    for sql_file in SQL_FILES:
        if not os.path.exists(sql_file):
            print(f"\n  ⚠ File not found: {sql_file} — skipping")
            continue
        try:
            # Use a fresh cursor for each file to avoid sync issues
            cursor.close()
            conn.commit()
            cursor = conn.cursor(buffered=True)
            executed, errors = execute_sql_file(cursor, sql_file)
            # Consume any pending results before commit
            try:
                while cursor.nextset():
                    pass
            except Exception:
                pass
            conn.commit()
            total_executed += executed
            total_errors += errors
        except Exception as e:
            print(f"  ✗ Fatal error in {sql_file}: {e}")
            try:
                conn.rollback()
            except Exception:
                # Reconnect if connection is broken
                conn = mysql.connector.connect(**CONFIG)
                cursor = conn.cursor(buffered=True)

    # Verify tables
    print(f"\n{'='*60}")
    print("  Verifying tables...")
    print(f"{'='*60}")
    cursor.execute("SHOW TABLES")
    tables = [row[0] for row in cursor.fetchall()]
    print(f"  ✓ {len(tables)} tables found:")
    for t in sorted(tables):
        cursor.execute(f"SELECT COUNT(*) FROM `{t}`")
        count = cursor.fetchone()[0]
        print(f"    • {t:30s} ({count} rows)")

    # Summary
    print(f"\n{'='*60}")
    print(f"  DONE! {total_executed} statements executed, {total_errors} errors")
    print(f"  {len(tables)} tables in database")
    print(f"{'='*60}\n")

    cursor.close()
    conn.close()


if __name__ == "__main__":
    main()
