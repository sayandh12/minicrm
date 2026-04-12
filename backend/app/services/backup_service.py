import os
import subprocess
import gzip
import shutil
import logging
from datetime import datetime
from pathlib import Path
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("backup_service")

def run_backup():
    """
    Performs a database backup using pg_dump and compresses it with gzip.
    Uses SYNC_DATABASE_URL from settings.
    """
    # Create backups directory if it doesn't exist
    backup_dir = Path("backups")
    backup_dir.mkdir(exist_ok=True)

    # Generate filenames with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    sql_file = backup_dir / f"backup_{timestamp}.sql"
    gz_file = backup_dir / f"backup_{timestamp}.sql.gz"

    # Extract connection details from SYNC_DATABASE_URL
    db_url = settings.SYNC_DATABASE_URL
    
    # Ensure it's a standard PostgreSQL URI for pg_dump
    uri = db_url.replace("postgresql+psycopg2://", "postgresql://")
    uri = uri.replace("postgresql+asyncpg://", "postgresql://")

    logger.info(f"Starting database backup...")

    try:
        # Construct the pg_dump command
        # Using --clean to include DROP commands in the backup
        command = [
            "pg_dump",
            "--dbname", uri,
            "--file", str(sql_file),
            "--clean",
            "--if-exists"
        ]

        # Execute the command
        result = subprocess.run(command, capture_output=True, text=True)

        if result.returncode == 0:
            logger.info(f"SQL dump created: {sql_file}")
            
            # Compress the file using gzip
            logger.info(f"Compressing backup...")
            with open(sql_file, 'rb') as f_in:
                with gzip.open(gz_file, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            
            # Remove the uncompressed SQL file
            os.remove(sql_file)
            
            logger.info(f"Backup successful and compressed: {gz_file}")
            return str(gz_file)
        else:
            logger.error(f"pg_dump failed: {result.stderr}")
            if sql_file.exists():
                os.remove(sql_file)
            return None

    except Exception as e:
        logger.error(f"An unexpected error occurred during backup: {e}")
        if sql_file.exists():
            os.remove(sql_file)
        return None

if __name__ == "__main__":
    run_backup()
