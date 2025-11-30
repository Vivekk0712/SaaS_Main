# Infra Placeholders

This directory will contain Terraform (AWS) and Helm charts for Kubernetes deployments.

Planned layout
- `terraform/` VPC, EKS, Amazon MQ (RabbitMQ), IAM roles, S3, Secrets Manager.
- `k8s/` Helm charts per service with Deployment, Service, Ingress, HPA.
- `gateway/` NGINX Ingress or AWS ALB Ingress configuration with rate limiting and JWT validation.

