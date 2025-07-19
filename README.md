# Pok3mon Platform Challenge - Infrastructure and CI/CD

This repository contains a containerized Node.js application and its associated infrastructure and CI/CD pipeline, deployed on AWS. Below is a concise technical overview of the project setup, infrastructure, and deployment process.

## Overview

- **Application**: A Node.js application running on port 3000, containerized using Docker.
- **Infrastructure**: AWS-based infrastructure in `sa-east-1`, provisioned with Terraform, running two containers on an EC2 instance.
- **Environments**: `development` and `staging`.
- **CI/CD**: GitHub Actions pipelines for building, pushing Docker images to GitHub Container Registry (GHCR), and deploying to AWS EC2 via AWS Systems Manager (SSM).
- **State Management**: Terraform state stored remotely in an S3 bucket (`pok3balde`) with versioning and locking enabled.

## Repository Structure

- `pok3mon/`: Node.js application source code.
  - `package.json`, `package-lock.json`: Node.js dependencies.
  - `src/`: Application source files (JavaScript/TypeScript).
  - `Dockerfile`: Defines the Docker image build process.
  - `docker-compose.yml`: Configures container deployment.
- `.github/workflows/`: GitHub Actions workflows for CI/CD.
- `terraform/`: Terraform configuration for AWS infrastructure.

## Infrastructure

- **AWS Region**: `sa-east-1`
- **EC2 Instance**:
  - Type: `t3.micro`
  - OS: Ubuntu 24.04 LTS
  - Runs two containers: the `pok3mon` application and supporting services (defined in `docker-compose.yml`).
- **Terraform**:
  - Provisions EC2 instance and required resources.
  - Remote state stored in S3 bucket `pok3balde` with versioning and DynamoDB lockfile for state management.
  - Configuration located in `terraform/` directory.

## CI/CD Pipeline

The CI/CD pipeline is defined in `.github/workflows/` and consists of three jobs: `quality`, `build-push`, and `deploy`. It triggers on push to `main`, pull requests, or manual dispatch.

### 1. Quality Job
- **Runner**: `ubuntu-latest` (Ubuntu 24.04.2 LTS, runner version 2.326.0)
- **Permissions**: Read-only for `contents`, `metadata`, `packages`.
- **Steps**:
  1. **Checkout**: Clones `uphiago/pok3mon` using `actions/checkout@v4` (version 4.2.2).
  2. **Setup Node.js**: Configures Node.js 20.19.3 with npm caching (`actions/setup-node@v4`, version 4.4.0).
  3. **Install Dependencies**: Runs `npm ci` in `pok3mon/` (304 packages, no vulnerabilities).
  4. **Linting**: Runs ESLint (`npm run lint:ci`) on `src/**/*.{js,jsx,ts,tsx}`, outputs `eslint-report.json`.
  5. **Testing**: Runs Vitest (`npm run test:ci`) with coverage (44.23% statements covered in `main.js`).
  6. **Artifacts**: Uploads `eslint-report.json` and `vitest-report.json` with coverage files using `actions/upload-artifact@v4` (version 4.6.2).

### 2. Build-Push Job
- **Runner**: `ubuntu-latest`
- **Permissions**: Write for `packages`, read for `contents`, `metadata`.
- **Steps**:
  1. **Checkout**: Clones repository.
  2. **Setup Buildx**: Initializes Docker Buildx (`docker/setup-buildx-action@v3`, version 3.11.1).
  3. **Authenticate to GHCR**: Logs into `ghcr.io` using `docker/login-action@v3` (version 3.4.0) with `GITHUB_TOKEN`.
  4. **Build and Push**: Builds and pushes Docker image using `docker/build-push-action@v5` (version 5.4.0):
     - Context: `pok3mon/`
     - Dockerfile: `pok3mon/Dockerfile`
     - Build Arg: `BASE_PATH=/pok3mon/`
     - Tags: `ghcr.io/uphiago/pok3mon:latest`, `ghcr.io/uphiago/pok3mon:sha-<commit-hash>`
     - Cache: GitHub Actions cache (`type=gha,mode=max`).
     - Base Images: `node:20-bullseye-slim` (build), `node:20-alpine` (runtime).

