resource "aws_security_group" "rds" {
  name        = "${local.name}-rds-sg"
  description = "Acceso a RDS desde el backend"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "PostgreSQL desde backend"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.common_tags
}

resource "aws_db_subnet_group" "main" {
  name        = "${local.name}-dbsubnet"
  description = "Subnet group para RDS ${local.name}"
  subnet_ids  = [for s in aws_subnet.private : s.id]
  tags        = local.common_tags
}

resource "aws_kms_key" "db" {
  description             = "KMS key para cifrado RDS ${local.name}"
  enable_key_rotation     = true
  deletion_window_in_days = 30
  tags                    = local.common_tags
}

resource "aws_db_instance" "main" {
  identifier                 = local.name
  engine                     = "postgres"
  engine_version             = "16.2"
  instance_class             = "db.t4g.micro"
  allocated_storage          = 20
  storage_encrypted          = true
  kms_key_id                 = aws_kms_key.db.arn
  username                   = var.db_username
  password                   = var.db_password
  db_subnet_group_name       = aws_db_subnet_group.main.name
  vpc_security_group_ids     = [aws_security_group.rds.id]
  multi_az                   = false
  backup_retention_period    = 7
  auto_minor_version_upgrade = true
  publicly_accessible        = false
  skip_final_snapshot        = true
  tags                       = local.common_tags
}
