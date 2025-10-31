import type { Period } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MONTH_NAME } from '@/lib/data';
import { useNavigate, useSearchParams } from 'react-router-dom';

function PeriodSelector({
  periods,
  selectedPeriod,
}: {
  periods: Period[];
  selectedPeriod: Period;
}) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Check if selected period exists in periods list
  const selectedValue = `${selectedPeriod.month}-${selectedPeriod.year}`;
  const valueExists = periods.some(
    (p) => `${p.month}-${p.year}` === selectedValue
  );

  return (
    <Select
      value={valueExists ? selectedValue : undefined}
      onValueChange={(value) => {
        const [month, year] = value.split('-');
        const params = new URLSearchParams(searchParams.toString());
        params.set('month', month);
        params.set('year', year);
        navigate(`?${params.toString()}`, { replace: true });
      }}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {periods.map((period, index) => (
          <SelectItem key={index} value={`${period.month}-${period.year}`}>
            {`${MONTH_NAME[period.month]} ${period.year}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default PeriodSelector;
