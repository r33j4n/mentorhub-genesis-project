# BigQuery Wrapper Setup for Advanced Recommendations

## 🚀 Overview

This guide will help you set up BigQuery Wrapper integration for advanced ML-powered mentor recommendations.

## 📋 Prerequisites

1. **Google Cloud Project** with BigQuery enabled
2. **BigQuery Dataset** for storing recommendation data
3. **Service Account** with BigQuery access
4. **Supabase Project** with BigQuery Wrapper extension

## 🔧 Step-by-Step Setup

### 1. Create Google Cloud Project

```bash
# Install Google Cloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Initialize and create project
gcloud init
gcloud projects create mentorhub-analytics --name="MentorHub Analytics"
gcloud config set project mentorhub-analytics
```

### 2. Enable BigQuery API

```bash
# Enable BigQuery API
gcloud services enable bigquery.googleapis.com
```

### 3. Create BigQuery Dataset

```bash
# Create dataset
bq mk --dataset mentorhub-analytics:mentor_recommendations

# Create tables
bq mk --table mentorhub-analytics:mentor_recommendations.user_profiles \
  user_id:STRING,skills:STRING,experience_level:STRING,goals:STRING,\
  session_history:JSON,preferences:JSON,created_at:TIMESTAMP,updated_at:TIMESTAMP

bq mk --table mentorhub-analytics:mentor_recommendations.mentor_profiles \
  mentor_id:STRING,expertise_areas:STRING,session_success_rate:FLOAT64,\
  mentee_satisfaction:FLOAT64,response_time_minutes:INT64,availability_score:FLOAT64,\
  created_at:TIMESTAMP,updated_at:TIMESTAMP

bq mk --table mentorhub-analytics:mentor_recommendations.interaction_history \
  interaction_id:STRING,mentee_id:STRING,mentor_id:STRING,session_id:STRING,\
  interaction_type:STRING,success_score:FLOAT64,duration_minutes:INT64,\
  feedback_rating:INT64,created_at:TIMESTAMP
```

### 4. Create Service Account

```bash
# Create service account
gcloud iam service-accounts create bigquery-supabase \
  --display-name="BigQuery Supabase Integration"

# Get service account email
SA_EMAIL=$(gcloud iam service-accounts list --filter="displayName:BigQuery Supabase Integration" --format="value(email)")

# Grant BigQuery permissions
gcloud projects add-iam-policy-binding mentorhub-analytics \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/bigquery.dataEditor"

gcloud projects add-iam-policy-binding mentorhub-analytics \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/bigquery.jobUser"

# Create and download key
gcloud iam service-accounts keys create bigquery-key.json \
  --iam-account=$SA_EMAIL
```

### 5. Configure Supabase BigQuery Wrapper

#### 5.1 Add BigQuery Wrapper Extension

1. Go to your Supabase Dashboard
2. Navigate to **Database** → **Extensions**
3. Search for "BigQuery Wrapper"
4. Click **Enable**

#### 5.2 Store Credentials in Vault

```sql
-- Store BigQuery credentials in Supabase Vault
INSERT INTO vault.secrets (name, secret)
VALUES (
  'bigquery-credentials',
  '{"type": "service_account", "project_id": "mentorhub-analytics", "private_key_id": "...", "private_key": "...", "client_email": "...", "client_id": "...", "auth_uri": "https://accounts.google.com/o/oauth2/auth", "token_uri": "https://oauth2.googleapis.com/token", "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs", "client_x509_cert_url": "..."}'
);
```

#### 5.3 Apply Database Migration

```bash
# Apply the BigQuery setup migration
npx supabase db push
```

### 6. Test the Integration

```sql
-- Test BigQuery connection
SELECT * FROM bigquery_recommendations.user_profiles LIMIT 5;

-- Test sync function
SELECT sync_data_to_bigquery();

-- Test advanced recommendations
SELECT * FROM get_advanced_mentor_recommendations(
  'your-mentee-id'::UUID,
  ARRAY['React', 'TypeScript'],
  'intermediate',
  0,
  200,
  5
);
```

