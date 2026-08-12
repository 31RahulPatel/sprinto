If you had to create this **Compliance Platform from scratch**, this is the full master prompt you could give to an AI coding assistant (Cursor/ChatGPT/Claude) to generate the project step-by-step.

Copy this entire prompt.

---

# Full Project Generation Prompt

## Role

You are a senior **Cloud Security Architect, DevOps Engineer, Backend Engineer, and Frontend Engineer**.

Build a production-grade **Cloud Compliance Management Platform** from scratch.

The application should be similar in capability to enterprise products like AWS Security Hub, Wiz, Prisma Cloud, and compliance automation platforms.

The goal is to create a platform that:

* Connects to cloud environments
* Runs security/compliance scans
* Collects vulnerabilities and misconfigurations
* Maps findings to compliance frameworks
* Provides dashboards and reports
* Supports multiple users and organizations

---

# Project Name

Create:

```
compliance-platform
```

Structure:

```
compliance-platform/

├── backend/
├── frontend/
├── docker-compose.yml
├── docs/
├── scripts/
├── terraform/
├── reports/
└── README.md
```

---

# Architecture

Use a microservice-ready architecture.

## Backend

Technology:

* NestJS
* TypeScript
* Prisma ORM
* PostgreSQL
* JWT Authentication
* Passport
* BullMQ
* Redis
* Docker

Responsibilities:

* Authentication
* User management
* Cloud integrations
* Scan orchestration
* Finding processing
* Report generation
* Audit logging

---

## Frontend

Technology:

* React
* TypeScript
* Vite
* Material UI
* React Router
* Axios
* React Query

Responsibilities:

* Login
* Dashboard
* Scan management
* Findings visualization
* Reports
* User settings

---

# Infrastructure

Use Docker Compose.

Create:

```
docker-compose.yml
```

Services:

```
postgres
redis
backend
frontend
prowler
nginx
```

---

# Database Design

Use Prisma.

Create models:

## User

Fields:

```
id
name
email
passwordHash
role
createdAt
updatedAt
```

Roles:

```
ADMIN
USER
VIEWER
```

---

## Organization

```
id
name
createdAt
```

---

## CloudAccount

Store:

```
id
organizationId

provider

AWS
AZURE
GCP

accountId

region

credentialsEncrypted

createdAt
```

---

## Scan

Fields:

```
id

organizationId

cloudAccountId

provider

service

status

startedAt

completedAt

reportPath

createdAt
```

Status:

```
QUEUED
RUNNING
COMPLETED
FAILED
```

---

## Finding

Store:

```
id

scanId

title

description

severity

status

resource

service

category

frameworks

remediation

createdAt
```

Severity:

```
CRITICAL
HIGH
MEDIUM
LOW
INFO
```

---

## Report

```
id

scanId

type

PDF
CSV
HTML

location

createdAt
```

---

## AuditLog

Track:

```
user
action
timestamp
ipAddress
```

---

# Authentication Module

Implement:

## Register

API:

```
POST /auth/register
```

Features:

* bcrypt password hashing
* Validation
* Duplicate email protection

---

## Login

API:

```
POST /auth/login
```

Return:

```
{
 accessToken,
 user
}
```

Use:

* JWT
* Guards
* Roles

---

# Authorization

Implement:

## RBAC

Roles:

Admin:

* Manage users
* Run scans
* View reports

User:

* Run scans
* View findings

Viewer:

* Read only

---

# Cloud Scanning Engine

Integrate:

## Prowler

Use Docker container:

```
toniblyx/prowler
```

Workflow:

User starts scan:

```
Frontend
 |
 API
 |
 Scan Service
 |
 Queue
 |
 Worker
 |
 Prowler Container
 |
 JSON Output
 |
 Database
 |
 Dashboard
```

---

# AWS Integration

Support:

## IAM

Checks:

* Password policy
* MFA
* Access keys
* Privileges

## S3

Checks:

* Public buckets
* Encryption
* Logging
* Versioning

## EC2

Checks:

