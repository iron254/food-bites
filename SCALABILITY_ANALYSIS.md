# Food Bites Scalability Analysis & Optimization Plan

## Current Architecture Assessment

### Estimated Load for 100,000 Monthly Users

**User Distribution**:
- 100,000 monthly active users
- ~3,300 daily active users (assuming 3.3% daily activity)
- ~140 concurrent users during peak hours (assuming 1 hour peak window)
- ~10-15 requests per user per session

**Expected Metrics**:
- ~1,400-2,100 requests per peak hour
- ~23-35 requests per second at peak
- Database: ~500-1,000 queries per second at peak
- Storage: ~50-100 GB annually (orders, receipts, logs)

### Current Bottlenecks

| Component | Current State | Bottleneck | Impact |
|-----------|---------------|-----------|--------|
| **Database** | Single MySQL instance, no indexes on foreign keys | N+1 queries, slow joins | High latency on restaurant/menu queries |
| **API Layer** | No caching, all requests hit database | Repeated queries for same data | 50-70% of requests are duplicates |
| **Sessions** | In-memory storage (default Node.js) | Session loss on restart, not scalable | User experience degradation |
| **Frontend** | Single bundle, no code splitting | Large initial load | 3-5s load time on slow networks |
| **Rate Limiting** | None implemented | Potential abuse, resource exhaustion | Vulnerable to DDoS |
| **Monitoring** | Basic logging only | No visibility into performance | Difficult to diagnose issues |

---

## Optimization Strategy

### Phase 1: Database Optimization (Critical)

**Add Indexes**:
```sql
-- Foreign key indexes for joins
CREATE INDEX idx_orders_userId ON orders(userId);
CREATE INDEX idx_orders_restaurantId ON orders(restaurantId);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_createdAt ON orders(createdAt);
CREATE INDEX idx_orderItems_orderId ON order_items(orderId);
CREATE INDEX idx_orderItems_menuItemId ON order_items(menuItemId);
CREATE INDEX idx_menuItems_restaurantId ON menu_items(restaurantId);
CREATE INDEX idx_menuCategories_restaurantId ON menu_categories(restaurantId);
CREATE INDEX idx_bookmarks_userId ON bookmarks(userId);
CREATE INDEX idx_bookmarks_restaurantId ON bookmarks(restaurantId);
CREATE INDEX idx_smsLogs_orderId ON sms_logs(orderId);
CREATE INDEX idx_restaurants_featured ON restaurants(featured);
CREATE INDEX idx_restaurants_isOpen ON restaurants(isOpen);
CREATE INDEX idx_menuItems_isPopular ON menu_items(isPopular);
CREATE INDEX idx_users_openId ON users(openId);

-- Composite indexes for common queries
CREATE INDEX idx_orders_userId_createdAt ON orders(userId, createdAt DESC);
CREATE INDEX idx_orders_restaurantId_status ON orders(restaurantId, status);
CREATE INDEX idx_bookmarks_userId_restaurantId ON bookmarks(userId, restaurantId);
```

**Connection Pooling**:
- Implement connection pool with 20-50 connections
- Reuse connections across requests
- Reduce connection overhead by 80%

**Query Optimization**:
- Replace N+1 queries with batch queries
- Use JOINs instead of separate queries
- Implement query result caching

### Phase 2: Caching Layer (High Impact)

**Redis Integration**:
- Session storage (replaces in-memory)
- API response caching (1-5 minute TTL)
- User data caching (restaurants, menus)
- Rate limiting counters

**Cache Strategy**:
- Cache restaurants list (5 min TTL)
- Cache menu items per restaurant (5 min TTL)
- Cache user bookmarks (10 min TTL)
- Cache order status (2 min TTL)
- Cache financial reports (1 hour TTL)

**Expected Impact**:
- 60-70% reduction in database queries
- 40-50% improvement in response times
- Reduced database load from 1000 QPS to 300-400 QPS

