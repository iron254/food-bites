# Deployment & Infrastructure Guide for 100K Users

## Architecture Overview

```
                        ┌─────────────────┐
                        │  CDN (Cloudflare)│
                        │  Static Assets   │
                        └────────┬─────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              ┌─────▼────┐           ┌────────▼────┐
              │ Load      │           │   Load      │
              │ Balancer  │           │   Balancer  │
              │ (Cloud    │           │   (Cloud    │
              │  LB)      │           │   LB)       │
              └─────┬────┘           └────────┬────┘
                    │                         │
        ┌───────────┼───────────┬───────────┬┘
        │           │           │           │
    ┌───▼──┐   ┌───▼──┐   ┌───▼──┐   ┌───▼──┐
    │Node  │   │Node  │   │Node  │   │Node  │
    │App 1 │   │App 2 │   │App 3 │   │App 4 │
    └───┬──┘   └───┬──┘   └───┬──┘   └───┬──┘
        │           │           │           │
        └───────────┼───────────┼───────────┘
                    │           │
            ┌───────▼─┬─────────▼────┐
            │         │              │
        ┌───▼──┐  ┌──▼───┐    ┌─────▼────┐
        │Redis │  │MySQL │    │MySQL Read│
        │Cache │  │Master│    │Replicas  │
        └──────┘  └──────┘    └──────────┘
```

## Infrastructure Requirements

### Compute (Node.js Instances)
- **Instances**: 4-6 (auto-scaling 2-10 based on load)
- **Machine Type**: 2 vCPU, 4GB RAM (e.g., n1-standard-2 on GCP)
- **Region**: Multi-region for redundancy
- **Auto-scaling**: CPU > 70% → scale up, CPU < 30% → scale down

### Database
- **MySQL**: 8 vCPU, 32GB RAM, SSD storage
- **Read Replicas**: 2-3 for read scaling
- **Backup**: Daily automated backups, 30-day retention
- **Failover**: Automatic failover to read replica if primary fails

### Caching
- **Redis**: 4GB cluster (3 nodes for high availability)
- **Memory**: 2GB per node
- **Persistence**: AOF (Append-Only File) enabled
- **Replication**: 1 replica per node

### Storage
- **S3/Cloud Storage**: For receipts, images, logs
- **CDN**: Cloudflare or similar for static assets
- **Backup**: Cross-region replication

## Deployment Steps

### 1. Prepare Infrastructure (Week 1)

```bash
# Create database with indexes
gcloud sql instances create food-bites-prod \
  --database-version=MYSQL_8_0 \
  --tier=db-n1-highmem-4 \
  --region=us-central1

# Create read replicas
gcloud sql instances clone food-bites-prod food-bites-read-1
gcloud sql instances clone food-bites-prod food-bites-read-2

# Set up Redis
gcloud redis instances create food-bites-cache \
  --size=4 \
  --region=us-central1 \
  --redis-version=7.0
```

### 2. Deploy Application (Week 1-2)

```bash
# Build Docker image
docker build -t gcr.io/project/food-bites:latest .

# Push to registry
docker push gcr.io/project/food-bites:latest

# Deploy to Kubernetes
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml  # Horizontal Pod Autoscaler
```

### 3. Configure Load Balancing (Week 2)

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: food-bites-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: food-bites
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 4. Set Up Monitoring (Week 2-3)

```bash
# Deploy Prometheus
kubectl apply -f monitoring/prometheus.yaml

# Deploy Grafana
kubectl apply -f monitoring/grafana.yaml

# Deploy ELK Stack for logs
kubectl apply -f logging/elasticsearch.yaml
kubectl apply -f logging/kibana.yaml
```

### 5. Performance Testing (Week 3)

```bash
# Load test with k6
k6 run load-test.js --vus 1000 --duration 5m

# Expected results:
# - p95 response time: < 500ms
# - p99 response time: < 1000ms
# - Error rate: < 0.1%
# - Throughput: > 200 req/s
```

