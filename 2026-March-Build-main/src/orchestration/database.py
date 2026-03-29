"""
BioGuardian Persistence Layer
==============================
SQLite-backed storage for patient telemetry and digital-twin simulation
reports.  Designed for reliability and correctness:

  - One persistent, WAL-mode connection per instance (no per-call overhead).
  - Explicit transactions with rollback on failure.
  - Typed dataclasses for every record returned to callers.
  - UTC timestamps throughout.
  - Parameterised queries only (no string interpolation).
"""

from __future__ import annotations

import json
import logging
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Return-type dataclasses
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class TelemetryRecord:
    """A single persisted telemetry reading."""
    timestamp: str
    marker_type: str
    value: float
    source: str | None


@dataclass(frozen=True)
class SimulationRecord:
    """A single persisted simulation report."""
    timestamp: str
    scenario_name: str
    report: list[dict[str, Any]]


@dataclass(frozen=True)
class PatientHistory:
    """Bundled history returned by :meth:`BioGuardianDB.get_history`."""
    telemetry: list[TelemetryRecord]
    simulations: list[SimulationRecord]

    @property
    def is_empty(self) -> bool:
        return not self.telemetry and not self.simulations


# ---------------------------------------------------------------------------
# Database layer
# ---------------------------------------------------------------------------

_DDL = """
CREATE TABLE IF NOT EXISTS telemetry (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id   TEXT    NOT NULL,
    timestamp    TEXT    NOT NULL,   -- ISO-8601 UTC
    marker_type  TEXT    NOT NULL,
    value        REAL    NOT NULL,
    source       TEXT
);

CREATE INDEX IF NOT EXISTS idx_telemetry_patient
    ON telemetry (patient_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS simulations (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id    TEXT NOT NULL,
    timestamp     TEXT NOT NULL,    -- ISO-8601 UTC
    scenario_name TEXT NOT NULL,
    report        TEXT NOT NULL     -- JSON
);

CREATE INDEX IF NOT EXISTS idx_simulations_patient
    ON simulations (patient_id, timestamp DESC);
"""

_EMPTY_HISTORY = PatientHistory(telemetry=[], simulations=[])


