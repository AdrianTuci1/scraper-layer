import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Period } from '@/lib/types';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { getWorkflowExecutionsStats, getStatsCardsValue } from '@/actions/analytics';
import PeriodSelector from './components/PeriodSelector';
import StatsCard from './components/StatsCard';
import ExecutionStatusChart from './components/ExecutionStatusChart';
import { CirclePlayIcon, CoinsIcon, WaypointsIcon } from 'lucide-react';

function HomePage() {
  const [searchParams] = useSearchParams();
  const { getToken } = useAuth();
  const currDate = new Date();
  
  const month = searchParams.get('month');
  const year = searchParams.get('year');

  const period: Period = {
    month: month ? parseInt(month, 10) : currDate.getMonth(),
    year: year ? parseInt(year, 10) : currDate.getFullYear(),
  };

  // Generate periods for the last 12 months
  const periods: Period[] = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date(currDate.getFullYear(), currDate.getMonth() - i, 1);
    periods.push({
      month: date.getMonth(),
      year: date.getFullYear(),
    });
  }

  // Ensure selected period exists in periods list
  const selectedPeriodExists = periods.some(
    (p) => p.month === period.month && p.year === period.year
  );
  const finalPeriod = selectedPeriodExists ? period : periods[0] || period;

  // Fetch stats cards data
  const { data: stats = { WorkflowExecutions: 0, creditsConsumed: 0, phaseExecutions: 0 } } = useQuery({
    queryKey: ['stats', finalPeriod.month, finalPeriod.year],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Unauthenticated');
      return getStatsCardsValue(finalPeriod);
    },
  });

  // Fetch execution stats chart data
  const { data: executionStats = [] } = useQuery({
    queryKey: ['executionStats', finalPeriod.month, finalPeriod.year],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Unauthenticated');
      return getWorkflowExecutionsStats(finalPeriod);
    },
  });

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Home</h1>
        <PeriodSelector periods={periods} selectedPeriod={finalPeriod} />
      </div>
      <div className="flex flex-col gap-5">
        <div className="grid gap-3 lg:gap-8 lg:grid-cols-3 min-h-[120px]">
          <StatsCard 
            title="Workflow Executions" 
            value={stats.WorkflowExecutions} 
            icon={CirclePlayIcon} 
          />
          <StatsCard 
            title="Phase Executions" 
            value={stats.phaseExecutions} 
            icon={WaypointsIcon} 
          />
          <StatsCard 
            title="Credits Consumed" 
            value={stats.creditsConsumed} 
            icon={CoinsIcon} 
          />
        </div>
        <Suspense fallback={<Skeleton className="w-full h-[300px]" />}>
          <ExecutionStatusChart data={executionStats} />
        </Suspense>
      </div>
    </div>
  );
}

export default HomePage;

