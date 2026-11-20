# =============================================================================
# Infraestructura como Código (Terraform) para AbarrotesIQ en AWS — Entregable E3
# Crea y recrea de forma declarativa e idempotente:
# 1. Bucket S3 del Data Lake (zonas raw/, clean/ y models/) con bloqueo de acceso público.
# 2. Colas Amazon SQS (cola principal + Dead-Letter Queue con maxReceiveCount = 3).
# 3. Rol y Política de IAM de Mínimo Privilegio para el Worker / AWS Lambda.
# 4. Alerta de Presupuesto FinOps ($0.01 USD / Zero-Spend Budget).
# =============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Proyecto    = "AbarrotesIQ"
      Negocio     = "Abarrotes-Judith"
      Entregable  = "E3-IaC"
      Autor       = "AngelS0lis"
    }
  }
}

# 1. Data Lake en Amazon S3 (con zonas raw/, clean/ y models/)
resource "aws_s3_bucket" "datalake" {
  bucket        = var.s3_bucket_name
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "datalake_privado" {
  bucket                  = aws_s3_bucket.datalake.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "datalake_cifrado" {
  bucket = aws_s3_bucket.datalake.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# 1b. Bucket S3 para Hosting Estático del Punto de Venta + Dashboard PWA ($0.00 Free Tier)
resource "aws_s3_bucket" "pos_web" {
  bucket        = "abarrotes-iq"
  force_destroy = true
}

resource "aws_s3_bucket_website_configuration" "pos_web_hosting" {
  bucket = aws_s3_bucket.pos_web.id
  index_document {
    suffix = "index.html"
  }
  error_document {
    key = "index.html"
  }
}

# 2. Middleware de Mensajes: Cola de Mensajes Fallidos (DLQ) y Cola Principal en Amazon SQS
resource "aws_sqs_queue" "ingesta_dlq" {
  name                      = "${var.project_prefix}-ingesta-dlq"
  message_retention_seconds = 1209600 # 14 días para auditoría de fallos
}

resource "aws_sqs_queue" "ingesta_queue" {
  name                       = "${var.project_prefix}-ingesta-queue"
  visibility_timeout_seconds = 30
  message_retention_seconds  = 345600 # 4 días
  receive_wait_time_seconds  = 10     # Long polling

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.ingesta_dlq.arn
    maxReceiveCount     = 3
  })
}

# 3. Rol y Política de IAM de Mínimo Privilegio para el Worker / Función Serverless Lambda
resource "aws_iam_role" "worker_lambda_role" {
  name = "${var.project_prefix}-worker-min-privilege-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "lambda.amazonaws.com",
            "ec2.amazonaws.com"
          ]
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "worker_least_privilege_policy" {
  name = "${var.project_prefix}-worker-least-privilege-policy"
  role = aws_iam_role.worker_lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "SoloLecturaRawS3"
        Effect   = "Allow"
        Action   = ["s3:GetObject"]
        Resource = "${aws_s3_bucket.datalake.arn}/raw/*"
      },
      {
        Sid      = "SoloEscrituraCleanYModelsS3"
        Effect   = "Allow"
        Action   = ["s3:PutObject"]
        Resource = [
          "${aws_s3_bucket.datalake.arn}/clean/*",
          "${aws_s3_bucket.datalake.arn}/models/*"
        ]
      },
      {
        Sid    = "ConsumoColaSQSYEnvioDLQ"
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:SendMessage"
        ]
        Resource = [
          aws_sqs_queue.ingesta_queue.arn,
          aws_sqs_queue.ingesta_dlq.arn
        ]
      },
      {
        Sid      = "LogsBasicosCloudWatch"
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}
