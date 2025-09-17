const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const dynamoService = require('../services/dynamodb');
const sqsService = require('../services/sqs');
const s3Service = require('../services/s3');
const airflowService = require('../services/airflow');
const { validateApiKey } = require('../utils/auth');

// Middleware pentru autentificare
router.use(validateApiKey);

// Template-uri predefinite pentru Data Flow
const FLOW_TEMPLATES = {
  'real-estate-analysis': {
    id: 'real-estate-analysis',
    name: 'Analiză Imobiliară Completă',
    description: 'Căutare firme → Listare apartamente → Detalii proprietăți → Scoring locație',
    icon: '🏠',
    category: 'Real Estate',
    steps: [
      {
        type: 'search',
        title: 'Căutare Firme Imobiliare',
        icon: '🔍',
        schema: {
          html: { type: 'html', selector: 'html' }
        },
        config: {
          autoDetectPatterns: ['real_estate_companies', 'business_listings'],
          maxResults: 10
        }
      },
      {
        type: 'list',
        title: 'Extragere Lista Apartamente',
        icon: '📋',
        schema: {
          html: { type: 'html', selector: 'html' }
        },
        config: {
          autoDetectPatterns: ['property_listings', 'apartment_cards'],
          maxResults: 50
        }
      },
      {
        type: 'detail',
        title: 'Detalii Proprietăți',
        icon: '🏠',
        schema: {
          title: { type: 'text', selector: 'h1, .title, .titlu' },
          price: { type: 'text', selector: '.price, .pret, [class*="price"]' },
          size: { type: 'text', selector: '.surface, .suprafata, [class*="mp"]' },
          rooms: { type: 'text', selector: '.rooms, .camere, [class*="rooms"]' },
          address: { type: 'text', selector: '.address, .adresa, [class*="address"], [class*="location"]' },
          description: { type: 'text', selector: '.description, .descriere' },
          images: { type: 'list', selector: 'img[src*="jpg"], img[src*="png"]', attr: 'src' }
        },
        config: {
          enableJS: true,
          waitTime: 2000
        }
      },
      {
        type: 'enrich',
        title: 'Scoring & Geo-enrichment',
        icon: '📍',
        config: {
          enableGeocode: true,
          enableTransportScoring: true,
          enableAmenitiesScoring: true,
          googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
        }
      }
    ]
  },
  'ecommerce-monitoring': {
    id: 'ecommerce-monitoring',
    name: 'Monitorizare E-commerce',
    description: 'Scan produse → Istoric prețuri → Analiza competiției → Alerting',
    icon: '🛒',
    category: 'E-commerce',
    steps: [
      {
        type: 'search',
        title: 'Scan Produse',
        icon: '🛒',
        schema: {
          html: { type: 'html', selector: 'html' }
        }
      },
      {
        type: 'list',
        title: 'Extragere Prețuri',
        icon: '💰',
        schema: {
          html: { type: 'html', selector: 'html' }
        }
      },
      {
        type: 'detail',
        title: 'Detalii Produse',
        icon: '📦',
        schema: {
          name: { type: 'text', selector: 'h1, .product-name, .title' },
          price: { type: 'text', selector: '.price, .cost, [class*="price"]' },
          availability: { type: 'text', selector: '.stock, .availability, [class*="stock"]' },
          rating: { type: 'text', selector: '.rating, .score, [class*="rating"]' },
          description: { type: 'text', selector: '.description, .details' }
        }
      },
      {
        type: 'enrich',
        title: 'Analiza Competitivă',
        icon: '📊',
        config: {
          enablePriceComparison: true,
          enableHistoricalData: true
        }
      }
    ]
  },
  'event-aggregation': {
    id: 'event-aggregation',
    name: 'Agregare Evenimente',
    description: 'Căutare evenimente → Detalii → Categorizare → Calendar inteligent',
    icon: '🎉',
    category: 'Events',
    steps: [
      {
        type: 'search',
        title: 'Căutare Evenimente',
        icon: '🔍',
        schema: {
          html: { type: 'html', selector: 'html' }
        }
      },
      {
        type: 'list',
        title: 'Lista Evenimente',
        icon: '📅',
        schema: {
          html: { type: 'html', selector: 'html' }
        }
      },
      {
        type: 'detail',
        title: 'Detalii Evenimente',
        icon: '🎉',
        schema: {
          title: { type: 'text', selector: 'h1, .event-title, .title' },
          date: { type: 'text', selector: '.date, .when, [class*="date"]' },
          location: { type: 'text', selector: '.location, .where, [class*="location"]' },
          price: { type: 'text', selector: '.price, .cost, [class*="price"]' },
          description: { type: 'text', selector: '.description, .details' }
        }
      },
      {
        type: 'enrich',
        title: 'Categorizare & Filtrare',
        icon: '🏷️',
        config: {
          enableCategorization: true,
          enableLocationEnrichment: true
        }
      }
    ]
  }
};