### Phase 3: API Rate Limiting & Throttling

**Rate Limiting Rules**:
- 100 requests per minute per user (authenticated)
- 20 requests per minute per IP (unauthenticated)
- 1000 requests per hour per user (global limit)

**Request Deduplication**:
- Deduplicate identical requests within 1 second
- Cache expensive operations (PDF generation, reports)

### Phase 4: Frontend Optimization

**Code Splitting**:
- Split by route (Home, Restaurants, Orders, Admin, etc.)
- Lazy load admin dashboard
- Lazy load financial reports

**Image Optimization**:
- Use WebP format with JPEG fallback
- Implement responsive images
- Lazy load images below fold
- Use CDN for static assets

**Expected Impact**:
- 50% reduction in initial bundle size
- 2-3s faster page load
- 30% less bandwidth usage

### Phase 5: Monitoring & Observability

**Metrics to Track**:
- Response times (p50, p95, p99)
- Database query times
- Cache hit rates
- Error rates by endpoint
- User session duration
- Concurrent active users

**Logging Strategy**:
- Structured JSON logging
- Separate logs for errors, performance, access
- Log aggregation (ELK stack or similar)

---

## Implementation Roadmap

| Phase | Component | Effort | Impact | Timeline |
|-------|-----------|--------|--------|----------|
| 1 | Database Indexes | 2-3 hours | 40% improvement | Week 1 |
| 1 | Connection Pooling | 1-2 hours | 20% improvement | Week 1 |
| 2 | Redis Setup | 3-4 hours | 60% improvement | Week 2 |
| 2 | Cache Invalidation | 2-3 hours | Critical | Week 2 |
| 3 | Rate Limiting | 2-3 hours | Security | Week 3 |
| 4 | Frontend Optimization | 4-5 hours | UX improvement | Week 3 |
| 5 | Monitoring | 3-4 hours | Visibility | Week 4 |

---

## Estimated Capacity After Optimization

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Concurrent Users | 50 | 500+ | 10x |
| Requests/Second | 35 | 200+ | 5.7x |
| Database QPS | 1000 | 300-400 | 60-70% reduction |
| Response Time (p95) | 800ms | 200ms | 75% faster |
| Monthly Users Supported | 10,000 | 100,000+ | 10x |

---

## Deployment Considerations

### Infrastructure Requirements

**Current**: Single Node.js instance on Cloud Run
**Recommended**: 
- Load balancer (distribute traffic)
- 2-3 Node.js instances (auto-scaling)
- Redis cluster (high availability)
- MySQL read replicas (read scaling)
- CDN for static assets

### Database Scaling

**Vertical Scaling** (Short term):
- Increase instance size
- Upgrade to higher tier MySQL

**Horizontal Scaling** (Long term):
- Read replicas for reporting queries
- Database sharding by user ID
- Archive old orders to separate storage

### Cost Estimation

| Component | Monthly Cost | Notes |
|-----------|--------------|-------|
| Node.js Instances (3x) | $150-200 | Auto-scaling |
| Redis (2GB) | $50-100 | High availability |
| MySQL Upgrade | $100-150 | Larger instance |
| CDN | $20-50 | Static assets |
| Monitoring | $50-100 | Logs & metrics |
| **Total** | **$370-600** | For 100K users |

---

## Success Metrics

- ✅ Support 100,000 monthly active users
- ✅ Maintain p95 response time < 500ms
- ✅ Achieve 99.9% uptime
- ✅ Reduce database load by 60%+
- ✅ Implement comprehensive monitoring
- ✅ Zero data loss
- ✅ Graceful degradation under load

---

## Next Steps

1. **Week 1**: Implement database indexes and connection pooling
2. **Week 2**: Set up Redis and implement caching layer
3. **Week 3**: Add rate limiting and frontend optimization
4. **Week 4**: Deploy monitoring and conduct load testing
5. **Week 5**: Performance tuning and optimization
