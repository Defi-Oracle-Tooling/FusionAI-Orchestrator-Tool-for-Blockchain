import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  CircularProgress,
  Grid,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { useBlockchainNodeWebSocket } from '../../hooks/useBlockchainNodeWebSocket';
import { useWorkflowWebSocket } from '../../hooks/useWorkflowWebSocket';
import NetworkStatusIndicator from '../../components/animations/NetworkStatusIndicator';
import AnimatedProgressBar from '../../components/animations/AnimatedProgressBar';
import AnimatedCounter from '../../components/animations/AnimatedCounter';
import DataFlowAnimation from '../../components/animations/DataFlowAnimation';

interface MonitoringPanelProps {
  workflowId?: string;
  nodeId?: string;
}

export const MonitoringPanel: React.FC<MonitoringPanelProps> = ({
  workflowId,
  nodeId,
}) => {
  const [metrics, setMetrics] = useState<any>({});
  const [alerts, setAlerts] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { nodeStatus } = useBlockchainNodeWebSocket(nodeId);
  const { workflowStatus } = useWorkflowWebSocket(workflowId);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/metrics');
        const data = await response.json();
        setMetrics(data);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Error fetching metrics:', error);
      }
    };

    const fetchAlerts = async () => {
      try {
        const response = await fetch('/api/alerts');
        const data = await response.json();
        setAlerts(data);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      }
    };

    fetchMetrics();
    fetchAlerts();

    const metricsInterval = setInterval(fetchMetrics, 15000);
    const alertsInterval = setInterval(fetchAlerts, 30000);

    return () => {
      clearInterval(metricsInterval);
      clearInterval(alertsInterval);
    };
  }, []);

  // Map status to NetworkStatusIndicator status
  const mapStatusToIndicator = (status: string): 'healthy' | 'degraded' | 'unhealthy' => {
    switch (status) {
      case 'healthy':
        return 'healthy';
      case 'degraded':
      case 'warning':
        return 'degraded';
      case 'unhealthy':
      case 'error':
        return 'unhealthy';
      default:
        return 'degraded';
    }
  };

  const getHealthStatus = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon color="success" />;
      case 'degraded':
        return <WarningIcon color="warning" />;
      case 'unhealthy':
        return <ErrorIcon color="error" />;
      default:
        return <CircularProgress size={20} />;
    }
  };

  const handleRefresh = () => {
    setLastUpdated(new Date());
    // Trigger immediate metrics update
    fetch('/api/metrics')
      .then(response => response.json())
      .then(data => setMetrics(data))
      .catch(error => console.error('Error refreshing metrics:', error));
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Monitoring Dashboard</Typography>
        <Box>
          <Tooltip title="Last updated">
            <Typography variant="caption" sx={{ mr: 2 }}>
              {lastUpdated.toLocaleTimeString()}
            </Typography>
          </Tooltip>
          <IconButton onClick={handleRefresh} size="small">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={2}>
        {/* Blockchain Metrics */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2, position: 'relative', overflow: 'hidden' }}>
            <Typography variant="h6" gutterBottom>
              Blockchain Status
              {nodeStatus && (
                <Box component="span" sx={{ ml: 1, display: 'inline-flex', alignItems: 'center' }}>
                  <NetworkStatusIndicator 
                    status={mapStatusToIndicator(nodeStatus.status)} 
                    size="sm" 
                    label={nodeStatus.status}
                  />
                </Box>
              )}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Gas Price</Typography>
                <Typography>
                  <AnimatedCounter 
                    value={metrics.gasPrice || 0} 
                    suffix=" Gwei"
                    size="sm"
                    color="primary"
                  />
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Block Time</Typography>
                <Typography>
                  <AnimatedCounter 
                    value={metrics.blockTime || 0} 
                    suffix=" seconds"
                    size="sm"
                    color="primary"
                  />
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Peer Count</Typography>
                <Typography>
                  <AnimatedCounter 
                    value={metrics.peerCount || 0}
                    size="sm"
                    color="primary"
                  />
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Transaction Load</Typography>
                <Typography>{metrics.transactionStatus || 'N/A'}</Typography>
              </Grid>
            </Grid>
            
            {/* Data flow animation in the background */}
            <Box sx={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40px', opacity: 0.2, pointerEvents: 'none' }}>
              <DataFlowAnimation 
                width={300}
                height={40}
                color="#3b82f6"
                speed="slow"
                density="low"
                direction="left-to-right"
              />
            </Box>
          </Card>
        </Grid>

        {/* Workflow Metrics */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Workflow Status
              {workflowStatus && (
                <Box component="span" sx={{ ml: 1, display: 'inline-flex', alignItems: 'center' }}>
                  <AnimatedProgressBar 
                    value={workflowStatus.progress || 0}
                    maxValue={100}
                    height={8}
                    width="80px"
                    color="primary"
                    showValue={true}
                    valueFormat="percentage"
                    animated={true}
                  />
                </Box>
              )}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Active Steps</Typography>
                <Typography>
                  <AnimatedCounter 
                    value={workflowStatus?.activeSteps || 0}
                    size="sm"
                    color="secondary"
                  />
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Completed Steps</Typography>
                <Typography>
                  <AnimatedCounter 
                    value={workflowStatus?.completedSteps || 0}
                    size="sm"
                    color="success"
                  />
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Time Remaining</Typography>
                <Typography>
                  {workflowStatus?.timeRemaining ? (
                    <AnimatedCounter 
                      value={Math.round(workflowStatus.timeRemaining / 60)}
                      suffix=" min"
                      size="sm"
                      color="warning"
                    />
                  ) : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Status</Typography>
                <Typography>{workflowStatus?.status || 'N/A'}</Typography>
              </Grid>
              
              {/* Progress bar for overall workflow */}
              {workflowStatus && (
                <Grid item xs={12} sx={{ mt: 1 }}>
                  <AnimatedProgressBar 
                    value={workflowStatus.progress || 0}
                    maxValue={100}
                    height={10}
                    color="primary"
                    showValue={false}
                    animated={true}
                    striped={true}
                    label="Overall Progress"
                  />
                </Grid>
              )}
            </Grid>
          </Card>
        </Grid>

        {/* Alerts Timeline */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Alerts
            </Typography>
            {alerts.length > 0 ? (
              <Timeline>
                {alerts.map((alert, index) => (
                  <TimelineItem key={index}>
                    <TimelineSeparator>
                      <TimelineDot
                        color={
                          alert.severity === 'critical'
                            ? 'error'
                            : alert.severity === 'warning'
                            ? 'warning'
                            : 'info'
                        }
                      />
                      {index < alerts.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <NetworkStatusIndicator 
                          status={
                            alert.severity === 'critical' 
                              ? 'unhealthy' 
                              : alert.severity === 'warning' 
                              ? 'degraded' 
                              : 'healthy'
                          }
                          size="sm"
                          showLabel={false}
                          pulseEffect={alert.severity === 'critical'}
                        />
                        <Typography variant="subtitle2" sx={{ ml: 1 }}>{alert.summary}</Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        {new Date(alert.timestamp).toLocaleString()}
                      </Typography>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            ) : (
              <Alert severity="info">No active alerts</Alert>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
