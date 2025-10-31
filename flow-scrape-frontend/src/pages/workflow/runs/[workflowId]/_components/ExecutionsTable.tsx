import { useWorkflowExecutions } from '@/hooks/useApi';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { datesToDurationString } from '@/lib/workflow/helper';
import { Badge } from '@/components/ui/badge';
import ExecutionStatusIndicator from './ExecutionStatusIndicator';
import { WorkflowExecutionStatus } from '@/lib/types';
import { CoinsIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

function ExecutionsTable({
  workflowId,
}: {
  workflowId: string;
}) {
  const { data: executions, isLoading } = useWorkflowExecutions(workflowId);
  const navigate = useNavigate();

  if (isLoading) {
    return <Skeleton className="w-full h-[400px]" />;
  }

  if (!executions || executions.length === 0) {
    return (
      <div className="border rounded-lg shadow-md p-8 text-center text-muted-foreground">
        No executions yet
      </div>
    );
  }

  return (
    <div className="border rounded-lg shadow-md overflow-auto ">
      <Table className="h-full">
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead>Id</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Consumed</TableHead>
            <TableHead className="text-right text-sm text-muted-foreground">
              Started at
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="gap-2 h-full overflow-auto">
          {executions.map((execution: any) => {
            const duration = datesToDurationString(
              execution.completedAt ? new Date(execution.completedAt) : null,
              execution.startedAt ? new Date(execution.startedAt) : null
            );

            const formattedStartedAt =
              execution.startedAt &&
              formatDistanceToNow(new Date(execution.startedAt), {
                addSuffix: true,
              });

            return (
              <TableRow
                key={execution.id}
                className="cursor-pointer"
                onClick={() => {
                  navigate(
                    `/dashboard/workflow/runs/${execution.workflowId}/${execution.id}`
                  );
                }}
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold">{execution.id}</span>
                    <div className="text-muted-foreground text-xs flex gap-1 items-center">
                      <span className="">Triggered via</span>
                      <Badge variant={'outline'}>{execution.trigger}</Badge>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex gap-2 items-center">
                      <ExecutionStatusIndicator
                        status={execution.status as WorkflowExecutionStatus}
                      />
                      <span className="font-semibold capitalize">
                        {execution.status}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-xs mx-5">
                      {duration}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex gap-2 items-center">
                      <CoinsIcon size={16} className="text-primary" />
                      <span className="font-semibold capitalize">
                        {execution.creditsConsumed || 0}
                      </span>
                    </div>
                    <div className="text-muted-foreground text-xs mx-5">
                      Credits
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right text-muted-foreground capitalize first:uppercase">
                  {formattedStartedAt}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default ExecutionsTable;
