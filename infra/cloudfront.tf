# Certificado SSL/TLS no ACM (deve ser criado em us-east-1 para CloudFront)
resource "aws_acm_certificate" "admin" {
  provider          = aws.us_east_1
  domain_name       = "chat.lawrana.com"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "chat.lawrana.com"
    Environment = "Production"
  }
}

# Validação do certificado via DNS
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.admin.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.lawrana.zone_id
}

resource "aws_acm_certificate_validation" "admin" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.admin.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# Cache policy otimizada para Angular SPA
resource "aws_cloudfront_cache_policy" "angular_spa" {
  name        = "chat-lawrana-spa-cache-policy"
  comment     = "Cache policy for Angular SPA with low TTL"
  default_ttl = 60
  max_ttl     = 3600
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }
    enable_accept_encoding_gzip   = true
    enable_accept_encoding_brotli = true
  }
}

# Origin Access Control (OAC)
resource "aws_cloudfront_origin_access_control" "s3_oac" {
  name                              = "chat-lawrana-s3-oac"
  description                       = "OAC for S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "angular_distribution" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront distribution for chat.lawrana.com"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"
  
  aliases = ["chat.lawrana.com"]

  # Origin Access Control (OAC) - forma moderna de proteger S3
  origin {
    domain_name              = aws_s3_bucket.angular_app_bucket.bucket_regional_domain_name
    origin_id                = "S3-chat-lawrana"
    origin_access_control_id = aws_cloudfront_origin_access_control.s3_oac.id
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-chat-lawrana"

    cache_policy_id          = aws_cloudfront_cache_policy.angular_spa.id
    origin_request_policy_id = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf"

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  # Error pages para SPA (redireciona tudo para index.html)
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 300
  }

  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 300
  }

  # Certificado SSL
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.admin.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    Name        = "chat-lawrana-cloudfront"
    Environment = "Production"
  }

  depends_on = [aws_acm_certificate_validation.admin]
}

# Invalidação automática do cache após deploy
resource "null_resource" "invalidate_cloudfront" {
  triggers = {
    timestamp = timestamp()
  }

  provisioner "local-exec" {
    command     = "aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.angular_distribution.id} --paths \"/*\""
    interpreter = ["PowerShell", "-Command"]
  }

  depends_on = [aws_s3_object.angular_app_files]
}

# Outputs
output "cloudfront_distribution_id" {
  description = "CloudFront Distribution ID"
  value       = aws_cloudfront_distribution.angular_distribution.id
}

output "cloudfront_domain_name" {
  description = "CloudFront Domain Name"
  value       = aws_cloudfront_distribution.angular_distribution.domain_name
}

output "website_url" {
  description = "URL HTTPS do site"
  value       = "https://chat.lawrana.com"
}

output "certificate_arn" {
  description = "ARN do certificado SSL"
  value       = aws_acm_certificate.admin.arn
}
