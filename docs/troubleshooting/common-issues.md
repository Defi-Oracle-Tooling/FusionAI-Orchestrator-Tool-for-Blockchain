# Common Issues and Solutions

This guide provides solutions for common issues you might encounter when using the FusionAI Orchestrator Tool.

## Backend Issues

### Connection Refused to Backend API

**Issue**: Unable to connect to the backend API with "Connection refused" error.

**Solutions**:
1. Verify that the backend service is running:
   ```bash
   docker-compose ps backend
   ```
2. Check the backend logs for errors:
   ```bash
   docker-compose logs backend
   ```
3. Ensure the backend service is exposed on the correct port:
   ```bash
   docker-compose port backend 4000
   ```
4. Verify that the frontend is configured with the correct API URL in `.env`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

### Database Connection Issues

**Issue**: Backend fails to start with database connection errors.

**Solutions**:
1. Verify that the PostgreSQL service is running:
   ```bash
   docker-compose ps postgres
   ```
2. Check the PostgreSQL logs for errors:
   ```bash
   docker-compose logs postgres
   ```
3. Ensure the database connection string is correct in the backend `.env` file:
   ```
   DATABASE_URL=postgres://postgres:postgres@postgres:5432/fusion_ai
   ```
4. Try connecting to the database manually:
   ```bash
   docker-compose exec postgres psql -U postgres -d fusion_ai
   ```

### Redis Connection Issues

**Issue**: Backend fails to connect to Redis.

**Solutions**:
1. Verify that the Redis service is running:
   ```bash
   docker-compose ps redis
   ```
2. Check the Redis logs for errors:
   ```bash
   docker-compose logs redis
   ```
3. Ensure the Redis connection string is correct in the backend `.env` file:
   ```
   REDIS_URL=redis://redis:6379
   ```
4. Try connecting to Redis manually:
   ```bash
   docker-compose exec redis redis-cli ping
   ```

## Frontend Issues

### Frontend Build Fails

**Issue**: Frontend build fails with dependency errors.

**Solutions**:
1. Clear the node_modules directory and reinstall dependencies:
   ```bash
   cd packages/frontend
   rm -rf node_modules
   pnpm install
   ```
2. Check for outdated dependencies:
   ```bash
   pnpm outdated
   ```
3. Verify that the correct Node.js version is being used:
   ```bash
   node -v
   ```
   The project requires Node.js 16.x or later.

### Frontend Shows "Network Error"

**Issue**: Frontend shows "Network Error" when trying to connect to the backend.

**Solutions**:
1. Verify that the backend service is running (see above).
2. Check that the CORS settings in the backend allow requests from the frontend:
   ```typescript
   // packages/backend/src/app.ts
   app.use(cors({
     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
     credentials: true
   }));
   ```
3. Ensure the frontend is using the correct API URL:
   ```typescript
   // packages/frontend/src/api/client.ts
   const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
   ```

### WebSocket Connection Issues

**Issue**: WebSocket connection fails with "Connection closed" error.

**Solutions**:
1. Verify that the backend service is running (see above).
2. Check that the WebSocket server is configured correctly in the backend:
   ```typescript
   // packages/backend/src/websocket/server.ts
   const wss = new WebSocketServer({
     server,
     path: '/ws'
   });
   ```
3. Ensure the frontend is using the correct WebSocket URL:
   ```typescript
   // packages/frontend/src/hooks/useWebSocket.ts
   const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/ws';
   ```

## Blockchain Issues

### Blockchain Node Connection Issues

**Issue**: Unable to connect to blockchain nodes.

**Solutions**:
1. Verify that the blockchain service is running:
   ```bash
   docker-compose ps blockchain
   ```
2. Check the blockchain service logs for errors:
   ```bash
   docker-compose logs blockchain
   ```
3. Ensure the blockchain node endpoints are correct in the configuration:
   ```typescript
   // packages/blockchain/src/config/networks.ts
   export const networks: Record<string, NetworkConfig> = {
     ethereum: {
       rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/your-api-key',
       // ...
     },
     // ...
   };
   ```
4. Check that the API keys for blockchain providers are valid and have sufficient quota.

### Transaction Submission Failures

**Issue**: Transactions fail to be submitted to the blockchain.

**Solutions**:
1. Check the blockchain service logs for errors:
   ```bash
   docker-compose logs blockchain
   ```
2. Verify that the account has sufficient funds for the transaction:
   ```typescript
   // packages/blockchain/src/services/EthereumNode.ts
   const balance = await this.web3.eth.getBalance(account);
   if (new BigNumber(balance).lt(new BigNumber(gasPrice).times(gasLimit))) {
     throw new Error('Insufficient funds for transaction');
   }
   ```
3. Ensure the gas price and gas limit are set appropriately:
   ```typescript
   // packages/blockchain/src/services/EthereumNode.ts
   const gasPrice = await this.web3.eth.getGasPrice();
   const gasLimit = await this.web3.eth.estimateGas({
     from: account,
     to: recipient,
     value: amount
   });
   ```

## AI Agent Issues

### AI Agent Initialization Failures

**Issue**: AI agents fail to initialize.

**Solutions**:
1. Verify that the AI agents service is running:
   ```bash
   docker-compose ps ai-agents
   ```
2. Check the AI agents service logs for errors:
   ```bash
   docker-compose logs ai-agents
   ```
