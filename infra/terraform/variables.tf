variable "aws_region" {
  description = "Región de AWS para desplegar los recursos en Free Tier"
  type        = string
  default     = "us-east-1"
}

variable "project_prefix" {
  description = "Prefijo para nombrar colas SQS y roles IAM"
  type        = string
  default     = "abarrotesiq"
}

variable "s3_bucket_name" {
  description = "Nombre único global del bucket S3 del Data Lake de Abarrotes Judith"
  type        = string
  default     = "abarrotesiq-datalake-judith"
}
