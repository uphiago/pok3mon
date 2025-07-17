# Plataforma Challenge – Infra + CI/CD

Este repositório contém:
- App Node containerizado (porta 3000).
- Infra AWS (sa-east-1) com Terraform: EC2 t3.micro Ubuntu 24.04 rodando dois containers.
- Ambientes: dev e stg.
- Estado remoto S3 (`pok3balde`), versioning e lockfile.
- Pipelines GitHub Actions: build/push GHCR + deploy.

> Documentação detalhada em breve.
