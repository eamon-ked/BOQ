# BOQ Builder - Deployment Checklist

## Pre-Deployment Verification

### Code Quality
- [ ] All tests pass (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Code coverage meets minimum threshold (80%+)
- [ ] No TypeScript/JavaScript errors
- [ ] All console.log statements removed from production code
- [ ] No TODO/FIXME comments in critical paths

### Security
- [ ] All user inputs are validated and sanitized
- [ ] SQL injection prevention measures in place
- [ ] XSS protection implemented
- [ ] CSRF protection enabled
- [ ] Secure headers configured
- [ ] No sensitive data in client-side code
- [ ] Environment variables properly configured
- [ ] Database credentials secured

### Performance
- [ ] Bundle size optimized (< 500KB gzipped)
- [ ] Images optimized and compressed
- [ ] Database queries optimized with proper indexes
- [ ] Lazy loading implemented for large components
- [ ] Virtual scrolling enabled for large lists
- [ ] Caching strategies implemented
- [ ] Memory leaks checked and resolved

### Functionality
- [ ] All major user workflows tested
- [ ] Error handling works correctly
- [ ] Loading states display properly
- [ ] Form validation functions as expected
- [ ] Export functionality works for all formats
- [ ] Bulk operations perform correctly
- [ ] Search and filtering work with large datasets
- [ ] Project management features functional

### Browser Compatibility
- [ ] Chrome (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Edge (latest 2 versions)
- [ ] Mobile browsers tested

### Accessibility
- [ ] WCAG 2.1 AA compliance verified
- [ ] Screen reader compatibility tested
- [ ] Keyboard navigation works throughout app
- [ ] Color contrast ratios meet standards
- [ ] Alt text provided for images
- [ ] ARIA labels implemented where needed

## Production Environment Setup

### Server Configuration
- [ ] Node.js version matches development (v18+)
- [ ] PM2 or similar process manager configured
- [ ] HTTPS/SSL certificates installed
- [ ] Reverse proxy configured (nginx/Apache)
- [ ] Firewall rules configured
- [ ] Log rotation configured
- [ ] Monitoring tools installed

### Database
- [ ] Production database created
- [ ] Database migrations run
- [ ] Database indexes created
- [ ] Backup strategy implemented
- [ ] Connection pooling configured
- [ ] Database user permissions set correctly

### Environment Variables
- [ ] `NODE_ENV=production`
- [ ] Database connection strings
- [ ] API keys and secrets
- [ ] CORS origins configured
- [ ] Session secrets set
- [ ] File upload paths configured

### Build Process
- [ ] Production build created (`npm run build`)
- [ ] Static assets served correctly
- [ ] Source maps excluded from production
- [ ] Bundle analysis completed
- [ ] CDN configured for static assets (if applicable)

## Deployment Steps

### 1. Pre-deployment
```bash
# Run full test suite
npm test

# Build production bundle
npm run build

# Analyze bundle size
npm run analyze

# Run security audit
npm audit

# Check for outdated dependencies
npm outdated
```

### 2. Database Migration
```bash
# Backup current database
sqlite3 production.db ".backup backup_$(date +%Y%m%d_%H%M%S).db"

# Run migrations
npm run migrate
```

### 3. Application Deployment
```bash
# Stop current application
pm2 stop boq-builder

# Deploy new code
git pull origin main
npm ci --production

# Start application
pm2 start ecosystem.config.js
pm2 save
```

### 4. Post-deployment Verification
- [ ] Application starts without errors
- [ ] Health check endpoint responds
- [ ] Database connections work
- [ ] File uploads function
- [ ] Email notifications work (if applicable)
- [ ] External API integrations work
- [ ] SSL certificate valid
- [ ] Performance metrics within acceptable range

## Rollback Plan

### Quick Rollback
```bash
# Stop current version
pm2 stop boq-builder

# Revert to previous version
git checkout previous-stable-tag
npm ci --production

# Restore database if needed
sqlite3 production.db ".restore backup_YYYYMMDD_HHMMSS.db"

# Start application
pm2 start ecosystem.config.js
```

### Rollback Triggers
- [ ] Application won't start
- [ ] Critical functionality broken
- [ ] Performance degradation > 50%
- [ ] Security vulnerability discovered
- [ ] Data corruption detected

## Monitoring and Alerts

### Application Monitoring
- [ ] Error tracking (Sentry/similar)
- [ ] Performance monitoring (APM)
- [ ] Uptime monitoring
- [ ] Log aggregation
- [ ] Resource usage monitoring

### Key Metrics to Monitor
- [ ] Response time < 200ms for API calls
- [ ] Error rate < 1%
- [ ] Memory usage < 512MB
- [ ] CPU usage < 70%
- [ ] Disk usage < 80%
- [ ] Database query time < 100ms

### Alert Thresholds
- [ ] Application down > 1 minute
- [ ] Error rate > 5%
- [ ] Response time > 1 second
- [ ] Memory usage > 80%
- [ ] Disk usage > 90%

## Post-Deployment Tasks

### Immediate (0-2 hours)
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify critical user workflows
- [ ] Monitor resource usage
- [ ] Check backup systems

### Short-term (2-24 hours)
- [ ] Review user feedback
- [ ] Monitor performance trends
- [ ] Check for memory leaks
- [ ] Verify scheduled tasks
- [ ] Update documentation

### Long-term (1-7 days)
- [ ] Analyze usage patterns
- [ ] Review performance improvements
- [ ] Plan next iteration
- [ ] Update monitoring thresholds
- [ ] Document lessons learned

## Emergency Contacts

### Technical Team
- Lead Developer: [Contact Info]
- DevOps Engineer: [Contact Info]
- Database Administrator: [Contact Info]

### Business Team
- Product Owner: [Contact Info]
- Project Manager: [Contact Info]

## Documentation Updates

- [ ] API documentation updated
- [ ] User manual updated
- [ ] Admin guide updated
- [ ] Troubleshooting guide updated
- [ ] Change log updated
- [ ] Version tags created

## Sign-off

- [ ] Technical Lead Approval: _________________ Date: _______
- [ ] QA Approval: _________________ Date: _______
- [ ] Product Owner Approval: _________________ Date: _______
- [ ] DevOps Approval: _________________ Date: _______

---

**Deployment Date:** _________________
**Deployed By:** _________________
**Version:** _________________
**Git Commit:** _________________