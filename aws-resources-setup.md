# AWS Resources Setup pentru Data Flow Studio

Acest document conține toate resursele AWS necesare pentru Data Flow Studio cu Apache Airflow.

## 1. DynamoDB Tables

### DataFlow Pipelines Table
```bash
# Creează tabela pentru Data Flow pipelines
aws dynamodb create-table \
  --table-name dataflow_pipelines \
  --attribute-definitions \
    AttributeName=pipeline_id,AttributeType=S \
    AttributeName=user_id,AttributeType=S \
    AttributeName=created_at,AttributeType=S \
  --key-schema \
    AttributeName=pipeline_id,KeyType=HASH \
    AttributeName=user_id,KeyType=RANGE \
  --global-secondary-indexes \
    IndexName=UserPipelinesIndex,KeySchema='[{AttributeName=user_id,KeyType=HASH},{AttributeName=created_at,KeyType=RANGE}]',Projection='{ProjectionType=ALL}',ProvisionedThroughput='{ReadCapacityUnits=5,WriteCapacityUnits=5}' \
  --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=10 \
  --region us-east-1
```

### DataFlow Executions Table
```bash
# Creează tabela pentru execuții
aws dynamodb create-table \
  --table-name dataflow_executions \
  --attribute-definitions \
    AttributeName=execution_id,AttributeType=S \
    AttributeName=pipeline_id,AttributeType=S \
    AttributeName=started_at,AttributeType=S \
  --key-schema \
    AttributeName=execution_id,KeyType=HASH \
  --global-secondary-indexes \
    IndexName=PipelineExecutionsIndex,KeySchema='[{AttributeName=pipeline_id,KeyType=HASH},{AttributeName=started_at,KeyType=RANGE}]',Projection='{ProjectionType=ALL}',ProvisionedThroughput='{ReadCapacityUnits=5,WriteCapacityUnits=5}' \
  --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=10 \
  --region us-east-1
```

## 2. S3 Buckets

### Airflow DAGs Bucket (pentru AWS MWAA)
```bash
# Creează bucket pentru DAG-urile Airflow
aws s3 mb s3://scraperlayer-airflow-dags --region us-east-1

# Setează versioning
aws s3api put-bucket-versioning \
  --bucket scraperlayer-airflow-dags \
  --versioning-configuration Status=Enabled

# Creează structura de foldere
aws s3api put-object --bucket scraperlayer-airflow-dags --key dags/ --content-length 0
aws s3api put-object --bucket scraperlayer-airflow-dags --key plugins/ --content-length 0
aws s3api put-object --bucket scraperlayer-airflow-dags --key requirements.txt --body requirements.txt
```

### DataFlow Results Bucket
```bash
# Creează bucket pentru rezultatele pipeline-urilor
aws s3 mb s3://scraperlayer-dataflow-results --region us-east-1

# Setează lifecycle policy pentru cleanup automat
aws s3api put-bucket-lifecycle-configuration \
  --bucket scraperlayer-dataflow-results \
  --lifecycle-configuration file://s3-lifecycle-policy.json
```

## 3. AWS Managed Workflows for Apache Airflow (MWAA)

### Creează MWAA Environment
```bash
# Creează IAM role pentru MWAA
aws iam create-role \
  --role-name MWAAExecutionRole \
  --assume-role-policy-document file://mwaa-trust-policy.json

# Atașează politici necesare
aws iam attach-role-policy \
  --role-name MWAAExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonMWAAFullConsoleAccess

aws iam attach-role-policy \
  --role-name MWAAExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

aws iam attach-role-policy \
  --role-name MWAAExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess

# Creează MWAA environment
aws mwaa create-environment \
  --name scraperlayer-dataflow \
  --dag-s3-path dags \
  --source-bucket-arn arn:aws:s3:::scraperlayer-airflow-dags \
  --execution-role-arn arn:aws:iam::ACCOUNT-ID:role/MWAAExecutionRole \
  --network-configuration SubnetIds=subnet-xxx,subnet-yyy,SecurityGroupIds=sg-xxx \
  --webserver-access-mode PUBLIC_ONLY \
  --environment-class mw1.small \
  --max-workers 5 \
  --min-workers 1 \
  --region us-east-1
```

## 4. SQS Queues pentru integrarea cu Go scraper

### DataFlow Jobs Queue
```bash
# Creează coada pentru job-urile DataFlow
aws sqs create-queue \
  --queue-name dataflow-jobs \
  --attributes file://sqs-attributes.json \
  --region us-east-1

# Creează DLQ pentru failed jobs
aws sqs create-queue \
  --queue-name dataflow-jobs-dlq \
  --region us-east-1
```

## 5. IAM Policies și Roles