## Environment Variables

```bash
# Database
DATABASE_URL=mysql://user:pass@host:3306/food_bites
DB_POOL_SIZE=20

# Redis
REDIS_HOST=redis-cache.internal
REDIS_PORT=6379
REDIS_PASSWORD=secure_password

# Application
NODE_ENV=production
LOG_LEVEL=info
RATE_LIMIT_ENABLED=true
CACHE_TTL=300

# Monitoring
METRICS_ENABLED=true
TRACE_ENABLED=true
```

## Scaling Strategy

### Vertical Scaling (Immediate)
1. Increase database instance size
2. Increase Redis memory
3. Increase Node.js memory allocation

### Horizontal Scaling (Medium-term)
1. Add more Node.js instances (auto-scaling)
2. Add MySQL read replicas
3. Implement database sharding by user ID

### Database Sharding (Long-term)
```
Shard 1: Users 1-25K (DB1)
Shard 2: Users 25K-50K (DB2)
Shard 3: Users 50K-75K (DB3)
Shard 4: Users 75K-100K (DB4)
```

## Cost Estimation

| Component | Monthly Cost | Notes |
|-----------|--------------|-------|
| Compute (4-6 instances) | $200-300 | Auto-scaling |
| Database (8vCPU, 32GB) | $300-400 | With replicas |
| Redis (4GB cluster) | $100-150 | High availability |
| Storage (100GB) | $50-100 | S3/Cloud Storage |
| CDN | $50-100 | Static assets |
| Monitoring | $100-150 | Prometheus, Grafana |
| Backup & DR | $50-100 | Cross-region replication |
| **Total** | **$850-1,200** | For 100K users |

## Monitoring Dashboards

### Key Metrics to Monitor
1. **Application**
   - Request rate (req/s)
   - Response time (p50, p95, p99)
   - Error rate (%)
   - Active users

2. **Database**
   - Query latency
   - Connection pool usage
   - Replication lag
   - Slow query log

3. **Cache**
   - Hit rate (%)
   - Eviction rate
   - Memory usage
   - Connection count

4. **Infrastructure**
   - CPU utilization
   - Memory usage
   - Disk I/O
   - Network throughput

## Disaster Recovery

### Backup Strategy
- **Frequency**: Every 6 hours
- **Retention**: 30 days
- **Location**: Multi-region
- **Testing**: Monthly restore drills

### Failover Procedure
1. Automatic failover to read replica (< 1 min)
2. DNS update to new primary (< 5 min)
3. Alert team for investigation
4. Manual intervention if needed

### RTO/RPO Targets
- **RTO** (Recovery Time Objective): < 5 minutes
- **RPO** (Recovery Point Objective): < 30 minutes

## Security Checklist

- [ ] Enable SSL/TLS for all connections
- [ ] Set up firewall rules
- [ ] Enable database encryption at rest
- [ ] Rotate secrets regularly
- [ ] Enable audit logging
- [ ] Set up DDoS protection
- [ ] Implement rate limiting
- [ ] Enable WAF (Web Application Firewall)
- [ ] Regular security audits
- [ ] Penetration testing

## Post-Deployment Validation

1. **Functional Testing**
   - User registration and login
   - Restaurant browsing and ordering
   - Payment processing
   - Order tracking

2. **Performance Testing**
   - Load test with 1000+ concurrent users
   - Verify p95 response time < 500ms
   - Verify cache hit rate > 60%
   - Verify error rate < 0.1%

3. **Reliability Testing**
   - Simulate database failure
   - Simulate cache failure
   - Simulate network partition
   - Verify graceful degradation

## Maintenance Schedule

- **Daily**: Monitor metrics, check error logs
- **Weekly**: Review performance trends, optimize slow queries
- **Monthly**: Security audit, backup restore test
- **Quarterly**: Capacity planning, infrastructure review
- **Annually**: Disaster recovery drill, security assessment