3. Ensure the AI model endpoints are correct in the configuration:
   ```typescript
   // packages/ai-agents/src/config/models.ts
   export const models: Record<string, ModelConfig> = {
     gpt4: {
       endpoint: process.env.GPT4_ENDPOINT || 'https://api.openai.com/v1/chat/completions',
       // ...
     },
     // ...
   };
   ```
4. Check that the API keys for AI providers are valid and have sufficient quota.

### AI Agent Execution Timeouts

**Issue**: AI agent executions timeout.

**Solutions**:
1. Increase the execution timeout in the configuration:
   ```typescript
   // packages/ai-agents/src/config/agents.ts
   export const agentConfig: Record<string, AgentConfig> = {
     predictiveAnalytics: {
       executionTimeout: 60000, // 60 seconds
       // ...
     },
     // ...
   };
   ```
2. Optimize the AI agent implementation to reduce execution time:
   ```typescript
   // packages/ai-agents/src/agents/PredictiveAnalyticsAgent.ts
   // Use batch processing for multiple predictions
   const results = await this.batchProcessor.process(inputs);
   ```
3. Implement caching to avoid redundant computations:
   ```typescript
   // packages/ai-agents/src/agents/PredictiveAnalyticsAgent.ts
   const cacheKey = this.getCacheKey(input);
   const cachedResult = await this.cache.get(cacheKey);
   if (cachedResult) {
     return cachedResult;
   }
   ```

## Workflow Issues

### Workflow Creation Failures

**Issue**: Unable to create workflows.

**Solutions**:
1. Check the backend logs for errors:
   ```bash
   docker-compose logs backend
   ```
2. Verify that the workflow schema is valid:
   ```typescript
   // packages/frontend/src/components/WorkflowCanvas/WorkflowCanvas.tsx
   const validateWorkflow = (workflow: Workflow): boolean => {
     // Validation logic
     return isValid;
   };
   ```
3. Ensure all required fields are provided in the workflow:
   ```typescript
   // packages/common/src/types/Workflow.ts
   export interface Workflow {
     id: string;
     name: string;
     description: string;
     nodes: WorkflowNode[];
     edges: WorkflowEdge[];
     // ...
   }
   ```

### Workflow Execution Failures

**Issue**: Workflows fail to execute.

**Solutions**:
1. Check the backend logs for errors:
   ```bash
   docker-compose logs backend
   ```
2. Verify that all nodes in the workflow are configured correctly:
   ```typescript
   // packages/backend/src/services/WorkflowExecutionService.ts
   const validateNode = (node: WorkflowNode): boolean => {
     // Validation logic
     return isValid;
   };
   ```
3. Ensure all required services (blockchain, AI agents) are running:
   ```bash
   docker-compose ps
   ```
4. Check the connections between nodes in the workflow:
   ```typescript
   // packages/backend/src/services/WorkflowExecutionService.ts
   const validateEdges = (edges: WorkflowEdge[], nodes: WorkflowNode[]): boolean => {
     // Validation logic
     return isValid;
   };
   ```

## Monitoring Issues

### Prometheus Connection Issues

**Issue**: Unable to connect to Prometheus.

**Solutions**:
1. Verify that the Prometheus service is running:
   ```bash
   docker-compose ps prometheus
   ```
2. Check the Prometheus logs for errors:
   ```bash
   docker-compose logs prometheus
   ```
3. Ensure the Prometheus configuration is correct:
   ```yaml
   # monitoring/prometheus.yml
   scrape_configs:
     - job_name: 'backend'
       static_configs:
         - targets: ['backend:4000']
       metrics_path: '/metrics'
     # ...
   ```

### Grafana Dashboard Issues

**Issue**: Grafana dashboards show no data.

**Solutions**:
1. Verify that the Grafana service is running:
   ```bash
   docker-compose ps grafana
   ```
2. Check the Grafana logs for errors:
   ```bash
   docker-compose logs grafana
   ```
3. Ensure the Prometheus data source is configured correctly in Grafana:
   ```yaml
   # monitoring/provisioning/datasources/prometheus.yaml
   datasources:
     - name: Prometheus
       type: prometheus
       access: proxy
       url: http://prometheus:9090
       isDefault: true
   ```
4. Verify that Prometheus is collecting metrics from the services:
   ```bash
   curl http://localhost:9090/api/v1/targets
   ```

## Deployment Issues

### Docker Deployment Issues

**Issue**: Docker containers fail to start.

**Solutions**:
1. Check the Docker logs for errors:
   ```bash
   docker-compose logs
   ```
2. Verify that the Docker Compose file is valid:
   ```bash
   docker-compose config
   ```
3. Ensure all required environment variables are set:
   ```bash
   docker-compose run --rm backend env
   ```
4. Check for port conflicts:
   ```bash
   netstat -tulpn | grep LISTEN
   ```

### Kubernetes Deployment Issues

**Issue**: Kubernetes pods fail to start.

**Solutions**:
1. Check the pod status:
   ```bash
   kubectl get pods -n fusion-ai
   ```
2. Check the pod logs for errors:
   ```bash
   kubectl logs <pod-name> -n fusion-ai
   ```
3. Describe the pod to get more information:
   ```bash
   kubectl describe pod <pod-name> -n fusion-ai
   ```
4. Verify that the Kubernetes manifests are valid:
   ```bash
   kubectl apply --dry-run=client -f kubernetes/fusion-ai/
   ```

## Conclusion

If you encounter an issue that is not covered in this guide, please check the logs of the relevant services and search for error messages. If you still cannot resolve the issue, please open an issue on the GitHub repository with a detailed description of the problem, steps to reproduce, and relevant logs.