### DataFlow Service Role
```bash
# Creează role pentru serviciul DataFlow
aws iam create-role \
  --role-name DataFlowServiceRole \
  --assume-role-policy-document file://dataflow-trust-policy.json

# Creează custom policy
aws iam create-policy \
  --policy-name DataFlowServicePolicy \
  --policy-document file://dataflow-service-policy.json

# Atașează policy la role
aws iam attach-role-policy \
  --role-name DataFlowServiceRole \
  --policy-arn arn:aws:iam::ACCOUNT-ID:policy/DataFlowServicePolicy
```

## 6. CloudWatch pentru Monitoring

### Log Groups
```bash
# Creează log group pentru DataFlow
aws logs create-log-group \
  --log-group-name /aws/lambda/dataflow-service \
  --region us-east-1

# Creează log group pentru Airflow
aws logs create-log-group \
  --log-group-name /aws/mwaa/scraperlayer-dataflow \
  --region us-east-1
```

### CloudWatch Alarms
```bash
# Alarm pentru failed pipeline executions
aws cloudwatch put-metric-alarm \
  --alarm-name "DataFlow-FailedExecutions" \
  --alarm-description "Alert when DataFlow pipeline executions fail" \
  --metric-name "FailedExecutions" \
  --namespace "DataFlow/Pipelines" \
  --statistic "Sum" \
  --period 300 \
  --threshold 1 \
  --comparison-operator "GreaterThanOrEqualToThreshold" \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT-ID:dataflow-alerts
```

## 7. Environment Variables necesare

Adaugă în `.env`:

```bash
# Airflow Configuration
AIRFLOW_BASE_URL=https://your-mwaa-environment.airflow.us-east-1.amazonaws.com
AIRFLOW_USERNAME=admin
AIRFLOW_PASSWORD=your-secure-password

# AWS MWAA S3 Bucket
AIRFLOW_S3_BUCKET=scraperlayer-airflow-dags
AIRFLOW_DAGS_DIR=dags/

# DynamoDB Tables
DYNAMODB_DATAFLOW_PIPELINES_TABLE=dataflow_pipelines
DYNAMODB_DATAFLOW_EXECUTIONS_TABLE=dataflow_executions

# S3 Buckets
DATAFLOW_RESULTS_BUCKET=scraperlayer-dataflow-results

# SQS Queues
DATAFLOW_JOBS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/ACCOUNT-ID/dataflow-jobs

# Internal API Key pentru comunicarea între servicii
INTERNAL_API_KEY=your-internal-secure-key

# Google Maps API pentru enrichment
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

## 8. Comenzi pentru setup rapid

### Script complet de setup
```bash
#!/bin/bash

# Setează variabilele
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=us-east-1

echo "Setting up DataFlow Studio AWS resources..."

# 1. Creează DynamoDB tables
echo "Creating DynamoDB tables..."
aws dynamodb create-table \
  --table-name dataflow_pipelines \
  --attribute-definitions \
    AttributeName=pipeline_id,AttributeType=S \
    AttributeName=user_id,AttributeType=S \
    AttributeName=created_at,AttributeType=S \
  --key-schema \
    AttributeName=pipeline_id,KeyType=HASH \
    AttributeName=user_id,KeyType=RANGE \
  --global-secondary-indexes \
    IndexName=UserPipelinesIndex,KeySchema='[{AttributeName=user_id,KeyType=HASH},{AttributeName=created_at,KeyType=RANGE}]',Projection='{ProjectionType=ALL}',ProvisionedThroughput='{ReadCapacityUnits=5,WriteCapacityUnits=5}' \
  --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=10 \
  --region $REGION

# 2. Creează S3 buckets
echo "Creating S3 buckets..."
aws s3 mb s3://scraperlayer-airflow-dags-$ACCOUNT_ID --region $REGION
aws s3 mb s3://scraperlayer-dataflow-results-$ACCOUNT_ID --region $REGION

# 3. Creează SQS queues
echo "Creating SQS queues..."
aws sqs create-queue --queue-name dataflow-jobs --region $REGION
aws sqs create-queue --queue-name dataflow-jobs-dlq --region $REGION

echo "Setup complete! Update your .env file with the created resource names."
```

## 9. Testing și Validation

### Test DynamoDB Connection
```bash
# Test write
aws dynamodb put-item \
  --table-name dataflow_pipelines \
  --item file://test-pipeline.json

# Test read
aws dynamodb get-item \
  --table-name dataflow_pipelines \
  --key '{"pipeline_id":{"S":"test-123"},"user_id":{"S":"test-user"}}'
```

### Test S3 Upload
```bash
# Test DAG upload
echo "print('Hello Airflow')" > test_dag.py
aws s3 cp test_dag.py s3://scraperlayer-airflow-dags/dags/
```

### Test SQS
```bash
# Send test message
aws sqs send-message \
  --queue-url https://sqs.us-east-1.amazonaws.com/$ACCOUNT_ID/dataflow-jobs \
  --message-body '{"test": "message"}'

# Receive message
aws sqs receive-message \
  --queue-url https://sqs.us-east-1.amazonaws.com/$ACCOUNT_ID/dataflow-jobs
```