// GET /api/v1/dataflow/templates - Obține template-urile disponibile
router.get('/templates', async (req, res) => {
  try {
    const templates = Object.values(FLOW_TEMPLATES);
    
    res.json({
      success: true,
      data: {
        templates: templates
      }
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch templates'
    });
  }
});

// POST /api/v1/dataflow/pipelines - Creează un nou data flow pipeline
router.post('/pipelines', async (req, res) => {
  try {
    const { name, description, startUrl, template, config, steps } = req.body;
    const userId = req.user.id;

    // Validare input
    if (!name || !startUrl || !template) {
      return res.status(400).json({
        success: false,
        error: 'Name, startUrl, and template are required'
      });
    }

    // Obține template-ul sau folosește steps custom
    let pipelineSteps;
    if (FLOW_TEMPLATES[template]) {
      pipelineSteps = FLOW_TEMPLATES[template].steps.map((step, index) => ({
        id: `${step.type}_${index + 1}`,
        type: step.type,
        title: step.title,
        icon: step.icon,
        status: index === 0 ? 'pending' : 'waiting',
        position: index,
        url: index === 0 ? startUrl : null,
        schema: step.schema || {},
        config: step.config || {},
        results: [],
        nextSteps: [],
        parentStepId: null
      }));
    } else if (steps && Array.isArray(steps)) {
      pipelineSteps = steps.map((step, index) => ({
        id: step.id || `${step.type}_${index + 1}`,
        type: step.type,
        title: step.title,
        icon: step.icon,
        status: index === 0 ? 'pending' : 'waiting',
        position: index,
        url: index === 0 ? startUrl : step.url,
        schema: step.schema || {},
        config: step.config || {},
        results: [],
        nextSteps: [],
        parentStepId: step.parentStepId || null
      }));
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid template or steps configuration'
      });
    }

    const pipelineId = uuidv4();
    const pipeline = {
      id: pipelineId,
      name,
      description: description || '',
      template,
      status: 'draft',
      startUrl,
      steps: pipelineSteps,
      config: {
        maxDepth: config?.maxDepth || 3,
        maxLinksPerStep: config?.maxLinksPerStep || 10,
        enableAutoDiscovery: config?.enableAutoDiscovery !== false,
        enableEnrichment: config?.enableEnrichment !== false
      },
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executionHistory: []
    };

    // Salvează în DynamoDB
    await dynamoService.saveDataFlowPipeline(pipeline);

    // Creează DAG în Airflow
    try {
      await airflowService.createDataFlowDAG(pipeline);
      pipeline.status = 'ready';
      await dynamoService.updateDataFlowPipeline(pipelineId, { status: 'ready' });
    } catch (airflowError) {
      console.warn('Failed to create Airflow DAG:', airflowError.message);
      // Pipeline remains in draft status
    }

    res.status(201).json({
      success: true,
      data: {
        id: pipelineId,
        name,
        status: pipeline.status,
        message: 'Data flow pipeline created successfully'
      }
    });

  } catch (error) {
    console.error('Error creating data flow pipeline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create data flow pipeline'
    });
  }
});

// GET /api/v1/dataflow/pipelines - Listează pipeline-urile utilizatorului
router.get('/pipelines', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, status, template } = req.query;

    const pipelines = await dynamoService.getDataFlowPipelines(userId, {
      limit: parseInt(limit),
      status,
      template
    });

    res.json({
      success: true,
      data: {
        pipelines: pipelines,
        pagination: {
          count: pipelines.length,
          limit: parseInt(limit),
          hasMore: pipelines.length === parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching data flow pipelines:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch data flow pipelines'
    });
  }
});

// GET /api/v1/dataflow/pipelines/:id - Obține detaliile unui pipeline
router.get('/pipelines/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const pipeline = await dynamoService.getDataFlowPipeline(id, userId);

    if (!pipeline) {
      return res.status(404).json({
        success: false,
        error: 'Pipeline not found'
      });
    }

    res.json({
      success: true,
      data: pipeline
    });

  } catch (error) {
    console.error('Error fetching pipeline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pipeline'
    });
  }
});

