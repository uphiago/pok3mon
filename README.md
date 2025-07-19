# Pok3mon Platform Challenge

This repository demonstrates a Node.js application ("Pok3mon") deployed to an AWS EC2 instance using Docker and Docker Compose, with infrastructure provisioning via Terraform. The CI/CD pipeline is managed by GitHub Actions, which handles building, testing, pushing, and remotely deploying the container image.

--------------------------------------------------------------------------------
## 1. Overview

- **Application**:  
  A Node.js app designed to demonstrate a minimal front end, built in JavaScript and served on port 3000 within a container.

- **Infrastructure**:  
  Provisioned in AWS (region: sa-east-1). Includes one EC2 instance (t3.micro) running Ubuntu 24.04, Docker, and Docker Compose.

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
  - Terraform configuration files (main.tf, variables.tf, outputs.tf) for AWS provisioning.  
  - Example variable files (e.g., .tfvars.example) for referencing local overrides.

--------------------------------------------------------------------------------
## 3. Prerequisites

To replicate this environment, you will need:

- A GitHub account with permissions to push and configure GitHub Actions.  
- AWS CLI configured with valid credentials (Access Key, Secret Key, default region).  
- Terraform installed (compatible with version declared in the infra/ directory).  
- Docker installed (including Docker Compose plugin or docker-compose installed separately).  
- Node.js 20+ (for local testing if needed).

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
   docker build -t pok3mon:latest .
   ```

2. **Start** the container, binding port 3000 on your host:

   ```bash
   docker run -d \
    -p 3000:3000 \
    --name pok3mon \
    pok3mon:latest
   ```

3. Open **http://localhost:3000** in your browser.

--------------------------------------------------------------------------------
## 5. Provisioning AWS Infrastructure (Terraform)

1. Navigate to the Terraform directory:
   ```bash
   cd terraform/
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

--------------------------------------------------------------------------------
## 6. CI/CD Pipeline (GitHub Actions)

A GitHub Actions workflow handles testing, building, publishing, and deploying the container. The main workflow can be found under [.github/workflows/deploy.yml](.github/workflows/deploy.yml), typically triggered on:

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
   - docker/build-push-action@v5 to build the Docker image from .\pok3mon\Dockerfile.  
   - Tags: "latest" and "sha-<commit-hash>".  
   - Pushes images to GHCR.  

### 6.3 Job: deploy

1. **AWS Credentials**: Uses aws-actions/configure-aws-credentials@v4 with the necessary secrets.  
2. **AWS SSM Command**:  
   - Downloads the "docker-compose.yml" from the exact commit SHA in GitHub.  
   - Logs into GHCR.  
   - Runs `docker compose pull && docker compose up -d --pull always` on the remote EC2 instance via Systems Manager.  
   - Monitors success/failure, outputs logs from SSM.

--------------------------------------------------------------------------------
## 7. Reliability & Observability (NEEDS REVIEW, NOT IMPLEMENTED)

1. **SLIs/SLOs**:   ATTENTION! NOT IMPLEMENTED YET
   - Availability: target 99% container uptime per month.  
   - Error Rate: keep 5xx errors under 1% of total requests.  

2. **Logs**:
   - By default, you can check Docker logs on the EC2 instance using `docker logs <pok3mon-container-id>`.
   - Alternatively, you can attach CloudWatch or another logging solution for long-term analysis and alerting.

3. **Alerts**: ATTENTION! NOT IMPLEMENTED YET
   - Adding CloudWatch Alarms on CPU usage or container exit codes.  
   - For sophisticated monitoring (APM, traces), consider third-party services or more advanced AWS features (e.g., ECS, EKS, or CloudWatch Container Insights).

--------------------------------------------------------------------------------
## 8. Next Steps / Recommendations

1. **Expand Test Coverage**: Current coverage is partial; add more Vitest tests to improve reliability.
2. **Production-Grade Deployment**: For high availability, we can also consider AWS ECS Fargate or EKS.
3. **Security**: Use a credential helper to avoid storing Docker credentials in plain text.
4. **Terraform Modularization**: Break out resources into smaller modules if the infrastructure grows complex.
5. **Environment Replication**: Provision isolated copies of critical components for dev, stg and prod to guarantee environment parity and avoid configuration drift (sorry about dev+stg, time gap issue xD).


Thanks for checking out the Pok3mon Platform Challenge! 

- Repository URL: <https://github.com/uphiago/pok3mon>  
- Feel free to open issues/PRs with feedback or improvements.  

--------------------------------------------------------------------------------