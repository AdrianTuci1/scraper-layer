import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { datesToDurationString, getPhasesTotalCost } from '@/lib/workflow/helper';
import {
  ExecutionPhaseStatus,
  WorkflowExecutionStatus,
} from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import {
  CalendarIcon,
  CircleDashedIcon,
  ClockIcon,
  CoinsIcon,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExecutionLog, ExecutionPhase } from '@/types/database';
import { useEffect, useState } from 'react';
import PhaseStatusBadge from './PhaseStatusBadge';
import ReactCountUpWrapper from '@/components/ReactCountUpWrapper';
import { useWorkflowExecutions } from '@/hooks/useApi';
import { useParams } from 'react-router-dom';

type Execution = {
  id: string;
  status: string;
  startedAt?: Date | null;
  completedAt?: Date | null;
  creditsConsumed?: number | null;
  phases: ExecutionPhase[];
};

function ExecutionViewer({ execution }: { execution: Execution }) {
  const { workflowId } = useParams<{ workflowId: string }>();
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  
  // Refetch executions periodically if running
  const { data: executions } = useWorkflowExecutions(workflowId || '', {
    refetchInterval: execution.status === WorkflowExecutionStatus.RUNNING ? 1000 : false,
  });

  // Get latest execution data
  const currentExecution = executions?.find((e: any) => e.id === execution.id) || execution;
  const phases = currentExecution.phases || [];

  const isRunning = currentExecution.status === WorkflowExecutionStatus.RUNNING;

  useEffect(() => {
    if (phases.length === 0) return;
    
    // If status is running auto select the running phase
    if (isRunning) {
      const phaseToSelect = [...phases].sort((a, b) =>
        (a.startedAt ? new Date(a.startedAt).getTime() : 0) >
        (b.startedAt ? new Date(b.startedAt).getTime() : 0)
          ? -1
          : 1
      )[0];
      setSelectedPhase(phaseToSelect.id);
      return;
    }
    // Auto selecting last run phase on reload
    const phaseToSelect = [...phases].sort((a, b) =>
      (a.completedAt ? new Date(a.completedAt).getTime() : 0) >
      (b.completedAt ? new Date(b.completedAt).getTime() : 0)
        ? -1
        : 1
    )[0];
    setSelectedPhase(phaseToSelect?.id || null);
  }, [phases, isRunning]);

  const duration = datesToDurationString(
    currentExecution.completedAt ? new Date(currentExecution.completedAt) : null,
    currentExecution.startedAt ? new Date(currentExecution.startedAt) : null
  );

  const creditsConsumed = getPhasesTotalCost(phases);

  const selectedPhaseData = phases.find((p: ExecutionPhase) => p.id === selectedPhase);
  const logs = selectedPhaseData?.logs || [];

  return (
    <div className="flex w-full h-full">
      <aside className="w-[440px] min-w-[440px] max-w-[440px] border-r-2 border-separate flex flex-grow flex-col overflow-hidden">
        <div className="py-4 px-2">
          <ExecutionLabel
            icon={CircleDashedIcon}
            label="Status"
            value={
              <Badge
                variant={
                  currentExecution.status === WorkflowExecutionStatus.COMPLETED
                    ? 'default'
                    : currentExecution.status === WorkflowExecutionStatus.FAILED
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {currentExecution.status}
              </Badge>
            }
          />
          <ExecutionLabel
            icon={CalendarIcon}
            label="Started At"
            value={
              currentExecution.startedAt
                ? formatDistanceToNow(new Date(currentExecution.startedAt), {
                    addSuffix: true,
                  })
                : '-'
            }
          />
          <ExecutionLabel
            icon={ClockIcon}
            label="Duration"
            value={duration || '-'}
          />
          <ExecutionLabel
            icon={CoinsIcon}
            label="Credits Consumed"
            value={<ReactCountUpWrapper value={creditsConsumed} />}
          />
        </div>
        <Separator />
        <div className="flex-1 overflow-auto py-4 px-2">
          <div className="flex flex-col gap-2">
            {phases.map((phase: ExecutionPhase) => (
              <Card
                key={phase.id}
                className={cn(
                  'cursor-pointer',
                  selectedPhase === phase.id && 'border-primary'
                )}
                onClick={() => setSelectedPhase(phase.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PhaseStatusBadge status={phase.status as ExecutionPhaseStatus} />
                      <span>{phase.name}</span>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Phase {phase.number}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-4">
        {selectedPhaseData ? (
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>{selectedPhaseData.name}</CardTitle>
                <CardDescription>
                  Phase {selectedPhaseData.number} - {selectedPhaseData.status}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Inputs</h4>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                      {selectedPhaseData.inputs
                        ? JSON.stringify(JSON.parse(selectedPhaseData.inputs), null, 2)
                        : 'No inputs'}
                    </pre>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Outputs</h4>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                      {selectedPhaseData.outputs
                        ? JSON.stringify(JSON.parse(selectedPhaseData.outputs), null, 2)
                        : 'No outputs'}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {logs.length > 0 ? (
                    logs.map((log: ExecutionLog) => (
                      <div
                        key={log.id}
                        className={cn(
                          'text-xs p-2 rounded',
                          log.logLevel === 'error'
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-muted'
                        )}
                      >
                        <span className="text-muted-foreground">
                          {typeof log.timestamp === 'string'
                            ? new Date(log.timestamp).toLocaleString()
                            : log.timestamp.toLocaleString()}
                        </span>{' '}
                        {log.message}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No logs</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Select a phase to view details</p>
          </div>
        )}
      </main>
    </div>
  );
}

function ExecutionLabel({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon size={16} className="text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

export default ExecutionViewer;
