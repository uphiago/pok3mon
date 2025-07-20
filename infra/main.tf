terraform {
  required_version = ">= 1.12.2"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  backend "s3" {
    bucket         = "pok3balde"
    key            = "webapp/terraform.tfstate"
    region         = "sa-east-1"
    dynamodb_table = "pok3balde-tf-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

module "compute" {
  source           = "./modules/compute"
  project_name     = var.project_name
  environment      = var.environment
  ssh_public_key   = var.ssh_public_key
  ssh_allowed_cidr = var.ssh_allowed_cidr
  ami_id           = var.ami_id
  instance_type    = var.instance_type
  aws_region       = var.aws_region
}
