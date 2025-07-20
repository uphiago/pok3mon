output "instance_id" { value = aws_instance.web.id }
output "instance_public_ip" { value = aws_eip.web.public_ip }
output "security_group_id" { value = aws_security_group.web.id }
output "log_group_name" { value = aws_cloudwatch_log_group.app_logs.name }
output "vpc_id"     { value = data.aws_vpc.default.id }
output "subnet_ids" { value = data.aws_subnets.default.ids }