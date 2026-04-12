# Database Backup Plan

This document outlines the backup and recovery strategy for the MiniCRM database to ensure data integrity and availability.

## 1. Overview
The database uses **PostgreSQL**. Backups are performed using the `pg_dump` utility via a Python service script, which creates a consistent, compressed snapshot of the database schema and data.

## 2. Backup Strategy
- **Daily Automated Backups**: Scheduled to run every 24 hours (e.g., at 00:00 local time).
- **Manual Backups**: Should be performed manually before any major deployment, database migration, or destructive operation.
- **On-Demand**: Can be triggered by running the `app.services.backup_service` module.

## 3. Storage and Retention
- **Storage Location**: Compressed backup files (`backup_YYYYMMDD_HHMMSS.sql.gz`) are stored in the `backend/backups/` directory.
- **Retention Policy**:
  - Keep daily backups for **7 days**.
  - Keep weekly backups for **4 weeks**.
  - Keep monthly backups for **3 months**.
  *(Note: Cleanup logic to be implemented or handled via OS-level scripts)*.

## 4. Automation (Windows)
To automate backups on Windows, use **Task Scheduler**:

1. Open **Task Scheduler**.
2. Click **Create Basic Task...**.
3. Name it `MiniCRM_Database_Backup`.
4. Set Trigger to **Daily** and choose a time (e.g., 12:00 AM).
5. Set Action to **Start a program**.
6. **Program/script**: `python` (ensure python is in your PATH).
7. **Add arguments**: `-m app.services.backup_service`.
8. **Start in**: `C:\Users\Sayandh\OneDrive\Desktop\FastAPI Task\backend` (The absolute path to your backend directory).
9. Click **Finish**.

## 5. Recovery Procedure
In the event of data loss or corruption, follow these steps:

1. **Identify the Backup**: Locate the desired `.sql.gz` file in `backend/backups/`.
2. **Prepare the Database**:
   ```powershell
   # Drop and recreate the database (Caution: this deletes current data)
   dropdb -h localhost -U postgres crm_db
   createdb -h localhost -U postgres crm_db
   ```
3. **Run Restore**:
   ```powershell
   # Unzip and pipe to psql
   # On Windows (PowerShell/CMD may vary, using gunzip if available)
   gunzip -c backups\backup_filename.sql.gz | psql -h localhost -U postgres crm_db
   ```

## 6. Verification
- **Success Logs**: Check `backup_service.log` or console output for "Backup successful".
- **File Integrity**: Ensure the `.sql.gz` file is not empty and can be opened.
- **Quarterly Drill**: Perform a restore to a test database once every quarter to verify data consistency.
