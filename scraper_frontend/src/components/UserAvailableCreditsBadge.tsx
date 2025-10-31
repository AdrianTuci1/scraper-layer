import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Coins, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Fragment } from 'react';
import { useAuth } from '@clerk/clerk-react';
import ReactCountUpWrapper from './ReactCountUpWrapper';
import { buttonVariants } from './ui/button';

function UserAvailableCreditsBadge() {
  const { getToken } = useAuth();

  const query = useQuery({
    queryKey: ['userAvailableCredits'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) return -1;
      return api.billing.getCredits(token);
    },
    refetchInterval: 30 * 1000,
  });

  return (
    <Link
      to="/dashboard/billing"
      className={cn(
        'w-full space-x-2 items-center',
        buttonVariants({
          variant: 'outline',
        })
      )}
    >
      <Coins size={20} className="text-primary" />
      <span className="font-semibold capitalize">
        {query.isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {!query.isLoading && query.data !== undefined && (
          <ReactCountUpWrapper value={query.data} />
        )}
        {!query.isLoading && query.data === undefined && '-'}
      </span>
    </Link>
  );
}

export default UserAvailableCreditsBadge;