class BioGuardianDB:
    """
    Persistent store for BioGuardian telemetry and simulation data.

    Uses a single SQLite connection in WAL mode so reads never block
    writes and the database is safe to share across threads (with the
    ``check_same_thread=False`` flag — callers are responsible for
    not issuing concurrent writes from multiple threads).

    Parameters
    ----------
    db_path:
        Filesystem path for the SQLite database file.
        Defaults to ``bio_twin_state.db`` in the current directory.

    Raises
    ------
    sqlite3.Error
        If the database cannot be opened or the schema cannot be applied.
    """

    _DEFAULT_TELEMETRY_LIMIT = 20
    _DEFAULT_SIMULATION_LIMIT = 10

    def __init__(self, db_path: str | Path = "bio_twin_state.db") -> None:
        self.db_path = Path(db_path)
        self._conn = self._open_connection()
        self._apply_schema()

    # ------------------------------------------------------------------
    # Connection management
    # ------------------------------------------------------------------

    def _open_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(
            self.db_path,
            check_same_thread=False,
            detect_types=sqlite3.PARSE_DECLTYPES,
        )
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        return conn

    def _apply_schema(self) -> None:
        try:
            with self._conn:
                self._conn.executescript(_DDL)
            logger.info("Schema applied — database ready at '%s'.", self.db_path)
        except sqlite3.Error:
            logger.exception("Schema application failed.")
            raise

    def close(self) -> None:
        """Explicitly close the underlying connection."""
        self._conn.close()
        logger.debug("Database connection closed.")

    def __enter__(self) -> "BioGuardianDB":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()

    # ------------------------------------------------------------------
    # Write operations
    # ------------------------------------------------------------------

    def save_telemetry(
        self,
        patient_id: str,
        marker_type: str,
        value: float,
        source: str | None = None,
    ) -> None:
        """
        Persist a single telemetry reading for *patient_id*.

        Parameters
        ----------
        patient_id:
            Unique patient identifier.
        marker_type:
            Biomarker label (e.g. ``"heart_rate"``, ``"glucose"``).
        value:
            Numeric reading.
        source:
            Optional origin label (device name, API endpoint, etc.).
        """
        sql = """
            INSERT INTO telemetry (patient_id, timestamp, marker_type, value, source)
            VALUES (?, ?, ?, ?, ?)
        """
        try:
            with self._conn:
                self._conn.execute(
                    sql,
                    (patient_id, _utcnow(), marker_type, float(value), source),
                )
            logger.debug("Telemetry saved — patient=%s marker=%s value=%s", patient_id, marker_type, value)
        except sqlite3.Error:
            logger.exception("Failed to save telemetry for patient '%s'.", patient_id)
            raise

    def save_simulation(
        self,
        patient_id: str,
        scenario_name: str,
        report: list[dict[str, Any]],
    ) -> None:
        """
        Persist a simulation report for *patient_id*.

        Parameters
        ----------
        patient_id:
            Unique patient identifier.
        scenario_name:
            Human-readable scenario label.
        report:
            JSON-serialisable list of result dictionaries.

        Raises
        ------
        TypeError
            If *report* cannot be serialised to JSON.
        sqlite3.Error
            On any database write failure.
        """
        sql = """
            INSERT INTO simulations (patient_id, timestamp, scenario_name, report)
            VALUES (?, ?, ?, ?)
        """
        try:
            report_json = json.dumps(report, default=str)
        except TypeError:
            logger.exception("Simulation report for patient '%s' is not JSON-serialisable.", patient_id)
            raise

        try:
            with self._conn:
                self._conn.execute(sql, (patient_id, _utcnow(), scenario_name, report_json))
            logger.debug("Simulation saved — patient=%s scenario=%s", patient_id, scenario_name)
        except sqlite3.Error:
            logger.exception("Failed to save simulation for patient '%s'.", patient_id)
            raise

    # ------------------------------------------------------------------
    # Read operations
    # ------------------------------------------------------------------

    def get_history(
        self,
        patient_id: str,
        telemetry_limit: int = _DEFAULT_TELEMETRY_LIMIT,
        simulation_limit: int = _DEFAULT_SIMULATION_LIMIT,
    ) -> PatientHistory:
        """
        Retrieve recent telemetry and simulations for *patient_id*.

        Parameters
        ----------
        patient_id:
            Unique patient identifier.
        telemetry_limit:
            Maximum number of telemetry rows to return (default 20).
        simulation_limit:
            Maximum number of simulation rows to return (default 10).

        Returns
        -------
        PatientHistory
            Dataclass containing typed lists of records.  Returns an
            empty ``PatientHistory`` on any database error so callers
            always receive a valid object.
        """
        try:
            telemetry = self._fetch_telemetry(patient_id, telemetry_limit)
            simulations = self._fetch_simulations(patient_id, simulation_limit)
            return PatientHistory(telemetry=telemetry, simulations=simulations)
        except sqlite3.Error:
            logger.exception("Failed to retrieve history for patient '%s'.", patient_id)
            return _EMPTY_HISTORY

    # ------------------------------------------------------------------
    # Private query helpers
    # ------------------------------------------------------------------

    def _fetch_telemetry(self, patient_id: str, limit: int) -> list[TelemetryRecord]:
        sql = """
            SELECT timestamp, marker_type, value, source
            FROM   telemetry
            WHERE  patient_id = ?
            ORDER  BY timestamp DESC
            LIMIT  ?
        """
        rows = self._conn.execute(sql, (patient_id, limit)).fetchall()
        return [
            TelemetryRecord(
                timestamp=row["timestamp"],
                marker_type=row["marker_type"],
                value=row["value"],
                source=row["source"],
            )
            for row in rows
        ]

    def _fetch_simulations(self, patient_id: str, limit: int) -> list[SimulationRecord]:
        sql = """
            SELECT timestamp, scenario_name, report
            FROM   simulations
            WHERE  patient_id = ?
            ORDER  BY timestamp DESC
            LIMIT  ?
        """
        rows = self._conn.execute(sql, (patient_id, limit)).fetchall()
        records: list[SimulationRecord] = []
        for row in rows:
            try:
                parsed_report = json.loads(row["report"])
            except json.JSONDecodeError:
                logger.warning(
                    "Corrupt simulation report for patient '%s' at %s — skipping.",
                    patient_id,
                    row["timestamp"],
                )
                continue
            records.append(
                SimulationRecord(
                    timestamp=row["timestamp"],
                    scenario_name=row["scenario_name"],
                    report=parsed_report,
                )
            )
        return records


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _utcnow() -> str:
    """Return the current UTC time as an ISO-8601 string."""
    return datetime.now(tz=timezone.utc).isoformat()