## 🎯 Advanced Features

### 1. ML Model Integration

```sql
-- Create ML model for recommendations
CREATE OR REPLACE MODEL mentorhub-analytics.mentor_recommendations.recommendation_model
OPTIONS(
  model_type='matrix_factorization',
  user_col='mentee_id',
  item_col='mentor_id',
  rating_col='success_score'
) AS
SELECT mentee_id, mentor_id, success_score
FROM bigquery_recommendations.interaction_history
WHERE success_score > 0;
```

### 2. Real-time Analytics

```sql
-- Create real-time dashboard queries
CREATE OR REPLACE VIEW bigquery_recommendations.recommendation_analytics AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_recommendations,
  AVG(similarity_score) as avg_match_score,
  AVG(confidence_score) as avg_confidence
FROM (
  SELECT * FROM get_advanced_mentor_recommendations(
    'test-mentee'::UUID,
    ARRAY['React'],
    'intermediate',
    0,
    200,
    100
  )
) recommendations
GROUP BY DATE(created_at);
```

### 3. A/B Testing Framework

```sql
-- Create A/B testing tables
CREATE TABLE bigquery_recommendations.ab_tests (
  test_id STRING,
  mentee_id STRING,
  variant STRING, -- 'control' or 'treatment'
  recommendation_type STRING,
  similarity_score FLOAT64,
  confidence_score FLOAT64,
  session_booked BOOLEAN,
  session_completed BOOLEAN,
  satisfaction_rating INT64,
  created_at TIMESTAMP
);
```

## 🔍 Monitoring & Analytics

### 1. Recommendation Performance

```sql
-- Monitor recommendation accuracy
SELECT 
  recommendation_type,
  AVG(similarity_score) as avg_match_score,
  AVG(confidence_score) as avg_confidence,
  COUNT(*) as total_recommendations,
  SUM(CASE WHEN session_booked THEN 1 ELSE 0 END) as sessions_booked,
  SUM(CASE WHEN session_completed THEN 1 ELSE 0 END) as sessions_completed
FROM bigquery_recommendations.ab_tests
GROUP BY recommendation_type;
```

### 2. User Engagement Metrics

```sql
-- Track user engagement
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT mentee_id) as active_users,
  AVG(similarity_score) as avg_match_quality,
  SUM(CASE WHEN session_booked THEN 1 ELSE 0 END) as conversions
FROM bigquery_recommendations.ab_tests
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## 🚨 Troubleshooting

### Common Issues

1. **BigQuery Connection Failed**
   - Check service account permissions
   - Verify credentials in Vault
   - Ensure BigQuery API is enabled

2. **Sync Function Errors**
   - Check table schemas match
   - Verify data types are compatible
   - Monitor BigQuery quotas

3. **Performance Issues**
   - Add indexes to frequently queried columns
   - Use partitioning for large tables
   - Implement caching for repeated queries

### Debug Commands

```sql
-- Check BigQuery connection
SELECT * FROM bigquery_recommendations.user_profiles LIMIT 1;

-- Test sync function
SELECT sync_data_to_bigquery();

-- Check for errors
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

## 📈 Scaling Considerations

1. **Data Volume**: BigQuery can handle petabytes of data
2. **Query Performance**: Use clustering and partitioning
3. **Cost Optimization**: Monitor query costs and optimize
4. **Real-time Updates**: Consider streaming inserts for live data

## 🔐 Security Best Practices

1. **Service Account**: Use least privilege principle
2. **Data Encryption**: Enable encryption at rest and in transit
3. **Access Control**: Implement row-level security
4. **Audit Logging**: Monitor all BigQuery access

## 📞 Support

For issues with:
- **BigQuery Setup**: Check Google Cloud documentation
- **Supabase Integration**: Review Supabase BigQuery Wrapper docs
- **Recommendation Algorithm**: Contact the development team

---

**Next Steps:**
1. Complete the setup above
2. Test the integration with sample data
3. Deploy to production
4. Monitor performance and accuracy
5. Iterate and improve the recommendation algorithm 