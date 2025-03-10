# Grafana Dashboards

This guide provides instructions for setting up and using Grafana dashboards to monitor the FusionAI Orchestrator Tool.

## Prerequisites

- Prometheus set up and configured (see [Prometheus Setup](./prometheus.md))
- Docker and Docker Compose (for local setup)
- Kubernetes (for Kubernetes setup)

## Local Setup with Docker Compose

### 1. Create Grafana Configuration

Create a `grafana.ini` file in the `monitoring` directory:

```ini
[auth]
disable_login_form = false

[auth.anonymous]
enabled = true
org_role = Viewer

[security]
allow_embedding = true
```

### 2. Update Docker Compose Configuration

Add Grafana to the `docker-compose.yml` file:

```yaml
services:
  # Existing services...

  grafana:
    image: grafana/grafana:9.3.2
    ports:
      - "3001:3000"
    volumes:
      - ./monitoring/grafana.ini:/etc/grafana/grafana.ini
      - ./monitoring/dashboards:/var/lib/grafana/dashboards
      - ./monitoring/provisioning:/etc/grafana/provisioning
      - grafana-data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    depends_on:
      - prometheus
    networks:
      - fusion-network

volumes:
  # Existing volumes...
  grafana-data:
```

### 3. Create Grafana Provisioning Configuration

Create the provisioning directories:

```bash
mkdir -p monitoring/provisioning/datasources
mkdir -p monitoring/provisioning/dashboards
mkdir -p monitoring/dashboards
```

Create a datasource configuration file:

```yaml
# monitoring/provisioning/datasources/prometheus.yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
```

Create a dashboard provisioning configuration file:

```yaml
# monitoring/provisioning/dashboards/default.yaml
apiVersion: 1

providers:
  - name: 'Default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    editable: true
    options:
      path: /var/lib/grafana/dashboards
```

### 4. Start Grafana

```bash
docker-compose up -d grafana
```

### 5. Access Grafana

Open a web browser and navigate to:

```
http://localhost:3001
```

Log in with the following credentials:

- Username: admin
- Password: admin

## Kubernetes Setup

### 1. Create Grafana ConfigMap

```yaml
# grafana-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-config
  namespace: monitoring
data:
  grafana.ini: |
    [auth]
    disable_login_form = false

    [auth.anonymous]
    enabled = true
    org_role = Viewer

    [security]
    allow_embedding = true
```

Apply the ConfigMap:

```bash
kubectl apply -f grafana-configmap.yaml
```

### 2. Create Grafana Deployment and Service

```yaml
# grafana-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
        - name: grafana
          image: grafana/grafana:9.3.2
          ports:
            - containerPort: 3000
          volumeMounts:
            - name: grafana-config
              mountPath: /etc/grafana/grafana.ini
              subPath: grafana.ini
            - name: grafana-data
              mountPath: /var/lib/grafana
          env:
            - name: GF_SECURITY_ADMIN_PASSWORD
              value: admin
            - name: GF_USERS_ALLOW_SIGN_UP
              value: "false"
          resources:
            requests:
              cpu: "0.5"
              memory: "512Mi"
            limits:
              cpu: "1"
              memory: "1Gi"
      volumes:
        - name: grafana-config
          configMap:
            name: grafana-config
        - name: grafana-data
          persistentVolumeClaim:
            claimName: grafana-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: grafana
  namespace: monitoring
spec:
  selector:
    app: grafana
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: grafana-pvc
  namespace: monitoring
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
```

Apply the deployment and service:

```bash
kubectl apply -f grafana-deployment.yaml
```

### 3. Create Ingress for Grafana

```yaml
# grafana-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: grafana-ingress
  namespace: monitoring
  annotations:
    kubernetes.io/ingress.class: nginx
spec:
  rules:
    - host: grafana.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: grafana
                port:
                  number: 80
```

Apply the ingress:

```bash
kubectl apply -f grafana-ingress.yaml
```

## Dashboard Examples

### System Overview Dashboard

This dashboard provides a high-level view of the FusionAI Orchestrator Tool:

- HTTP Request Rate: Shows the rate of HTTP requests by method and route
- HTTP Request Duration: Shows the 95th percentile of HTTP request durations by route
- Active Workflows: Shows the number of active workflows

### Blockchain Dashboard

This dashboard provides information about the blockchain networks:

- Block Number: Shows the current block number for each blockchain network
- Connected Peers: Shows the number of connected peers for each blockchain network
- Gas Price: Shows the gas price over time for each blockchain network

### AI Agents Dashboard

This dashboard provides information about the AI agents:

- Agent Execution Rate: Shows the rate of agent executions by agent and status
- Agent Execution Duration: Shows the 95th percentile of agent execution durations by agent
- Agent Confidence Score: Shows the confidence score for each agent

## Creating Custom Dashboards

You can create custom dashboards in Grafana to visualize specific metrics:

1. Click on "+" in the left sidebar
2. Click on "Dashboard"
3. Click on "Add new panel"
4. Select the visualization type
5. Configure the query using PromQL
6. Configure the visualization options
7. Click "Save"

## Sharing Dashboards

You can share dashboards with other users:

1. Open the dashboard
2. Click on the "Share" button in the top navigation bar
3. Copy the dashboard URL
4. Share the URL with other users

## Conclusion

By following this guide, you can set up and use Grafana dashboards to monitor the FusionAI Orchestrator Tool. Grafana provides a powerful platform for visualizing metrics, which can be used to monitor the health and performance of the system.
