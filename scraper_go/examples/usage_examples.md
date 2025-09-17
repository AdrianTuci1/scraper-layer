# ScraperGo - Usage Examples

## Multiple Output Formats

### 1. JSON Output (Default)
```json
{
  "task_id": "json-example-001",
  "url": "https://example.com/product",
  "schema": {
    "title": {
      "selector": "h1.product-title",
      "type": "text"
    },
    "price": {
      "selector": ".price-value",
      "type": "text",
      "transform": "trim"
    },
    "description": {
      "selector": ".product-description",
      "type": "text"
    }
  },
  "options": {
    "enable_js": false,
    "output_format": "json"
  }
}
```

### 2. HTML Output (For Web Display)
```json
{
  "task_id": "html-example-002",
  "url": "https://news-site.com/article",
  "schema": {
    "headline": {
      "selector": "h1.headline",
      "type": "text"
    },
    "content": {
      "selector": ".article-body",
      "type": "html"
    },
    "author": {
      "selector": ".byline",
      "type": "text"
    }
  },
  "options": {
    "enable_js": true,
    "output_format": "html",
    "stealth_mode": true
  }
}
```

### 3. Markdown Output (Perfect for LLMs)
```json
{
  "task_id": "markdown-example-003",
  "url": "https://documentation-site.com/page",
  "schema": {
    "title": {
      "selector": "h1.page-title",
      "type": "text"
    },
    "content": {
      "selector": ".main-content",
      "type": "text"
    },
    "toc": {
      "selector": ".table-of-contents a",
      "type": "list"
    }
  },
  "options": {
    "enable_js": true,
    "output_format": "md",
    "human_behavior": true,
    "random_delay": true,
    "min_delay": 1,
    "max_delay": 3
  }
}
```

### 4. XML Output (For Data Integration)
```json
{
  "task_id": "xml-example-004",
  "url": "https://api-docs.com/endpoint",
  "schema": {
    "endpoint": {
      "selector": ".endpoint-name",
      "type": "text"
    },
    "method": {
      "selector": ".http-method",
      "type": "text"
    },
    "parameters": {
      "selector": ".param-list li",
      "type": "list"
    }
  },
  "options": {
    "enable_js": false,
    "output_format": "xml"
  }
}
```

### 5. CSV Output (For Data Analysis)
```json
{
  "task_id": "csv-example-005",
  "url": "https://job-board.com/search?q=developer",
  "schema": {
    "job_title": {
      "selector": ".job-title",
      "type": "text"
    },
    "company": {
      "selector": ".company-name",
      "type": "text"
    },
    "location": {
      "selector": ".job-location",
      "type": "text"
    },
    "salary": {
      "selector": ".salary-range",
      "type": "text"
    }
  },
  "options": {
    "enable_js": true,
    "output_format": "csv",
    "stealth_mode": true
  }
}
```

## Anti-bot and CAPTCHA Examples

### 6. Stealth Mode for Protected Sites
```json
{
  "task_id": "stealth-example-006",
  "url": "https://protected-ecommerce.com/products",
  "schema": {
    "products": {
      "selector": ".product-card",
      "type": "list"
    }
  },
  "options": {
    "enable_js": true,
    "stealth_mode": true,
    "human_behavior": true,
    "random_delay": true,
    "min_delay": 2,
    "max_delay": 5,
    "viewport_width": 1920,
    "viewport_height": 1080,
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "disable_images": true,
    "output_format": "json"
  }
}
```

### 7. CAPTCHA Solving with 2captcha
```json
{
  "task_id": "captcha-example-007",
  "url": "https://form-with-captcha.com",
  "schema": {
    "form_data": {
      "selector": ".form-content",
      "type": "text"
    }
  },
  "options": {
    "enable_js": true,
    "stealth_mode": true,
    "captcha_solver": "2captcha",
    "captcha_api_key": "your-2captcha-api-key-here",
    "human_behavior": true,
    "wait_for_element": ".form-loaded",
    "output_format": "html"
  }
}
```

