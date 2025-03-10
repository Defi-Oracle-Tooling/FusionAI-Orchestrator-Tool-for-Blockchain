# Prometheus Setup

This guide provides instructions for setting up Prometheus to monitor the FusionAI Orchestrator Tool.

## Prerequisites

- Docker and Docker Compose (for local setup)
- Kubernetes (for Kubernetes setup)
- Access to the FusionAI Orchestrator Tool deployment

## Local Setup with Docker Compose

### 1. Create Prometheus Configuration

Create a `prometheus.yml` file in the `monitoring` directory:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:4000']
    metrics_path: '/metrics'

  - job_name: 'blockchain'
    static_configs:
      - targets: ['blockchain:8080']
    metrics_path: '/metrics'

  - job_name: 'ai-agents'
    static_configs:
      - targets: ['ai-agents:8080']
    metrics_path: '/metrics'

  - job_name: 'monitoring'
    static_configs:
      - targets: ['monitoring:9090']
    metrics_path: '/metrics'

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
```

### 2. Update Docker Compose Configuration

Add Prometheus to the `docker-compose.yml` file:

```yaml
services:
  # Existing services...

  prometheus:
    image: prom/prometheus:v2.40.0
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    networks:
      - fusion-network

volumes:
  # Existing volumes...
  prometheus-data:
```

### 3. Start Prometheus

```bash
docker-compose up -d prometheus
```

### 4. Access Prometheus

Open a web browser and navigate to:

```
http://localhost:9090
```

## Kubernetes Setup

### 1. Create Prometheus Namespace

```bash
kubectl create namespace monitoring
```

### 2. Create Prometheus ConfigMap

```yaml
# prometheus-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s

    scrape_configs:
      - job_name: 'backend'
        kubernetes_sd_configs:
          - role: service
            namespaces:
              names:
                - fusion-ai
        relabel_configs:
          - source_labels: [__meta_kubernetes_service_name]
            regex: backend
            action: keep
          - source_labels: [__meta_kubernetes_service_port_name]
            regex: metrics
            action: keep

      - job_name: 'blockchain'
        kubernetes_sd_configs:
          - role: service
            namespaces:
              names:
                - fusion-ai
        relabel_configs:
          - source_labels: [__meta_kubernetes_service_name]
            regex: blockchain
            action: keep
          - source_labels: [__meta_kubernetes_service_port_name]
            regex: metrics
            action: keep

      - job_name: 'ai-agents'
        kubernetes_sd_configs:
          - role: service
            namespaces:
              names:
                - fusion-ai
        relabel_configs:
          - source_labels: [__meta_kubernetes_service_name]
            regex: ai-agents
            action: keep
          - source_labels: [__meta_kubernetes_service_port_name]
            regex: metrics
            action: keep

      - job_name: 'monitoring'
        kubernetes_sd_configs:
          - role: service
            namespaces:
              names:
                - fusion-ai
        relabel_configs:
          - source_labels: [__meta_kubernetes_service_name]
            regex: monitoring
            action: keep
          - source_labels: [__meta_kubernetes_service_port_name]
            regex: metrics
            action: keep

      - job_name: 'prometheus'
        static_configs:
          - targets: ['localhost:9090']
```

Apply the ConfigMap:

```bash
kubectl apply -f prometheus-configmap.yaml
```

### 3. Create Prometheus Deployment and Service

```yaml
# prometheus-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
        - name: prometheus
          image: prom/prometheus:v2.40.0
          ports:
            - containerPort: 9090
          volumeMounts:
            - name: prometheus-config
              mountPath: /etc/prometheus
            - name: prometheus-data
              mountPath: /prometheus
          args:
            - '--config.file=/etc/prometheus/prometheus.yml'
            - '--storage.tsdb.path=/prometheus'
            - '--web.console.libraries=/usr/share/prometheus/console_libraries'
            - '--web.console.templates=/usr/share/prometheus/consoles'
          resources:
            requests:
              cpu: "0.5"
              memory: "512Mi"
            limits:
              cpu: "1"
              memory: "1Gi"
      volumes:
        - name: prometheus-config
          configMap:
            name: prometheus-config
        - name: prometheus-data
          persistentVolumeClaim:
            claimName: prometheus-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: prometheus
  namespace: monitoring
spec:
  selector:
    app: prometheus
  ports:
    - port: 9090
      targetPort: 9090
  type: ClusterIP
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: prometheus-pvc
  namespace: monitoring
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

Apply the deployment and service:

```bash
kubectl apply -f prometheus-deployment.yaml
```

### 4. Create Ingress for Prometheus

```yaml
# prometheus-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: prometheus-ingress
  namespace: monitoring
  annotations:
    kubernetes.io/ingress.class: nginx
spec:
  rules:
    - host: prometheus.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: prometheus
                port:
                  number: 9090
```

Apply the ingress:

```bash
kubectl apply -f prometheus-ingress.yaml
```

### 5. Access Prometheus

Open a web browser and navigate to:

```
http://prometheus.example.com
```

## Configuring Metrics Endpoints

### Backend Service

The backend service exposes metrics at the `/metrics` endpoint using the Prometheus client library.

Example implementation:

```typescript
// packages/backend/src/metrics.ts
import { register, Counter, Gauge, Histogram } from 'prom-client';
import express from 'express';

// Create metrics
const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const workflowsActive = new Gauge({
  name: 'workflows_active',
  help: 'Number of active workflows'
});

// Middleware to collect metrics
export const metricsMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestsTotal.inc({ method: req.method, route: req.path, status: res.statusCode });
    httpRequestDuration.observe({ method: req.method, route: req.path, status: res.statusCode }, duration);
  });
  
  next();
};

// Metrics endpoint
export const metricsEndpoint = async (req: express.Request, res: express.Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

// Update workflow metrics
export const updateWorkflowMetrics = (activeCount: number) => {
  workflowsActive.set(activeCount);
};
```

### Blockchain Service

The blockchain service exposes metrics at the `/metrics` endpoint using the Prometheus client library.

Example implementation:

```typescript
// packages/blockchain/src/metrics.ts
import { register, Gauge } from 'prom-client';
import express from 'express';

// Create metrics
const blockchainBlockNumber = new Gauge({
  name: 'blockchain_block_number',
  help: 'Current block number',
  labelNames: ['network']
});

const blockchainPeers = new Gauge({
  name: 'blockchain_peers',
  help: 'Number of connected peers',
  labelNames: ['network']
});

const blockchainGasPrice = new Gauge({
  name: 'blockchain_gas_price',
  help: 'Current gas price in wei',
  labelNames: ['network']
});

// Metrics endpoint
export const metricsEndpoint = async (req: express.Request, res: express.Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

// Update blockchain metrics
export const updateBlockchainMetrics = (network: string, blockNumber: number, peers: number, gasPrice: string) => {
  blockchainBlockNumber.set({ network }, blockNumber);
  blockchainPeers.set({ network }, peers);
  blockchainGasPrice.set({ network }, parseInt(gasPrice));
};
```

### AI Agents Service

The AI agents service exposes metrics at the `/metrics` endpoint using the Prometheus client library.

Example implementation:

```typescript
// packages/ai-agents/src/metrics.ts
import { register, Counter, Gauge, Histogram } from 'prom-client';
import express from 'express';

// Create metrics
const agentExecutionsTotal = new Counter({
  name: 'agent_executions_total',
  help: 'Total number of agent executions',
  labelNames: ['agent', 'status']
});

const agentExecutionDuration = new Histogram({
  name: 'agent_execution_duration_seconds',
  help: 'Duration of agent executions in seconds',
  labelNames: ['agent'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const agentConfidenceScore = new Gauge({
  name: 'agent_confidence_score',
  help: 'Confidence score of agent results',
  labelNames: ['agent']
});

// Metrics endpoint
export const metricsEndpoint = async (req: express.Request, res: express.Response) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
};

// Update agent metrics
export const updateAgentMetrics = (agent: string, status: string, duration: number, confidence: number) => {
  agentExecutionsTotal.inc({ agent, status });
  agentExecutionDuration.observe({ agent }, duration);
  agentConfidenceScore.set({ agent }, confidence);
};
```

## Querying Prometheus

Prometheus provides a powerful query language called PromQL for querying metrics. Here are some example queries:

### HTTP Request Rate

```
sum(rate(http_requests_total[5m])) by (method, route)
```

### HTTP Request Duration

```
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route))
```

### Active Workflows

```
workflows_active
```

### Blockchain Block Number

```
blockchain_block_number
```

### AI Agent Execution Rate

```
sum(rate(agent_executions_total[5m])) by (agent, status)
```

### AI Agent Confidence Score

```
agent_confidence_score
```

## Conclusion

By following this guide, you can set up Prometheus to monitor the FusionAI Orchestrator Tool. Prometheus provides a powerful platform for collecting and querying metrics, which can be used to monitor the health and performance of the system.
