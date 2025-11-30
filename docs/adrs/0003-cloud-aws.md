# ADR 0003: Cloud — AWS

Status: Accepted

Context
- Need reliable hosting, managed services, secrets, observability, and CI/CD targets.

Decision
- Run backends on AWS. Use EKS (or ECS Fargate) for services, S3 for object storage, CloudWatch for logs/metrics, Secrets Manager/Parameter Store for secrets.

Consequences
- Pros: Mature managed services, strong IAM/security model, flexible networking.
- Cons: Added infra complexity vs PaaS; requires IaC and ops investment.

Implementation
- VPC with public/private subnets; EKS with node groups or Fargate profiles.
- Private connectivity to MongoDB Atlas (PrivateLink/peering) or self‑hosted Mongo on AWS.
- Amazon MQ (RabbitMQ) for messaging; S3 buckets for files and receipts.
- ALB/Ingress for API Gateway layer; ACM for TLS certs; WAF for L7 protections.

Security
- IAM roles for service accounts (IRSA); security groups; least privilege policies.
- Centralized TLS termination and HSTS; secret rotation policies.

Operational Notes
- GitHub Actions (or CodePipeline) for CI/CD; Helm for releases; blue/green or canary deployments.

