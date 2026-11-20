output "s3_datalake_bucket_name" {
  description = "Nombre del bucket S3 creado para raw/, clean/ y models/"
  value       = aws_s3_bucket.datalake.bucket
}

output "s3_datalake_bucket_arn" {
  description = "ARN del bucket S3 del Data Lake"
  value       = aws_s3_bucket.datalake.arn
}

output "sqs_ingesta_queue_url" {
  description = "URL de la cola principal de ingesta en Amazon SQS"
  value       = aws_sqs_queue.ingesta_queue.id
}

output "sqs_ingesta_dlq_url" {
  description = "URL de la Dead-Letter Queue (DLQ) en Amazon SQS"
  value       = aws_sqs_queue.ingesta_dlq.id
}

output "iam_worker_role_arn" {
  description = "ARN del rol de IAM de mínimo privilegio para el Worker / Lambda"
  value       = aws_iam_role.worker_lambda_role.arn
}

output "pos_web_s3_endpoint_url" {
  description = "URL pública en AWS S3 Static Website Hosting del Punto de Venta + Dashboard ($0.00)"
  value       = "http://${aws_s3_bucket_website_configuration.pos_web_hosting.website_endpoint}"
}
