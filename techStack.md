sayan801: which tech stack is used in this code base



GitHub Copilot: Based on the codebase analysis, here's the key technology stack used:

### Backend Framework & Runtime
- **Node.js** as the runtime environment
- **Express.js** as the web application framework

### Package Management
- **Yarn** as the package manager (version 3.6.4 mentioned in Dockerfile)

### Testing
- **Jest** as the testing framework
- **Supertest** for HTTP testing
- **Nock** for HTTP request mocking

### Validation & Schema
- **Ajv** for JSON Schema validation

### Utilities & Libraries
- **Winston** for logging
- **Lodash** for utility functions
- **Superagent** for HTTP requests
- **JWT** (jsonwebtoken) for authentication
- **Morgan** for HTTP request logging
- **Body-parser** for parsing HTTP request bodies
- **Dotenv** for environment variable management

### Container
- **Docker** for containerization

### API Standards Implemented
- CDS Hooks API standard
- XACML JSON Profile API standard
- FHIR standard for healthcare data

### Development Environment
- **Visual Studio Code** as the recommended IDE
- Linux-based development environment

The application appears to be a healthcare consent decision service that interfaces with FHIR servers and provides consent decisions through both CDS Hooks and XACML interfaces.