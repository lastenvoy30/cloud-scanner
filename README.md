# Perimeter — Automated Cloud Security Scanner

**Startups misconfigure cloud infrastructure fast — and it costs them.** Public S3 buckets, security groups wide open to the internet, and over-privileged IAM users are consistently among the top causes of real-world data breaches. Perimeter continuously scans an AWS account for these misconfigurations, scores the account's security posture like a credit score (A–F), and hands back exact, copy-pasteable remediation commands.

---

## 🚀 What it does

1. **Scans your AWS account** across S3, EC2 Security Groups, and IAM in parallel
2. **Flags real misconfigurations**:
   - Publicly accessible S3 buckets
   - Security groups exposing SSH/RDP/database ports to `0.0.0.0/0`
   - IAM users with `AdministratorAccess` attached directly
3. **Scores the account** (0–100) and assigns a letter grade based on severity-weighted findings
4. **Tracks history** so you can see your security posture trend over time
5. **Exports a PDF audit report** for sharing with stakeholders
6. **Lets you delete** old/test scans to keep your history clean

---

## 🖼️ Screenshots

![alt text](image.png)

![alt text](image-1.png)

![alt text](image-2.png)

![alt text](image-3.png)


---

## 🏗️ Architecture

┌─────────────────┐ ┌──────────────────┐ ┌─────────────┐
│ Next.js UI │ ──────► │ Express API │ ──────► │ AWS SDK │
│ (dashboard, │ REST │ (checks, scoring,│ reads │ (S3, EC2, │
│ scan pages) │ ◄────── │ PDF generation) │ ◄────── │ IAM) │
└─────────────────┘ └────────┬──────────┘ └─────────────┘
│
▼
┌───────────────┐
│ MongoDB │
│ (scan history)│
└───────────────┘


**Flow:** User clicks "Run Scan" → backend calls three AWS security checks in parallel → findings are merged and scored → result is saved to MongoDB → frontend redirects to a dedicated results page for that scan.

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), React, Tailwind CSS, Recharts |
| Backend | Node.js, Express |
| Database | MongoDB (Atlas or local) |
| Cloud Integration | AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/client-ec2`, `@aws-sdk/client-iam`) |
| PDF Generation | pdfkit |

---

## 🔍 Security Checks

| Check | What it detects | Severity |
|---|---|---|
| **S3 Public Access** | Buckets with public read access via bucket policy | CRITICAL |
| **Open Security Groups** | Inbound rules allowing SSH (22), RDP (3389), MySQL (3306), or PostgreSQL (5432) from `0.0.0.0/0` | CRITICAL |
| **Over-Privileged IAM Users** | Users with `AdministratorAccess` attached directly instead of least-privilege policies | HIGH |

Each finding includes the affected resource, a human-readable description, and a ready-to-run AWS CLI remediation command.

### Scoring

Findings deduct points based on severity (CRITICAL: -25, HIGH: -15, MEDIUM: -8, LOW: -3), floored at 0, then mapped to a letter grade:

| Score | Grade |
|---|---|
| 90–100 | A |
| 75–89 | B |
| 60–74 | C |
| 40–59 | D |
| 0–39 | F |

---

## ⚙️ Setup

### Prerequisites
- Node.js 18+
- An AWS account with a read-only IAM user (see below)
- MongoDB instance (local or [Atlas free tier](https://www.mongodb.com/cloud/atlas/register))

### 1. Clone and install

```bash
git clone https://github.com/lastenvoy30/cloud-scanner
cd cloud-scanner

cd backend && npm install
cd ../frontend && npm install
```

### 2. AWS setup

Create an IAM user with the AWS-managed `SecurityAudit` policy attached (read-only, covers everything this tool needs) and generate an access key for it.

### 3. Environment variables

`backend/.env`:

AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
MONGO_URI=your_mongodb_connection_string
PORT=5000

`frontend/.env.local`:

NEXT_PUBLIC_API_URL=http://localhost:5000

### 4. Run it

```bash
# Terminal 1 — backend
cd backend
node src/server.js

# Terminal 2 — frontend
cd frontend
npm run dev
```

Open `http://localhost:3000` and click **Run New Scan**.

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/scan/run` | Runs all security checks, saves and returns the result |
| `GET` | `/api/scan/history` | Returns the 20 most recent scans |
| `GET` | `/api/scan/:id` | Returns a single scan by ID |
| `GET` | `/api/scan/:id/pdf` | Downloads a PDF report for a scan |
| `DELETE` | `/api/scan/:id` | Deletes a scan |
| `GET` | `/api/health` | Backend + MongoDB health check |

---

## 🗺️ Roadmap

- **Cross-account scanning via IAM role assumption (STS `AssumeRole`)** — so we never need a user's raw AWS credentials, matching how production tools like Wiz and Prisma Cloud connect to customer accounts
- Additional checks: unencrypted EBS volumes, S3 versioning disabled, stale IAM access keys
- Mapping findings to compliance frameworks (CIS AWS Benchmark, SOC 2)
- Slack/email alerts on new CRITICAL findings

**Note on current scope:** this build scans a single connected AWS account (configured via environment variables) rather than supporting arbitrary customer accounts — appropriate for this demo, with the multi-tenant path outlined above as next steps.

---

## 👥 Built for AAROH HACKATHON IIIT Delhi — Cybersecurity Track

Problem: Startups often misconfigure cloud infrastructure, exposing confidential data.