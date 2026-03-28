import sqlite3
import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class BioGuardianDB:
    def __init__(self, db_path: str = 'bio_twin_state.db'):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self):
        return sqlite3.connect(self.db_path)

    def _init_db(self):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS telemetry (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        patient_id TEXT NOT NULL,
                        timestamp DATETIME NOT NULL,
                        marker_type TEXT NOT NULL,
                        value REAL NOT NULL,
                        source TEXT
                    )
                ''')
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS simulations (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        patient_id TEXT NOT NULL,
                        timestamp DATETIME NOT NULL,
                        scenario_name TEXT NOT NULL,
                        report JSON
                    )
                ''')
                conn.commit()
                logger.info("Database initialized successfully.")
        except sqlite3.Error as e:
            logger.error(f"Database initialization failed: {e}", exc_info=True)

    def save_telemetry(self, patient_id: str, marker_type: str, value: float, source: Optional[str] = None):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    'INSERT INTO telemetry (patient_id, timestamp, marker_type, value, source) VALUES (?, ?, ?, ?, ?)',
                    (patient_id, datetime.now().isoformat(), marker_type, value, source)
                )
                conn.commit()
        except sqlite3.Error as e:
            logger.error(f"Failed to save telemetry: {e}", exc_info=True)

    def save_simulation(self, patient_id: str, scenario_name: str, report: List[Dict[str, Any]]):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    'INSERT INTO simulations (patient_id, timestamp, scenario_name, report) VALUES (?, ?, ?, ?)',
                    (patient_id, datetime.now().isoformat(), scenario_name, json.dumps(report))
                )
                conn.commit()
        except (sqlite3.Error, TypeError) as e:
            logger.error(f"Failed to save simulation: {e}", exc_info=True)

    def get_history(self, patient_id: str, limit: int = 20):
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    'SELECT timestamp, marker_type, value, source FROM telemetry WHERE patient_id = ? ORDER BY timestamp DESC LIMIT ?',
                    (patient_id, limit)
                )
                telemetry = cursor.fetchall()
                
                cursor.execute(
                    'SELECT timestamp, scenario_name, report FROM simulations WHERE patient_id = ? ORDER BY timestamp DESC LIMIT 10',
                    (patient_id,)
                )
                simulations = cursor.fetchall()
                
                return {
                    "telemetry": [{ "time": h[0], "type": h[1], "value": h[2], "source": h[3] } for h in telemetry],
                    "simulations": [{ "time": s[0], "scenario": s[1], "report": json.loads(s[2]) } for s in simulations]
                }
        except sqlite3.Error as e:
            logger.error(f"Database error retrieving history: {e}", exc_info=True)
            return {"telemetry": [], "simulations": []}
