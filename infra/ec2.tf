resource "aws_security_group" "backend" {
  name        = "${local.name}-backend-sg"
  description = "Acceso al backend NestJS"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP (Caddy)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS (Caddy)"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_allowed_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.common_tags
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "backend" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.small"
  subnet_id              = aws_subnet.public["a"].id
  vpc_security_group_ids = [aws_security_group.backend.id]
  monitoring             = true
  key_name               = "Claver"

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
    encrypted   = true
  }

  user_data = templatefile("${path.module}/user-data.sh", {
    db_host     = aws_db_instance.main.address
    db_user     = var.db_username
    db_password = var.db_password
    db_name     = "miplata"
    jwt_secret  = var.jwt_secret
    domain      = var.domain_name
    repo_url    = var.repo_url
  })

  tags = merge(local.common_tags, { Name = "${local.name}-backend" })
}

resource "aws_eip" "backend" {
  instance = aws_instance.backend.id
  domain   = "vpc"
  tags     = local.common_tags
}

output "backend_public_ip" {
  value = aws_eip.backend.public_ip
}

output "rds_endpoint" {
  value = aws_db_instance.main.address
}

output "s3_bucket" {
  value = aws_s3_bucket.storage.bucket
}