// POST /api/v1/dataflow/pipelines/:id/execute - Execută întregul pipeline
router.post('/pipelines/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const pipeline = await dynamoService.getDataFlowPipeline(id, userId);

    if (!pipeline) {
      return res.status(404).json({
        success: false,
        error: 'Pipeline not found'
      });
    }

    // Trigger DAG execution în Airflow
    const airflowResult = await airflowService.triggerDataFlowExecution(id, {
      userId,
      triggerTime: new Date().toISOString()
    });

    const executionId = airflowResult.executionId;

    // Actualizează statusul pipeline-ului și istoric
    const executionRecord = {
      startedAt: new Date().toISOString(),
      totalSteps: pipeline.steps.length,
      completedSteps: 0,
      failedSteps: 0
    };

    await dynamoService.updateDataFlowPipeline(id, {
      status: 'running',
      updatedAt: new Date().toISOString(),
      executionHistory: [...(pipeline.executionHistory || []), executionRecord]
    });

    res.json({
      success: true,
      data: {
        executionId,
        status: 'running',
        message: 'Pipeline execution started via Airflow'
      }
    });

  } catch (error) {
    console.error('Error executing pipeline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute pipeline'
    });
  }
});

// POST /api/v1/dataflow/pipelines/:id/steps/:stepId/execute - Execută un pas specific
router.post('/pipelines/:id/steps/:stepId/execute', async (req, res) => {
  try {
    const { id, stepId } = req.params;
    const userId = req.user.id;

    const pipeline = await dynamoService.getDataFlowPipeline(id, userId);

    if (!pipeline) {
      return res.status(404).json({
        success: false,
        error: 'Pipeline not found'
      });
    }

    const step = pipeline.steps.find(s => s.id === stepId);
    if (!step) {
      return res.status(404).json({
        success: false,
        error: 'Step not found'
      });
    }

    // Actualizează statusul pas-ului
    const updatedSteps = pipeline.steps.map(s => 
      s.id === stepId ? { ...s, status: 'running' } : s
    );

    await dynamoService.updateDataFlowPipeline(id, {
      steps: updatedSteps,
      updatedAt: new Date().toISOString()
    });

    // Trimite mesaj către SQS pentru executia pas-ului
    await sqsService.sendMessage({
      type: 'dataflow_step_execution',
      pipelineId: id,
      stepId,
      userId,
      step: step
    });

    res.json({
      success: true,
      data: {
        stepId,
        status: 'queued',
        message: 'Step execution started'
      }
    });

  } catch (error) {
    console.error('Error executing step:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute step'
    });
  }
});

// GET /api/v1/dataflow/pipelines/:id/executions/:executionId - Obține statusul unei execuții
router.get('/pipelines/:id/executions/:executionId', async (req, res) => {
  try {
    const { id, executionId } = req.params;
    const userId = req.user.id;

    const pipeline = await dynamoService.getDataFlowPipeline(id, userId);

    if (!pipeline) {
      return res.status(404).json({
        success: false,
        error: 'Pipeline not found'
      });
    }

    // Obține statusul din Airflow
    const airflowStatus = await airflowService.getDAGRunStatus(id, executionId);

    if (!airflowStatus.success) {
      return res.status(404).json({
        success: false,
        error: 'Execution not found'
      });
    }

    res.json({
      success: true,
      data: airflowStatus.execution
    });

  } catch (error) {
    console.error('Error fetching execution status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch execution status'
    });
  }
});

// GET /api/v1/dataflow/pipelines/:id/steps/:stepId/results - Obține rezultatele unui pas
router.get('/pipelines/:id/steps/:stepId/results', async (req, res) => {
  try {
    const { id, stepId } = req.params;
    const userId = req.user.id;

    const pipeline = await dynamoService.getDataFlowPipeline(id, userId);

    if (!pipeline) {
      return res.status(404).json({
        success: false,
        error: 'Pipeline not found'
      });
    }

    const step = pipeline.steps.find(s => s.id === stepId);
    if (!step) {
      return res.status(404).json({
        success: false,
        error: 'Step not found'
      });
    }

    // Încearcă să obții rezultatele din S3
    let results = step.results || [];
    try {
      const s3Results = await s3Service.getStepResults(id, stepId);
      if (s3Results) {
        results = s3Results;
      }
    } catch (s3Error) {
      console.warn('Could not fetch results from S3:', s3Error.message);
    }

    res.json({
      success: true,
      data: {
        stepId,
        results,
        metadata: {
          totalResults: results.length,
          processingTime: step.processingTime || 0,
          nextStepsGenerated: step.nextSteps?.length || 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching step results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch step results'
    });
  }
});

// PUT /api/v1/dataflow/pipelines/:id - Actualizează un pipeline
router.put('/pipelines/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    // Verifică dacă pipeline-ul există și aparține utilizatorului
    const existingPipeline = await dynamoService.getDataFlowPipeline(id, userId);
    if (!existingPipeline) {
      return res.status(404).json({
        success: false,
        error: 'Pipeline not found'
      });
    }

    // Actualizează pipeline-ul
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await dynamoService.updateDataFlowPipeline(id, updatedData);

    res.json({
      success: true,
      data: {
        id,
        message: 'Pipeline updated successfully'
      }
    });

  } catch (error) {
    console.error('Error updating pipeline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update pipeline'
    });
  }
});

