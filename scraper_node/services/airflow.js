const axios = require('axios');
const logger = require('../config/logger');

const AIRFLOW_BASE_URL = process.env.AIRFLOW_BASE_URL || 'http://localhost:8080';
const AIRFLOW_USERNAME = process.env.AIRFLOW_USERNAME || 'admin';
const AIRFLOW_PASSWORD = process.env.AIRFLOW_PASSWORD || 'admin';

// Create axios instance for Airflow API
const airflowApi = axios.create({
  baseURL: `${AIRFLOW_BASE_URL}/api/v1`,
  auth: {
    username: AIRFLOW_USERNAME,
    password: AIRFLOW_PASSWORD
  },
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Creates a dynamic DAG for a Data Flow pipeline
 */
const createDataFlowDAG = async (pipelineData) => {
  try {
    const dagId = `dataflow_${pipelineData.id}`;
    
    // Generate DAG configuration based on pipeline template and steps
    const dagConfig = generateDAGConfig(pipelineData);
    
    // Create DAG file content
    const dagContent = generateDAGContent(dagId, dagConfig);
    
    // Upload DAG to Airflow (this would typically be done via file upload or S3)
    await uploadDAGToAirflow(dagId, dagContent);
    
    logger.info('Data Flow DAG created successfully', { 
      pipelineId: pipelineData.id, 
      dagId 
    });
    
    return {
      success: true,
      dagId,
      message: 'DAG created successfully'
    };
    
  } catch (error) {
    logger.error('Failed to create Data Flow DAG', { 
      error: error.message, 
      pipelineId: pipelineData.id 
    });
    throw error;
  }
};

/**
 * Triggers a DAG run for a Data Flow pipeline
 */
const triggerDataFlowExecution = async (pipelineId, executionConfig = {}) => {
  try {
    const dagId = `dataflow_${pipelineId}`;
    const dagRunId = `manual_${Date.now()}`;
    
    const response = await airflowApi.post(`/dags/${dagId}/dagRuns`, {
      dag_run_id: dagRunId,
      conf: {
        pipeline_id: pipelineId,
        execution_config: executionConfig,
        created_by: 'dataflow_studio'
      }
    });
    
    logger.info('Data Flow DAG triggered successfully', { 
      pipelineId, 
      dagId, 
      dagRunId 
    });
    
    return {
      success: true,
      dagRunId,
      executionId: dagRunId,
      status: 'queued'
    };
    
  } catch (error) {
    logger.error('Failed to trigger Data Flow DAG', { 
      error: error.message, 
      pipelineId 
    });
    throw error;
  }
};

/**
 * Gets the status of a DAG run
 */
const getDAGRunStatus = async (pipelineId, dagRunId) => {
  try {
    const dagId = `dataflow_${pipelineId}`;
    
    const response = await airflowApi.get(`/dags/${dagId}/dagRuns/${dagRunId}`);
    const dagRun = response.data;
    
    // Get task instances for detailed status
    const tasksResponse = await airflowApi.get(`/dags/${dagId}/dagRuns/${dagRunId}/taskInstances`);
    const tasks = tasksResponse.data.task_instances;
    
    return {
      success: true,
      execution: {
        id: dagRunId,
        status: dagRun.state,
        startDate: dagRun.start_date,
        endDate: dagRun.end_date,
        tasks: tasks.map(task => ({
          taskId: task.task_id,
          status: task.state,
          startDate: task.start_date,
          endDate: task.end_date,
          duration: task.duration
        }))
      }
    };
    
  } catch (error) {
    logger.error('Failed to get DAG run status', { 
      error: error.message, 
      pipelineId, 
      dagRunId 
    });
    throw error;
  }
};

/**
 * Pauses or unpauses a DAG
 */
const toggleDAG = async (pipelineId, isPaused) => {
  try {
    const dagId = `dataflow_${pipelineId}`;
    
    await airflowApi.patch(`/dags/${dagId}`, {
      is_paused: isPaused
    });
    
    logger.info('DAG toggled successfully', { pipelineId, dagId, isPaused });
    
    return {
      success: true,
      message: `DAG ${isPaused ? 'paused' : 'unpaused'} successfully`
    };
    
  } catch (error) {
    logger.error('Failed to toggle DAG', { 
      error: error.message, 
      pipelineId, 
      isPaused 
    });
    throw error;
  }
};

/**
 * Deletes a DAG
 */
const deleteDAG = async (pipelineId) => {
  try {
    const dagId = `dataflow_${pipelineId}`;
    
    await airflowApi.delete(`/dags/${dagId}`);
    
    logger.info('DAG deleted successfully', { pipelineId, dagId });
    
    return {
      success: true,
      message: 'DAG deleted successfully'
    };
    
  } catch (error) {
    logger.error('Failed to delete DAG', { 
      error: error.message, 
      pipelineId 
    });
    throw error;
  }
};

/**
 * Generates DAG configuration based on pipeline data
 */
const generateDAGConfig = (pipelineData) => {
  const config = {
    dag_id: `dataflow_${pipelineData.id}`,
    description: `Data Flow Pipeline: ${pipelineData.name}`,
    schedule_interval: null, // Manual trigger only
    start_date: new Date().toISOString(),
    catchup: false,
    max_active_runs: 1,
    pipeline: {
      id: pipelineData.id,
      name: pipelineData.name,
      template: pipelineData.template,
      startUrl: pipelineData.startUrl,
      config: pipelineData.config,
      steps: pipelineData.steps
    }
  };
  
  return config;
};

/**
 * Generates the actual DAG Python code
 */
const generateDAGContent = (dagId, config) => {
  return `
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python_operator import PythonOperator
from airflow.operators.dummy_operator import DummyOperator
from airflow.providers.http.operators.http import SimpleHttpOperator
import json

# DAG configuration
default_args = {
    'owner': 'dataflow_studio',
    'depends_on_past': False,
    'start_date': datetime.fromisoformat('${config.start_date.replace('Z', '+00:00')}'),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5)
}

# Pipeline configuration
PIPELINE_CONFIG = ${JSON.stringify(config.pipeline, null, 4)}

dag = DAG(
    '${dagId}',
    default_args=default_args,
    description='${config.description}',
    schedule_interval=${config.schedule_interval ? `'${config.schedule_interval}'` : 'None'},
    catchup=${config.catchup},
    max_active_runs=${config.max_active_runs},
    tags=['dataflow', 'scraping', '${config.pipeline.template}']
)

def execute_scraping_step(**context):
    """Execute a scraping step using the Go scraper service"""
    import requests
    
    step_config = context['params']
    pipeline_id = PIPELINE_CONFIG['id']
    
    # Prepare scraping job data
    job_data = {
        'url': step_config.get('url', PIPELINE_CONFIG['startUrl']),
        'options': {
            'schema': step_config.get('schema', {}),
            'enableJS': step_config.get('config', {}).get('enableJS', True),
            'timeout': 30,
            'userAgent': 'DataFlow-Studio/1.0'
        },
        'callbackUrl': f"${process.env.API_BASE_URL || 'http://localhost:3000'}/api/v1/dataflow/pipelines/{pipeline_id}/steps/{step_config['id']}/callback"
    }
    
    # Send job to scraper service
    response = requests.post(
        '${process.env.API_BASE_URL || 'http://localhost:3000'}/api/v1/jobs',
        json=job_data,
        headers={
            'X-API-Key': '${process.env.INTERNAL_API_KEY || 'internal-key'}',
            'Content-Type': 'application/json'
        }
    )
    
    if response.status_code != 201:
        raise Exception(f"Failed to create scraping job: {response.text}")
    
    job_result = response.json()
    return {
        'job_id': job_result['data']['jobId'],
        'step_id': step_config['id'],
        'status': 'queued'
    }

def process_enrichment_step(**context):
    """Process data enrichment step"""
    import requests
    
    step_config = context['params']
    pipeline_id = PIPELINE_CONFIG['id']
    
    # Get previous step results
    previous_step_data = context['task_instance'].xcom_pull(task_ids=step_config.get('depends_on'))
    
    # Process enrichment based on step configuration
    enrichment_config = step_config.get('config', {})
    
    if enrichment_config.get('enableGeocode'):
        # Call geocoding service
        geocode_response = requests.post(
            f"${process.env.API_BASE_URL || 'http://localhost:3000'}/api/v1/dataflow/pipelines/{pipeline_id}/enrich/geocode",
            json={'data': previous_step_data, 'config': enrichment_config}
        )
        
        if geocode_response.status_code == 200:
            return geocode_response.json()
    
    return {'status': 'completed', 'data': previous_step_data}

# Create start task
start_task = DummyOperator(
    task_id='start',
    dag=dag
)

# Create end task
end_task = DummyOperator(
    task_id='end',
    dag=dag
)

# Generate tasks for each pipeline step
previous_task = start_task
task_map = {}

for step in PIPELINE_CONFIG['steps']:
    step_id = step['id']
    step_type = step['type']
    
    if step_type in ['search', 'list', 'detail']:
        # Scraping tasks
        task = PythonOperator(
            task_id=step_id,
            python_callable=execute_scraping_step,
            params=step,
            dag=dag
        )
    elif step_type == 'enrich':
        # Enrichment tasks
        task = PythonOperator(
            task_id=step_id,
            python_callable=process_enrichment_step,
            params=step,
            dag=dag
        )
    else:
        # Default dummy task
        task = DummyOperator(
            task_id=step_id,
            dag=dag
        )
    
    task_map[step_id] = task
    
    # Set up dependencies
    if step.get('parentStepId') and step['parentStepId'] in task_map:
        task_map[step['parentStepId']] >> task
    else:
        previous_task >> task
    
    previous_task = task

# Connect last task to end
previous_task >> end_task

# Set up parallel execution for independent steps
${generateParallelExecution(config.pipeline.steps)}
`;
};

/**
 * Generates parallel execution configuration for independent steps
 */
const generateParallelExecution = (steps) => {
  const parallelGroups = [];
  const processedSteps = new Set();
  
  steps.forEach(step => {
    if (!processedSteps.has(step.id) && !step.parentStepId) {
      // Find all steps that can run in parallel with this one
      const parallelSteps = steps.filter(s => 
        !s.parentStepId && s.position === step.position && !processedSteps.has(s.id)
      );
      
      if (parallelSteps.length > 1) {
        parallelGroups.push(parallelSteps.map(s => s.id));
        parallelSteps.forEach(s => processedSteps.add(s.id));
      }
    }
  });
  
  return parallelGroups.map(group => 
    `# Parallel execution for steps: ${group.join(', ')}`
  ).join('\n');
};

/**
 * Uploads DAG content to Airflow
 * In a real implementation, this would upload to S3 or the Airflow DAGs folder
 */
const uploadDAGToAirflow = async (dagId, dagContent) => {
  try {
    // For AWS Managed Airflow (MWAA), we would upload to S3
    // For self-hosted Airflow, we would write to the DAGs folder
    
    if (process.env.AIRFLOW_S3_BUCKET) {
      // Upload to S3 for MWAA
      const AWS = require('aws-sdk');
      const s3 = new AWS.S3();
      
      await s3.putObject({
        Bucket: process.env.AIRFLOW_S3_BUCKET,
        Key: `dags/${dagId}.py`,
        Body: dagContent,
        ContentType: 'text/plain'
      }).promise();
      
      logger.info('DAG uploaded to S3', { dagId });
    } else {
      // For development - write to local file system
      const fs = require('fs').promises;
      const path = require('path');
      
      const dagsDir = process.env.AIRFLOW_DAGS_DIR || '/tmp/airflow/dags';
      await fs.mkdir(dagsDir, { recursive: true });
      await fs.writeFile(path.join(dagsDir, `${dagId}.py`), dagContent);
      
      logger.info('DAG written to local filesystem', { dagId });
    }
    
    return { success: true };
    
  } catch (error) {
    logger.error('Failed to upload DAG', { error: error.message, dagId });
    throw error;
  }
};

/**
 * Gets DAG logs for debugging
 */
const getDAGLogs = async (pipelineId, dagRunId, taskId) => {
  try {
    const dagId = `dataflow_${pipelineId}`;
    
    const response = await airflowApi.get(
      `/dags/${dagId}/dagRuns/${dagRunId}/taskInstances/${taskId}/logs/1`
    );
    
    return {
      success: true,
      logs: response.data
    };
    
  } catch (error) {
    logger.error('Failed to get DAG logs', { 
      error: error.message, 
      pipelineId, 
      dagRunId, 
      taskId 
    });
    throw error;
  }
};

module.exports = {
  createDataFlowDAG,
  triggerDataFlowExecution,
  getDAGRunStatus,
  toggleDAG,
  deleteDAG,
  getDAGLogs
};
