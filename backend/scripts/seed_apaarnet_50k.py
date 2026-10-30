#!/usr/bin/env python3
"""
CLI runner for seeding ApaarNet with 50 AICTE institutions and 5 demonstration cases.
Usage: python backend/scripts/seed_apaarnet_50k.py
"""

import asyncio
import sys
import time
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.database import AsyncSessionLocal, engine, init_db
from app.core.seeder import seed_apaarnet_database


async def main():
    print("=" * 70)
    print("   APAARNET SYNTHETIC SEEDER (SIH26263) - 50 INSTITUTIONS & 5 DEMO CASES")
    print("=" * 70)
    start_time = time.time()

    print("[1/3] Initializing database tables and Merkle ledger triggers...")
    await init_db()

    print("[2/3] Seeding 50 institutions and demonstration cases...")
    async with AsyncSessionLocal() as session:
        result = await seed_apaarnet_database(session)

    elapsed = time.time() - start_time
    print(f"[3/3] Seeding completed successfully in {elapsed:.2f} seconds!")
    print(f" - Institutions: {result['institutions_count']}")
    print(f" - Program Quotas: {result['quotas_count']}")
    print(f" - Student Enrolments: {result['students_count']}")
    print(f" - Demonstration Disputes: {result['disputes_count']}")
    print("-" * 70)
    print("Demonstration Cases Seeded:")
    for key, val in result["demonstration_cases"].items():
        print(f"  * {key.upper()}: {val}")
    print("=" * 70)

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
