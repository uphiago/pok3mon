# Pok3mon Platform Challenge
[![CI/CD](https://github.com/uphiago/pok3mon/actions/workflows/deploy.yml/badge.svg)](https://github.com/uphiago/pok3mon/actions/workflows/deploy.yml)


This repository demonstrates a Node.js application ("Pok3mon") deployed to an AWS EC2 instance using Docker and Docker Compose, with infrastructure provisioning via Terraform. The CI/CD pipeline is managed by GitHub Actions, which handles linting, testing, building, pushing, and remotely deploying the container image.

--------------------------------------------------------------------------------
## 1. Overview

- **Application**:  
  A Node.js app designed to demonstrate a minimal front end, built in JavaScript and served on port 3000 within a container.

- **Infrastructure**:  
  Provisioned in AWS (region: sa‑east‑1) via Terraform.  
  The root configuration calls the module **`infra/modules/compute/`**,  
  which creates the EC2 instance, security group, Elastic IP and CloudWatch resources.

- **CI/CD**:
  Defined in GitHub Actions:  
  - Lint and test the code (ESLint + Vitest).  
  - Build and push a Docker image to GitHub Container Registry (GHCR).  
  - Deploy automatically to the EC2 instance using AWS Systems Manager (SSM) commands.

- **Reliability**:  
  - Container resilience: Auto‑restarts the service after crashes or host reboots.
  - Log access: Inspect docker and compose logs on the EC2 host or remotely via AWS SSM.
  - Pipeline visibility: GitHub Actions displays build, test and deploy results; any failure stops the workflow, surfaces the error in the repo UI, and sends an email notification.

--------------------------------------------------------------------------------
## 2. Repository Structure

- [pok3mon/](pok3mon/):  
  - Node.js application code, tests, and static files.  
  - [Dockerfile](pok3mon/Dockerfile): Multi-stage Docker build.  
  - [docker-compose.yml](pok3mon/docker-compose.yml): Defines the "pok3mon" service, port mappings, and environment configuration.

- [.github/workflows/](.github/workflows/):  
  - GitHub Actions CI/CD (build, test, push, deploy).

- [infra/](infra/):  
  - Root Terraform config (`main.tf`, `variables.tf`, `outputs.tf`) — backend, provider, module call.  
  - [modules/compute/](infra/modules/compute/): self‑contained module with EC2, networking and CloudWatch resources.  
  - Example variable files (`terraform.tfvars.example`) for local overrides.

--------------------------------------------------------------------------------
## 3. Prerequisites

To replicate this environment, you will need:

| Requirement               | Details / Version |
|---------------------------|-------------------|
| **Terraform**            | ≥ 1.12 (AWS provider 6.x) |
| **AWS CLI**              | Configured with a user/role that can manage EC2, SSM, S3, DynamoDB, CloudWatch |
| **GitHub Secrets**       | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `INSTANCE_ID` |
| **Docker + Compose**     | Docker ≥ 24.x (compose plugin) or docker‑compose ≥ 2.x |
| **Node.js**              | 20 LTS (for optional local dev) |

--------------------------------------------------------------------------------
## 4. Running Locally

Below are two approaches to run the Pok3mon application on your local machine:

### 4.1 Node.js (Development Mode)

1. Clone the repository:
   ```bash
   git clone https://github.com/uphiago/pok3mon.git
   cd pok3mon
   ```
2. Install dependencies:
   ```bash
   npm ci
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Access the app at http://localhost:3000

### 4.2 Docker

1. **Build** the image (run this also from /pok3mon/, where the `Dockerfile` lives):

   ```bash
   docker build -t pok3mon .
   ```

2. **Start** the container, binding port 3000 on your host:

   ```bash
   docker run -d \
    -p 3000:3000 \
    --name pok3mon \
    pok3mon
   ```

3. Open **http://localhost:3000** in your browser.

--------------------------------------------------------------------------------
## 5. Provisioning AWS Infrastructure (Terraform)

1. Navigate to the Terraform directory:
   ```bash
   cd infra/
   ```
2. Initialize Terraform:
   ```bash
   terraform init
   ```
   This downloads needed provider plugins and configures remote state if set up.
3. Review changes:
   ```bash
   terraform plan
   ```
4. Apply changes (this actually creates resources in AWS):
   ```bash
   terraform apply
   ```
5. After a successful apply, Terraform will output the newly created resources (e.g., `security_group_id`, `instance_id`, `instance_public_ip`). Note these for reference.

> **State backend**: Terraform state is stored in an S3 bucket (`pok3balde`) with locking/versioning via DynamoDB table `pok3balde‑tf‑lock`.

--------------------------------------------------------------------------------
## 6. CI/CD Pipeline (GitHub Actions)

A GitHub Actions workflow handles linting, testing, building, publishing, and deploying the container. The main workflow can be found under [.github/workflows/deploy.yml](.github/workflows/deploy.yml), typically triggered on:

- Push to the "main" branch  
- Pull requests  
- Manual dispatch from GitHub Actions tab

### 6.1 Job: quality

1. **Checkout**: Pulls the repository using actions/checkout@v4.
2. **Node.js Setup**: Uses actions/setup-node@v4 to install Node.js 20.x and set up npm cache.
3. **Install Dependencies**: Runs `npm ci` in the `pok3mon` folder.
4. **Lint**: Executes ESLint (`npm run lint:ci`) and produces an eslint-report.json artifact.
5. **Test**: Runs Vitest (`npm run test:ci`) with coverage, uploading coverage files as artifacts.

### 6.2 Job: build-push

1. **Docker Buildx**: Sets up a multi-platform build environment (docker/setup-buildx-action@v3).  
2. **Login**: Authenticates to GHCR using docker/login-action@v3 with GITHUB_TOKEN.  
3. **Build & Push**:  
   - docker/build-push-action@v5 to build the Docker image from Dockerfile.  
   - Tags: "latest" and "sha-<commit-hash>".  
   - Pushes images to GHCR.  

### 6.3 Job: deploy

1. **AWS Credentials**: Uses aws-actions/configure-aws-credentials@v4 with the necessary secrets.  
2. **AWS SSM Command**:  
   - Downloads the "docker-compose.yml" from the exact commit SHA in GitHub.  
   - Logs into GHCR.  
   - Runs `docker compose pull && docker compose up -d` on the remote EC2 instance via Systems Manager.  
   - Monitors success/failure, outputs logs from SSM.
   - The workflow waits with `aws ssm wait command-executed`. If the command status is not **Success**, the job fails automatically.

--------------------------------------------------------------------------------
## 7. Reliability & Observability

### 7.1 SLIs & SLOs

| SLI | SLO Target | Implementation |
|-----|------------|----------------|
| **Availability** (2xx requests) | ≥ 99.5 % per month | CloudWatch Log Metric Filter `GoodReq` + alarm **pok3mon‑availability** |
| **5xx Error Rate** | ≤ 1 % of total requests | Log Metric Filter `ErrorCount` + alarm **pok3mon‑5xx‑high** |
| **CPU Utilization** | < 80 % for two 5‑minute periods | Alarm **pok3mon‑app‑high‑cpu** |

### 7.2 Logs

- A **CloudWatch Logs Agent** ships container `stdout`/`stderr` to the log group  
  **/aws/ec2/pok3mon‑app**.

--------------------------------------------------------------------------------
## 8. Next Steps / Recommendations


1. **Expand Test Coverage** - add more Vitest suites and coverage thresholds.  
2. **Production Deployment** - consider AWS ECS Fargate or EKS for horizontal scaling.  
3. **SLO Dashboard** - surface the log‑based metrics in a CloudWatch or Grafana dashboard for live tracking.
4. **Environment Replication**: Provision isolated copies of critical components for dev, stg and prod to guarantee environment parity and avoid configuration drift (sorry about dev+stg, time gap issue xD).


Thanks for checking out the Pok3mon Platform Challenge!

- Repository URL: <https://github.com/uphiago/pok3mon>  
- Feel free to open issues/PRs with feedback or improvements.  

--------------------------------------------------------------------------------