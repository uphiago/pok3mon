output "instance_id" { value = module.compute.instance_id }
output "instance_public_ip" { value = module.compute.instance_public_ip }
output "security_group_id" { value = module.compute.security_group_id }
output "project_name" { value = var.project_name }
output "instance_public_dns" { value = module.compute.public_dns }
output "ssm_managed_instance_id" { value = module.compute.ssm_managed_id }