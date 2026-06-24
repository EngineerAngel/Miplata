terraform {
  required_version = ">= 1.7"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "local" {
    path = "terraform.tfstate"
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project" {
  type    = string
  default = "miplata"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "domain_name" {
  type        = string
  description = "Subdominio completo, ej: finanzas.tudominio.com"
  default     = "miplata.local"
}

variable "db_username" {
  type      = string
  default   = "miplata"
  sensitive = true
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "repo_url" {
  type        = string
  description = "URL del repositorio GitHub a clonar en EC2"
  default     = "https://github.com/ANGEL-GOMEZ/Miplata.git"
}

locals {
  name = "${var.project}-${var.environment}"
  common_tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
