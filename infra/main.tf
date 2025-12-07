terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# Provider alias para us-east-1 (necessário para ACM com CloudFront)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "angular_app_bucket" {
  bucket = "${local.domain_name}"  # Nome do bucket
  force_destroy = true  # Permite deletar o bucket mesmo com arquivos

  tags = {
    Name        = "AngularAppBucket"
    Environment = "Production"
  }
}

resource "aws_s3_bucket_website_configuration" "angular_app_website" {
  bucket = aws_s3_bucket.angular_app_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"  # Para SPAs, redireciona para o index.html em caso de erro
  }
}

# Bucket policy para CloudFront OAC
resource "aws_s3_bucket_policy" "angular_app_bucket_policy" {
  bucket = aws_s3_bucket.angular_app_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action = "s3:GetObject"
        Resource = "${aws_s3_bucket.angular_app_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.angular_distribution.arn
          }
        }
      }
    ]
  })
}

resource "aws_s3_object" "angular_app_files" {
  for_each = fileset("${path.module}/../chat-app/dist/chat-app/browser", "**/*")

  bucket       = aws_s3_bucket.angular_app_bucket.bucket
  key          = each.key
  source       = "${path.module}/../chat-app/dist/chat-app/browser/${each.key}"
  etag         = filemd5("${path.module}/../chat-app/dist/chat-app/browser/${each.key}")
  
  # Define o content_type com base na extensão do arquivo
  content_type = lookup(
    {
      "html" = "text/html"
      "css"  = "text/css"
      "js"   = "application/javascript"
      "png"  = "image/png"
      "jpg"  = "image/jpeg"
      "jpeg" = "image/jpeg"
      "svg"  = "image/svg+xml"
      "json" = "application/json"
      "ico"  = "image/x-icon"
    },
    regex("[^.]+$", each.key),  # Extrai a extensão sem o ponto final
    "application/octet-stream"
  )
}

output "chattestandre_site" {
  value = aws_s3_bucket_website_configuration.angular_app_website.website_endpoint
}

