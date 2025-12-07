
locals {
  domain_name     = "chat.lawrana.com"
  www_domain_name = "www.${local.domain_name}"
  
  common_tags = {
    Project     = "Chat Application"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}