# Kubernetes Deployment

This guide provides instructions for deploying the FusionAI Orchestrator Tool to Kubernetes.

## Prerequisites

- Kubernetes cluster (v1.19+)
- kubectl CLI tool
- Helm (v3.0+)
- Docker
- Git

## Deployment Options

There are several options for deploying the FusionAI Orchestrator Tool to Kubernetes:

1. **Manual Deployment**: Using kubectl to apply Kubernetes manifests
2. **Helm Deployment**: Using Helm charts for a more managed deployment
3. **Kustomize Deployment**: Using Kustomize for environment-specific configurations

This guide focuses on the Manual and Helm deployment options.

## Manual Deployment

### 1. Clone the Repository

```bash
git clone https://github.com/Defi-Oracle-Tooling/FusionAI-Orchestrator-Tool-for-Blockchain.git
cd FusionAI-Orchestrator-Tool-for-Blockchain
```

### 2. Build and Push Docker Images

```bash
# Set your Docker registry
DOCKER_REGISTRY=your-registry.com

# Build and tag the images
docker build -t $DOCKER_REGISTRY/fusion-ai/backend:latest -f packages/backend/Dockerfile .
docker build -t $DOCKER_REGISTRY/fusion-ai/frontend:latest -f packages/frontend/Dockerfile .
docker build -t $DOCKER_REGISTRY/fusion-ai/blockchain:latest -f packages/blockchain/Dockerfile .
docker build -t $DOCKER_REGISTRY/fusion-ai/ai-agents:latest -f packages/ai-agents/Dockerfile .
docker build -t $DOCKER_REGISTRY/fusion-ai/monitoring:latest -f packages/monitoring/Dockerfile .

# Push the images to the registry
docker push $DOCKER_REGISTRY/fusion-ai/backend:latest
docker push $DOCKER_REGISTRY/fusion-ai/frontend:latest
docker push $DOCKER_REGISTRY/fusion-ai/blockchain:latest
docker push $DOCKER_REGISTRY/fusion-ai/ai-agents:latest
docker push $DOCKER_REGISTRY/fusion-ai/monitoring:latest
```

### 3. Create Kubernetes Manifests

Create a directory for Kubernetes manifests:

```bash
mkdir -p kubernetes/fusion-ai
```

Create a namespace manifest:

```yaml
# kubernetes/fusion-ai/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: fusion-ai
```

Create a secret for database credentials:

```yaml
# kubernetes/fusion-ai/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: fusion-ai-secrets
  namespace: fusion-ai
type: Opaque
data:
  postgres-password: <base64-encoded-password>
  redis-password: <base64-encoded-password>
```

Create a config map for environment variables:

```yaml
# kubernetes/fusion-ai/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fusion-ai-config
  namespace: fusion-ai
data:
  NODE_ENV: "production"
  DATABASE_URL: "postgres://postgres:$(POSTGRES_PASSWORD)@postgres:5432/fusion_ai"
  REDIS_URL: "redis://redis:6379"
  NEXT_PUBLIC_API_URL: "http://backend"
  NEXT_PUBLIC_WS_URL: "ws://backend"
```

Create deployment and service manifests for each component:

```yaml
# kubernetes/fusion-ai/backend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: fusion-ai
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: backend
          image: your-registry.com/fusion-ai/backend:latest
          ports:
            - containerPort: 4000
          envFrom:
            - configMapRef:
                name: fusion-ai-config
          env:
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: fusion-ai-secrets
                  key: postgres-password
            - name: REDIS_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: fusion-ai-secrets
                  key: redis-password
          resources:
            requests:
              cpu: "0.5"
              memory: "512Mi"
            limits:
              cpu: "1"
              memory: "1Gi"
          livenessProbe:
            httpGet:
              path: /health
              port: 4000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 4000
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: fusion-ai
spec:
  selector:
    app: backend
  ports:
    - port: 80
      targetPort: 4000
  type: ClusterIP
```

```yaml
# kubernetes/fusion-ai/frontend.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: fusion-ai
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: frontend
          image: your-registry.com/fusion-ai/frontend:latest
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: fusion-ai-config
          resources:
            requests:
              cpu: "0.5"
              memory: "512Mi"
            limits:
              cpu: "1"
              memory: "1Gi"
          livenessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: fusion-ai
spec:
  selector:
    app: frontend
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
```

Create an ingress manifest:

```yaml
# kubernetes/fusion-ai/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: fusion-ai-ingress
  namespace: fusion-ai
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/rewrite-target: /$1
    nginx.ingress.kubernetes.io/use-regex: "true"
spec:
  rules:
    - host: fusion-ai.example.com
      http:
        paths:
          - path: /api(/|$)(.*)
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 80
          - path: /ws(/|$)(.*)
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 80
          - path: /monitoring(/|$)(.*)
            pathType: Prefix
            backend:
              service:
                name: monitoring
                port:
                  number: 80
          - path: /(.*)
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
```

