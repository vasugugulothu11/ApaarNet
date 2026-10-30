# ApaarNet Architecture Rules & Standards (SIH26263)

## Project Overview
**Project Name:** ApaarNet  
**Problem Statement:** SIH26263 — Development of an APAAR ID-Based Student Data Management and Verification Platform for AICTE-Approved Institutions.  
**Objective:** Provide a unified, tamper-evident, high-integrity student record management, quota tracking, cross-institution deduplication, and verifiable credential platform keyed on the 12-digit APAAR ID (Automated Permanent Academic Account Registry).

---

## 10 Mandatory AICTE Core Requirements

ApaarNet strictly adheres to and implements all ten official AICTE functional requirements:

1. **APAAR-Keyed Upload & Ingestion APIs**
   - Every student entity must have APAAR ID (12-digit unique ID) as its primary external anchor.
   - Bulk upload via Excel/CSV and real-time REST/GraphQL endpoints with batch-level and record-level schema validation.

2. **Full AICTE Quota & Intake Field Support**
   - Accurate tracking of institution-level and programme-level sanctioned vs. enrolled quotas:
     - Approved Intake
     - Actual Enrolment
     - Supernumerary Quota
     - Non-Resident Indian (NRI) Quota
     - Overseas Citizen of India (OCI) Quota
     - Foreign National (FN) Quota
     - Tuition Fee Waiver (TFW) Scheme
     - Prime Minister's Special Scholarship Scheme (PMSSS) for J&K and Ladakh
     - Lateral Entry Quota (2nd-year direct admission)

3. **Automated Verification, Anomaly Detection & Cross-Institution Deduplication**
   - High-throughput duplicate detection within institutions and across different AICTE-approved institutions nationwide.
   - Real-time detection of:
     - Invalid / unverified / missing APAAR IDs.
     - Excess intake beyond sanctioned limits + permitted supernumerary allowances.
     - Multi-institution ghost student / concurrent enrollment collisions across distinct institutions.

4. **Real-Time Interactive Dashboards**
   - Institutional admin dashboards (intake utilization, compliance score, anomaly alerts).
   - AICTE Central / Regional Directorate oversight dashboards with drill-downs across states, districts, and institution tiers.
   - Sub-second aggregations powered by relational indices and cached stats.

5. **Multi-Stakeholder Verification & Approval Workflows**
   - Verifier roles spanning: Institution Data Operator, Principal/Director, AICTE Regional Officer, Central AICTE Auditor.
   - Cryptographic status transitions: `DRAFT` -> `SUBMITTED` -> `INSTITUTION_VERIFIED` -> `AICTE_APPROVED` / `FLAGGED`.

6. **W3C Verifiable Credentials & Digital Student Records**
   - Student academic records and transcripts exported and verified as W3C Verifiable Credentials (VC).
   - Ed25519 cryptographic signatures and decentralized identity anchor proofs.
   - Offline verification support via digitally signed JSON-LD / QR codes.

7. **Institutional ERP & National API Interoperability**
   - Clean OpenAPI 3.1 RESTful contracts and webhook pub/sub adapters.
   - Interoperability with institutional ERPs, Digilocker, NAD (National Academic Depository), and AICTE Portal APIs.
   - Mock APAAR Registry adapter with toggles for sandbox and production environments.

8. **RBAC, DPDP Act 2023 Compliance & Merkle Audit Trail**
   - Role-Based Access Control (RBAC) with least-privilege scoping.
   - Compliance with Digital Personal Data Protection (DPDP) Act 2023:
     - Explicit consent management for student record access.
     - Redaction / hashing of PII in public logs.
     - Right to correction and purpose-bound access.
   - Cryptographic SHA-256 Merkle tree audit trail for every data mutation and verification event, guaranteeing non-repudiation.

9. **Accreditation & Regulatory Policy Reporting**
   - One-click exportable regulatory compliance packages for AICTE Approval Process Handbook (APH), NBA, and NAAC audits.
   - Historical intake vs. enrolment trends and quota adherence variance reporting.

10. **Dual-Keyed Degree & Diploma Certification Support**
    - Verifiable digital degree and diploma generation displaying both:
      - Student APAAR ID (12-digit National Academic ID)
      - Institutional Roll / Registration / Student ID
    - Tamper-evident verification portal and scannable QR verification code.

---

## Architectural Principles & Coding Standards
- **Backend Framework:** FastAPI with async handlers (`async def`).
- **Database Layer:** SQLAlchemy 2.0 async engine (`asyncpg`) with strict schema models and explicit migrations (`alembic`).
- **Settings & Config:** Pydantic v2 `BaseSettings` reading environment variables with secure defaults.
- **Data Validation:** Strict Pydantic v2 schemas for all request payloads and response models.
- **Security:** Argon2id / bcrypt password hashing, JWT bearer tokens, Ed25519 signing keys for credentials, Merkle DAG integrity proofs.
- **Testing:** 100% async test suite using `pytest` + `pytest-asyncio` + `httpx.AsyncClient`.
