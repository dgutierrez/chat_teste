# Data source para buscar a hosted zone existente
data "aws_route53_zone" "lawrana" {
  name         = "lawrana.com"
  private_zone = false
}

# Record A com alias para o CloudFront Distribution
resource "aws_route53_record" "admin" {
  zone_id = data.aws_route53_zone.lawrana.zone_id
  name    = "chat.lawrana.com"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.angular_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.angular_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

output "admin_domain" {
  value       = aws_route53_record.admin.fqdn
  description = "URL do domínio admin"
}
