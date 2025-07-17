output "security_group_id" {
  description = "Security Group ID"
  value       = aws_security_group.web.id
}

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.web.id
}

output "instance_public_ip" {
  description = "Public IP"
  value       = aws_eip.web.public_ip
}

output "vpc_id" {
  description = "VPC default ID"
  value       = data.aws_vpc.default.id
}

output "subnet_ids" {
  description = "Subnets default"
  value       = data.aws_subnets.default.ids
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}