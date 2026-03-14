/**
 * TaskMaster Template Routes
 * Endpoints for PRD template management
 */

import { Router } from 'express';
import path from 'path';
import os from 'os';
import { promises as fsPromises } from 'fs';
import { extractProjectDirectory } from '../../project-service.ts';
import { createLogger } from '../../lib/logger';

const router = Router();
const logger = createLogger('routes/taskmasters/templates');

/**
 * Get available PRD templates
 */
router.get('/prd-templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'web-app',
        name: 'Web Application',
        description: 'Template for web application projects with frontend and backend components',
        category: 'web',
        content: `# Product Requirements Document - Web Application

## Overview
**Product Name:** [Your App Name]
**Version:** 1.0
**Date:** ${new Date().toISOString().split('T')[0]}
**Author:** [Your Name]

## Executive Summary
Brief description of what this web application will do and why it's needed.

## Product Goals
- Goal 1: [Specific measurable goal]
- Goal 2: [Specific measurable goal]
- Goal 3: [Specific measurable goal]

## User Stories
### Core Features
1. **User Registration & Authentication**
   - As a user, I want to create an account so I can access personalized features

2. **Main Application Features**
   - As a user, I want to [core feature 1] so I can [benefit]

## Technical Requirements
### Frontend
- Framework: React/Vue/Angular
- Styling: CSS framework
- State Management: Redux/Vuex/Context API

### Backend
- Runtime: Node.js/Python/Java
- Database: PostgreSQL/MySQL/MongoDB
- API: RESTful API or GraphQL

## Success Metrics
- User engagement metrics
- Performance benchmarks (load time < 2s)
- Error rates < 1%`,
      },
      {
        id: 'api',
        name: 'REST API',
        description: 'Template for REST API development projects',
        category: 'backend',
        content: `# Product Requirements Document - REST API

## Overview
**API Name:** [Your API Name]
**Version:** v1.0
**Date:** ${new Date().toISOString().split('T')[0]}
**Author:** [Your Name]

## Executive Summary
Description of the API's purpose, target users, and primary use cases.

## API Goals
- Goal 1: Provide secure data access
- Goal 2: Ensure scalable architecture

## Functional Requirements
### Core Endpoints
1. **Authentication Endpoints**
   - POST /api/auth/login - User authentication
   - POST /api/auth/register - User registration

2. **Data Management Endpoints**
   - GET /api/resources - List resources
   - POST /api/resources - Create resource

## Technical Requirements
### API Design
- RESTful architecture following OpenAPI 3.0 specification
- JSON request/response format

### Authentication & Security
- JWT token-based authentication
- Role-based access control (RBAC)

## Success Metrics
- API uptime > 99.9%
- Average response time < 200ms`,
      },
      {
        id: 'mobile-app',
        name: 'Mobile Application',
        description: 'Template for mobile app development projects',
        category: 'mobile',
        content: `# Product Requirements Document - Mobile Application

## Overview
**App Name:** [Your App Name]
**Platform:** iOS / Android / Cross-platform
**Version:** 1.0
**Date:** ${new Date().toISOString().split('T')[0]}
**Author:** [Your Name]

## Executive Summary
Brief description of the mobile app's purpose and key value proposition.

## Product Goals
- Goal 1: [Specific user engagement goal]
- Goal 2: [Specific functionality goal]

## User Stories
### Core Features
1. **Onboarding & Authentication**
   - As a new user, I want a simple onboarding process

2. **Main App Features**
   - As a user, I want [core feature 1] accessible from home screen

## Technical Requirements
### Mobile Development
- Cross-platform: React Native / Flutter
- State Management: Redux / MobX

### Backend Integration
- REST API or GraphQL integration
- Push notifications

## Platform-Specific
### iOS
- iOS 13.0+ minimum version

### Android
- Android 8.0+ (API level 26) minimum`,
      },
      {
        id: 'data-analysis',
        name: 'Data Analysis Project',
        description: 'Template for data analysis and visualization projects',
        category: 'data',
        content: `# Product Requirements Document - Data Analysis Project

## Overview
**Project Name:** [Your Analysis Project]
**Analysis Type:** [Descriptive/Predictive/Prescriptive]
**Date:** ${new Date().toISOString().split('T')[0]}
**Author:** [Your Name]

## Executive Summary
Description of the business problem and expected insights.

## Project Goals
- Goal 1: [Specific business question to answer]
- Goal 2: [Specific prediction to make]

## Data Requirements
### Data Sources
1. Primary Data: [Database/API/Files]
2. External Data: Third-party APIs

## Technical Requirements
### Analysis Tools
- Programming: Python/R/SQL
- Libraries: pandas, numpy, scikit-learn

## Deliverables
- Executive summary for stakeholders
- Interactive dashboards
- Reproducible analysis scripts`,
      },
    ];

    res.json({ templates, timestamp: new Date().toISOString() });
  } catch (error: any) {
    logger.error('PRD templates error:', error);
    res.status(500).json({ error: 'Failed to get PRD templates', message: error.message });
  }
});

/**
 * Apply a PRD template to create a new PRD file
 */
router.post('/apply-template/:projectName', async (req, res) => {
  try {
    const { projectName } = req.params;
    const { templateId, fileName = 'prd.txt', customizations = {} } = req.body;

    if (!templateId) {
      return res.status(400).json({ error: 'Missing required parameter', message: 'templateId is required' });
    }

    let projectPath;
    try {
      projectPath = await extractProjectDirectory(projectName);
      if (!projectPath) {
        return res.status(404).json({ error: 'Project not found', message: `Project "${projectName}" does not exist` });
      }
    } catch {
      return res.status(404).json({ error: 'Project not found', message: `Project "${projectName}" does not exist` });
    }

    const templates = [
      {
        id: 'web-app',
        name: 'Web Application',
        content: `# Product Requirements Document - Web Application

## Overview
**Product Name:** [Your App Name]
**Version:** 1.0

## Executive Summary
Brief description of what this web application will do.

## User Stories
1. As a user, I want [feature] so I can [benefit]

## Technical Requirements
- Frontend framework
- Backend services
- Database requirements`,
      },
    ];

    const template = templates.find((t) => t.id === templateId);

    if (!template) {
      return res.status(404).json({ error: 'Template not found', message: `Template "${templateId}" does not exist` });
    }

    let content = template.content;
    for (const [key, value] of Object.entries(customizations)) {
      const placeholder = `[${key}]`;
      content = content.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value as string);
    }

    const docsDir = path.join(projectPath, '.taskmaster', 'docs');
    await fsPromises.mkdir(docsDir, { recursive: true });

    const filePath = path.join(docsDir, fileName);
    await fsPromises.writeFile(filePath, content, 'utf8');

    res.json({
      projectName,
      templateId,
      templateName: template.name,
      fileName,
      filePath,
      message: 'PRD template applied successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Apply template error:', error);
    res.status(500).json({ error: 'Failed to apply PRD template', message: error.message });
  }
});

export default router;