### 8. AntiCaptcha Service
```json
{
  "task_id": "anticaptcha-example-008",
  "url": "https://another-protected-site.com",
  "schema": {
    "content": {
      "selector": ".main-content",
      "type": "text"
    }
  },
  "options": {
    "enable_js": true,
    "stealth_mode": true,
    "captcha_solver": "anticaptcha",
    "captcha_api_key": "your-anticaptcha-api-key-here",
    "random_delay": true,
    "min_delay": 1,
    "max_delay": 4,
    "output_format": "md"
  }
}
```

### 9. Manual CAPTCHA Solving (Development/Testing)
```json
{
  "task_id": "manual-captcha-example-009",
  "url": "https://test-site-with-captcha.com",
  "schema": {
    "test_data": {
      "selector": ".test-content",
      "type": "text"
    }
  },
  "options": {
    "enable_js": true,
    "captcha_solver": "manual",
    "output_format": "json"
  }
}
```

## Real-world Use Cases

### 10. Amazon Product Scraping
```json
{
  "task_id": "amazon-scraper-010",
  "url": "https://www.amazon.com/dp/B08N5WRWNW",
  "schema": {
    "title": {
      "selector": "#productTitle",
      "type": "text"
    },
    "price": {
      "selector": ".a-price-whole",
      "type": "text"
    },
    "rating": {
      "selector": ".a-icon-alt",
      "type": "attr",
      "attr": "aria-label"
    },
    "reviews_count": {
      "selector": "#acrCustomerReviewText",
      "type": "text"
    },
    "images": {
      "selector": "#landingImage",
      "type": "attr",
      "attr": "src"
    },
    "description": {
      "selector": "#feature-bullets ul",
      "type": "list"
    }
  },
  "options": {
    "enable_js": true,
    "stealth_mode": true,
    "human_behavior": true,
    "random_delay": true,
    "min_delay": 3,
    "max_delay": 7,
    "wait_for_element": "#productTitle",
    "timeout": 45,
    "output_format": "html"
  }
}
```

### 11. Google Search Results
```json
{
  "task_id": "google-search-011",
  "url": "https://www.google.com/search?q=web+scraping+tools",
  "schema": {
    "search_results": {
      "selector": ".g .yuRUbf a",
      "type": "list",
      "attr": "href"
    },
    "titles": {
      "selector": ".g .yuRUbf h3",
      "type": "list"
    },
    "descriptions": {
      "selector": ".g .VwiC3b",
      "type": "list"
    }
  },
  "options": {
    "enable_js": true,
    "stealth_mode": true,
    "human_behavior": true,
    "random_delay": true,
    "min_delay": 2,
    "max_delay": 5,
    "output_format": "csv"
  }
}
```

### 12. LinkedIn Job Search
```json
{
  "task_id": "linkedin-jobs-012",
  "url": "https://www.linkedin.com/jobs/search/?keywords=software+engineer",
  "schema": {
    "job_titles": {
      "selector": ".jobs-search__results-list .job-search-card__title a",
      "type": "list"
    },
    "companies": {
      "selector": ".jobs-search__results-list .job-search-card__subtitle-link",
      "type": "list"
    },
    "locations": {
      "selector": ".jobs-search__results-list .job-search-card__location",
      "type": "list"
    },
    "job_links": {
      "selector": ".jobs-search__results-list .job-search-card__title a",
      "type": "list",
      "attr": "href"
    }
  },
  "options": {
    "enable_js": true,
    "stealth_mode": true,
    "human_behavior": true,
    "random_delay": true,
    "min_delay": 3,
    "max_delay": 8,
    "wait_for_element": ".jobs-search__results-list",
    "output_format": "json"
  }
}
```

### 13. Real Estate Listings
```json
{
  "task_id": "real-estate-013",
  "url": "https://www.zillow.com/homes/for_sale/",
  "schema": {
    "addresses": {
      "selector": ".list-card-addr",
      "type": "list"
    },
    "prices": {
      "selector": ".list-card-price",
      "type": "list"
    },
    "bedrooms": {
      "selector": ".list-card-details li",
      "type": "list"
    },
    "square_feet": {
      "selector": ".list-card-details li",
      "type": "list"
    },
    "images": {
      "selector": ".list-card-photo img",
      "type": "list",
      "attr": "src"
    }
  },
  "options": {
    "enable_js": true,
    "stealth_mode": true,
    "human_behavior": true,
    "random_delay": true,
    "min_delay": 2,
    "max_delay": 6,
    "output_format": "xml"
  }
}
```