* Security groups
* Public IP
* Encryption

## RDS

Checks:

* Encryption
* Public accessibility

## CloudTrail

Checks:

* Logging enabled

## KMS

Checks:

* Key rotation

---

# Scan APIs

Create:

```
POST /scans/start
```

Start scan.

```
GET /scans
```

Return scan history.

```
GET /scans/:id
```

Return scan details.

```
GET /findings/:scanId
```

Return findings.

---

# Dashboard API

Create:

```
GET /dashboard
```

Return:

```
{
 totalFindings,
 critical,
 high,
 medium,
 low,

 totalScans,

 complianceScore
}
```

---

# Frontend Pages

Create:

```
src/pages
```

## Login

Features:

* Email
* Password
* JWT login

---

## Dashboard

Display:

Cards:

```
Total Findings

Critical

High

Medium

Low

Compliance Score
```

Charts:

* Severity distribution
* Findings trend
* Services affected

---

## Scan Page

Show:

Table:

```
Provider
Service
Status
Started
Completed
```

Click:

```
Scan
 |
 v
Findings
```

---

## Findings Page

Display:

Table:

```
Severity

Service

Resource

Category

Status

Title
```

Features:

* Search
* Filter
* Sorting
* Pagination

---

## Finding Details

Click finding:

Open drawer:

Display:

```
Description

Risk

Affected Resource

Compliance Mapping

Remediation

References
```

---

# Reports Module

Generate:

## PDF

Include:

* Executive summary
* Compliance score
* Findings
* Recommendations

## CSV

Export findings.

## HTML

Web report.

---

# Scheduler

Implement:

Automatic scans:

```
Daily
Weekly
Monthly
```

Use:

* BullMQ
* Redis
* Cron

---

# Notifications

Support:

Email:

* Scan completed
* Critical finding detected

Slack:

* Security alerts

Teams:

* Compliance reports

---

# DevOps Requirements

Create:

## Dockerfiles

Backend:

```
backend/Dockerfile
```

Frontend:

```
frontend/Dockerfile
```

---

## CI/CD

Create pipeline:

Stages:

```
Install

Lint

Test

Build

Docker Build

Deploy
```

Support:

* Bitbucket Pipelines
* GitHub Actions

---

# Production Deployment

Prepare:

## Kubernetes

Create:

```
k8s/

deployment.yaml

service.yaml

ingress.yaml

configmap.yaml

secret.yaml
```

---

## Terraform

Create:

```
terraform/

vpc

eks

rds

security-groups
```

---

# Security Requirements

Implement:

* Helmet
* Rate limiting
* Input validation
* Encryption at rest
* Secrets management
* Audit logging
* Secure headers

---

# Testing

Backend:

* Unit tests
* Integration tests

Frontend:

* Component tests

---

# Documentation

Create:

README:

Include:

* Architecture
* Installation
* Environment variables
* Docker setup
* Deployment

Docs:

```
docs/

architecture.md

api.md

database.md

deployment.md
```

---

# Development Order

Build in this order:

## Phase 1

Foundation:

* Repository
* Docker
* PostgreSQL
* Prisma
* NestJS
* React

## Phase 2

Authentication:

* Register
* Login
* JWT
* RBAC

## Phase 3

Scanning:

* Prowler
* Scan service
* Queue
* Reports

## Phase 4

Dashboard:

* APIs
* UI
* Charts

## Phase 5

Findings:

* Storage
* Filters
* Details

## Phase 6

Reports:

* PDF
* CSV
* HTML

## Phase 7

Production:

* CI/CD
* Kubernetes
* Terraform

---

# Coding Standards

Follow:

* Clean architecture
* SOLID principles
* TypeScript strict mode
* Proper error handling
* Environment variables
* Meaningful naming
* Production-quality code

Do not create demo/mock data.

Everything must connect to real APIs and database.

Start by creating the repository structure and backend foundation. Then proceed module by module.

---

This prompt will recreate the same type of application we built, but with a more complete enterprise roadmap from day one.