### 3. Deploy Job
- **Runner**: `ubuntu-latest`
- **Permissions**: Read for `contents`, `packages`, write for `id-token`.
- **Environment**: `development`
- **Steps**:
  1. **Configure AWS Credentials**: Uses `aws-actions/configure-aws-credentials@v4` with AWS access keys and region.
  2. **Trigger SSM Command**: Sends a shell script to an EC2 instance via AWS SSM (`AWS-RunShellScript`):
     - Downloads `docker-compose.yml` from the repository at the commit SHA.
     - Logs into GHCR.
     - Pulls and starts containers with `docker compose up -d --pull always`.
     - Command ID and status are logged, with success confirmed.
  3. **Error Handling**: Checks SSM command status, outputs logs, and fails on error.

## Deployment Details

- **Target**: Single EC2 instance in `sa-east-1`.
- **Container**: Runs `ghcr.io/uphiago/pok3mon:sha-<commit-hash>` (e.g., `sha-5f4a566035d0ddeb8d54393474f2bedd98873e87`).
- **Docker Compose**: Configures the `pok3mon` service and network (`11320_default`).
- **Security**: AWS credentials and `GITHUB_TOKEN` are used securely (redacted in logs).

## Known Issues and Recommendations

- **Low Test Coverage**: 44.23% statement coverage in `main.js` (uncovered lines: 27–35, 38–64). Add tests to improve coverage.
- **ESLint Validation**: No explicit failure on lint errors. Add exit code check for `npm run lint:ci`.
- **Docker Security**: Unencrypted credentials warning in `/root/.docker/config.json`. Configure a credential helper (see [Docker Credential Store](https://docs.docker.com/go/credential-store/)).
- **Build Optimization**: Enable `pull: true` in `docker/build-push-action` to ensure fresh base images.
- **Deployment Scalability**: Single EC2 instance limits high availability. Consider AWS ECS/EKS for managed orchestration.
- **Monitoring**: Enable CloudWatch logging for SSM commands and add application health checks.

## Getting Started

1. **Prerequisites**:
   - AWS account with credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`).
   - GitHub repository with `GITHUB_TOKEN` for GHCR access.
   - Terraform installed for infrastructure provisioning.
   - S3 bucket `pok3balde` and DynamoDB table for state management.

2. **Setup Infrastructure**:
   ```bash
   cd terraform/
   terraform init
   terraform apply
   ```
   Ensure `pok3balde` bucket and DynamoDB table are configured.

3. **Run CI/CD**:
   - Push to `main` or create a PR to trigger the pipeline.
   - Monitor jobs in the GitHub Actions tab of the repository (`https://github.com/uphiago/pok3mon/actions`).

4. **Verify Deployment**:
   - Check SSM command logs in AWS Console.
   - Access the application on port 3000 of the EC2 instance’s public IP.

## References

- **Repository**: [uphiago/pok3mon](https://github.com/uphiago/pok3mon)
- **Dockerfile**: [pok3mon/Dockerfile](pok3mon/Dockerfile)
- **Docker Compose**: [pok3mon/docker-compose.yml](pok3mon/docker-compose.yml)
- **Pipeline**: [.github/workflows/](.github/workflows/)
- **Terraform**: [terraform/](terraform/)
- **Runner Image**: [GitHub Runner Images](https://github.com/actions/runner-images/blob/ubuntu24/20250710.1/images/ubuntu/Ubuntu2404-Readme.md)
- **Artifacts**:
  - ESLint Report: [eslint-report](https://github.com/uphiago/pok3mon/actions/runs/16388631853/artifacts/3569490991)
  - Vitest Results: [vitest-results](https://github.com/uphiago/pok3mon/actions/runs/16388631853/artifacts/3569491031)

## Contributing

- Submit issues or PRs to [uphiago/pok3mon](https://github.com/uphiago/pok3mon).
- Ensure tests cover new code and pass linting.
- Update `terraform/` for infrastructure changes and test locally before applying.

---

This documentation is designed to be concise, technical, and suitable for the GitHub README. It includes references to project-specific resources (e.g., repository, artifacts) and actionable guidance for setup and improvements. Let me know if you need adjustments or additional sections!