## Configuration Examples

### Environment Variables for Production
```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789012/scraper-queue
S3_BUCKET_NAME=scraper-results-bucket

# API Configuration
NODE_API_URL=https://your-node-api.com/api
API_KEY=your_api_key

# Performance Configuration
MAX_CONCURRENT_JOBS=200
WORKER_POOL_SIZE=20

# Output Format Configuration
DEFAULT_OUTPUT_FORMAT=json

# Anti-bot Configuration
DEFAULT_STEALTH_MODE=true
DEFAULT_CAPTCHA_SOLVER=2captcha
DEFAULT_CAPTCHA_API_KEY=your-2captcha-api-key
DEFAULT_MIN_DELAY=2
DEFAULT_MAX_DELAY=5
DEFAULT_VIEWPORT_WIDTH=1920
DEFAULT_VIEWPORT_HEIGHT=1080

# Proxy Configuration
USE_PROXY_ROTATION=true
PROXY_LIST=proxy1:8080,proxy2:8080,proxy3:8080

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

## Expected Output Formats

### JSON Output Example
```json
{
  "task_id": "example-001",
  "url": "https://example.com",
  "data": {
    "title": "Example Product",
    "price": "$29.99",
    "description": "This is an example product description."
  },
  "status": "completed",
  "cost": 0.03,
  "duration": 1250,
  "timestamp": "2024-01-01T12:00:00Z",
  "s3_location": "s3://bucket/results/2024/01/01/example-001.json"
}
```

### HTML Output Example
```html
<!DOCTYPE html>
<html>
<head>
    <title>Scraping Result - example-001</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 10px; border-radius: 5px; }
        .data { margin: 20px 0; }
        .field { margin: 10px 0; padding: 10px; border-left: 3px solid #007acc; }
        .field-name { font-weight: bold; color: #007acc; }
        .field-value { margin-top: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Scraping Result</h1>
        <p><strong>Task ID:</strong> example-001</p>
        <p><strong>URL:</strong> <a href="https://example.com" target="_blank">https://example.com</a></p>
        <p><strong>Status:</strong> <span class="success">completed</span></p>
        <p><strong>Timestamp:</strong> 2024-01-01 12:00:00</p>
        <p><strong>Duration:</strong> 1250ms</p>
        <p><strong>Cost:</strong> $0.03</p>
    </div>
    <div class="data">
        <h2>Extracted Data</h2>
        <div class="field">
            <div class="field-name">title:</div>
            <div class="field-value">Example Product</div>
        </div>
        <div class="field">
            <div class="field-name">price:</div>
            <div class="field-value">$29.99</div>
        </div>
    </div>
</body>
</html>
```

### Markdown Output Example
```markdown
# Scraping Result

## Metadata
- **Task ID:** example-001
- **URL:** [https://example.com](https://example.com)
- **Status:** completed
- **Timestamp:** 2024-01-01 12:00:00
- **Duration:** 1250ms
- **Cost:** $0.03

## Extracted Data

### title

Example Product

### price

$29.99

### description

This is an example product description.
```

## Best Practices

1. **Use appropriate output formats**:
   - JSON for APIs and data processing
   - HTML for web display
   - Markdown for LLMs and documentation
   - XML for data integration
   - CSV for data analysis

2. **Enable stealth mode** for protected sites:
   - Always use `stealth_mode: true` for major platforms
   - Combine with `human_behavior: true` and `random_delay: true`
   - Set appropriate viewport dimensions

3. **CAPTCHA handling**:
   - Use 2captcha or AntiCaptcha for production
   - Set appropriate timeouts for CAPTCHA solving
   - Monitor costs as CAPTCHA solving incurs additional charges

4. **Performance optimization**:
   - Disable images and CSS when not needed
   - Use appropriate delays to avoid rate limiting
   - Rotate proxies for high-volume scraping

5. **Error handling**:
   - Always set appropriate timeouts
   - Use retry mechanisms
   - Monitor logs for failed requests