### 4. Apply Kubernetes Manifests

```bash
# Apply the Kubernetes manifests
kubectl apply -f kubernetes/fusion-ai/namespace.yaml
kubectl apply -f kubernetes/fusion-ai/secrets.yaml
kubectl apply -f kubernetes/fusion-ai/configmap.yaml
kubectl apply -f kubernetes/fusion-ai/postgres.yaml
kubectl apply -f kubernetes/fusion-ai/redis.yaml
kubectl apply -f kubernetes/fusion-ai/backend.yaml
kubectl apply -f kubernetes/fusion-ai/frontend.yaml
kubectl apply -f kubernetes/fusion-ai/blockchain.yaml
kubectl apply -f kubernetes/fusion-ai/ai-agents.yaml
kubectl apply -f kubernetes/fusion-ai/monitoring.yaml
kubectl apply -f kubernetes/fusion-ai/ingress.yaml
```

### 5. Verify the Deployment

```bash
# Check the status of the pods
kubectl get pods -n fusion-ai

# Check the status of the services
kubectl get services -n fusion-ai

# Check the status of the ingress
kubectl get ingress -n fusion-ai
```

## Helm Deployment

### 1. Create Helm Chart

Create a Helm chart for the FusionAI Orchestrator Tool:

```bash
mkdir -p helm/fusion-ai
cd helm/fusion-ai
```

Create the chart structure:

```bash
mkdir -p templates
touch Chart.yaml
touch values.yaml
```

Edit the Chart.yaml file:

```yaml
# helm/fusion-ai/Chart.yaml
apiVersion: v2
name: fusion-ai
description: A Helm chart for the FusionAI Orchestrator Tool
type: application
version: 0.1.0
appVersion: "1.0.0"
```

Edit the values.yaml file:

```yaml
# helm/fusion-ai/values.yaml
# Global settings
global:
  environment: production
  imageRegistry: your-registry.com

# Database settings
postgres:
  enabled: true
  image:
    repository: postgres
    tag: 14
  persistence:
    enabled: true
    size: 10Gi
  resources:
    requests:
      cpu: 500m
      memory: 512Mi
    limits:
      cpu: 1000m
      memory: 1Gi
  credentials:
    username: postgres
    password: postgres

# Redis settings
redis:
  enabled: true
  image:
    repository: redis
    tag: 7
  persistence:
    enabled: true
    size: 5Gi
  resources:
    requests:
      cpu: 500m
      memory: 512Mi
    limits:
      cpu: 1000m
      memory: 1Gi

# Backend settings
backend:
  enabled: true
  image:
    repository: fusion-ai/backend
    tag: latest
  replicas: 2
  resources:
    requests:
      cpu: 500m
      memory: 512Mi
    limits:
      cpu: 1000m
      memory: 1Gi
  service:
    type: ClusterIP
    port: 80
    targetPort: 4000
```

### 2. Install the Helm Chart

```bash
# Install the Helm chart
helm install fusion-ai ./helm/fusion-ai --namespace fusion-ai --create-namespace
```

### 3. Verify the Deployment

```bash
# Check the status of the pods
kubectl get pods -n fusion-ai

# Check the status of the services
kubectl get services -n fusion-ai

# Check the status of the ingress
kubectl get ingress -n fusion-ai
```

## Monitoring and Scaling

### Monitoring

Kubernetes provides several monitoring options:

1. **Prometheus and Grafana**: For monitoring the health and performance of your Kubernetes cluster and applications
2. **Kubernetes Dashboard**: For a visual overview of your Kubernetes cluster
3. **ELK Stack**: For collecting and analyzing log data from your applications

To set up Prometheus and Grafana:

```bash
# Add the Prometheus Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts

# Install Prometheus
helm install prometheus prometheus-community/prometheus --namespace monitoring --create-namespace

# Add the Grafana Helm repository
helm repo add grafana https://grafana.github.io/helm-charts

# Install Grafana
helm install grafana grafana/grafana --namespace monitoring
```

### Scaling

Kubernetes provides several scaling options:

1. **Horizontal Pod Autoscaler (HPA)**: For automatically scaling the number of pods based on CPU or memory usage
2. **Vertical Pod Autoscaler (VPA)**: For automatically adjusting the CPU and memory requests and limits for pods
3. **Cluster Autoscaler**: For automatically scaling the number of nodes in the cluster

To set up Horizontal Pod Autoscaler:

```yaml
# kubernetes/fusion-ai/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: fusion-ai
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 80
```

Apply the HPA configuration:

```bash
kubectl apply -f kubernetes/fusion-ai/hpa.yaml
```

## Conclusion

By following this guide, you can deploy the FusionAI Orchestrator Tool to Kubernetes using either Manual Deployment or Helm Deployment. The deployment provides a scalable and reliable environment for running the tool.