// DELETE /api/v1/dataflow/pipelines/:id - Șterge un pipeline
router.delete('/pipelines/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verifică dacă pipeline-ul există și aparține utilizatorului
    const pipeline = await dynamoService.getDataFlowPipeline(id, userId);
    if (!pipeline) {
      return res.status(404).json({
        success: false,
        error: 'Pipeline not found'
      });
    }

    // Șterge pipeline-ul
    await dynamoService.deleteDataFlowPipeline(id, userId);

    // Șterge și rezultatele din S3 (optional)
    try {
      await s3Service.deletePipelineResults(id);
    } catch (s3Error) {
      console.warn('Could not delete S3 results:', s3Error.message);
    }

    res.json({
      success: true,
      data: {
        id,
        message: 'Pipeline deleted successfully'
      }
    });

  } catch (error) {
    console.error('Error deleting pipeline:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete pipeline'
    });
  }
});

// GET /api/v1/dataflow/pipelines/:id/export - Exportă rezultatele pipeline-ului
router.get('/pipelines/:id/export', async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;
    const userId = req.user.id;

    const pipeline = await dynamoService.getDataFlowPipeline(id, userId);
    if (!pipeline) {
      return res.status(404).json({
        success: false,
        error: 'Pipeline not found'
      });
    }

    // Colectează toate rezultatele din pași
    const allResults = [];
    for (const step of pipeline.steps) {
      if (step.results && step.results.length > 0) {
        allResults.push({
          stepId: step.id,
          stepType: step.type,
          stepTitle: step.title,
          results: step.results
        });
      }
    }

    // Formatează rezultatele în funcție de format
    let responseData;
    let contentType;
    let filename;

    switch (format) {
      case 'csv':
        // Convertește la CSV (implementare simplificată)
        const csvData = convertToCSV(allResults);
        responseData = csvData;
        contentType = 'text/csv';
        filename = `pipeline_${id}_results.csv`;
        break;
      case 'xlsx':
        // Pentru XLSX ar trebui folosit un library ca xlsx
        return res.status(400).json({
          success: false,
          error: 'XLSX format not yet supported'
        });
      case 'json':
      default:
        responseData = JSON.stringify(allResults, null, 2);
        contentType = 'application/json';
        filename = `pipeline_${id}_results.json`;
        break;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(responseData);

  } catch (error) {
    console.error('Error exporting pipeline results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export pipeline results'
    });
  }
});

// GET /api/v1/dataflow/pipelines/:id/analytics - Obține analitica pipeline-ului
router.get('/pipelines/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params;
    const { timeRange = '7d' } = req.query;
    const userId = req.user.id;

    const pipeline = await dynamoService.getDataFlowPipeline(id, userId);
    if (!pipeline) {
      return res.status(404).json({
        success: false,
        error: 'Pipeline not found'
      });
    }

    // Calculează statistici (implementare simplificată)
    const executionHistory = pipeline.executionHistory || [];
    const completedExecutions = executionHistory.filter(e => e.completedAt);
    
    const analytics = {
      executions: executionHistory.length,
      totalResults: pipeline.steps.reduce((total, step) => total + (step.results?.length || 0), 0),
      averageExecutionTime: completedExecutions.length > 0 
        ? completedExecutions.reduce((sum, e) => {
            const duration = new Date(e.completedAt) - new Date(e.startedAt);
            return sum + duration;
          }, 0) / completedExecutions.length / 1000 // în secunde
        : 0,
      successRate: executionHistory.length > 0 
        ? (completedExecutions.length / executionHistory.length) * 100 
        : 0,
      stepPerformance: pipeline.steps.map(step => ({
        stepId: step.id,
        stepType: step.type,
        averageTime: step.averageTime || 0,
        successRate: step.successRate || 0,
        totalResults: step.results?.length || 0
      }))
    };

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Error fetching pipeline analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pipeline analytics'
    });
  }
});

// Funcție helper pentru conversie CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = ['Step ID', 'Step Type', 'Step Title', 'Result Index', 'Result Data'];
  const rows = [headers.join(',')];
  
  data.forEach(step => {
    step.results.forEach((result, index) => {
      const row = [
        step.stepId,
        step.stepType,
        step.stepTitle,
        index,
        JSON.stringify(result).replace(/"/g, '""')
      ];
      rows.push(row.join(','));
    });
  });
  
  return rows.join('\n');
}

module.exports = router;
