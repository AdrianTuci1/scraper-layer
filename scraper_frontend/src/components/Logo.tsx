import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

function Logo({
  fontSize = '2xl',
  iconSize = 32,
}: {
  fontSize?: string;
  iconSize?: number;
}) {
  return (
    <Link
      className={cn(
        'text-2xl font-extrabold flex items-center gap-2',
        fontSize
      )}
      to="/"
    >
      <img 
        src="/Document.png" 
        alt="Scraperlayer Logo" 
        className="h-8 w-8"
        style={{ height: `${iconSize}px`, width: `${iconSize}px` }}
      />
      <div>
        <span className="bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
          Flow
        </span>
        <span className="text-stone-700 dark:text-stone-300">Scrape</span>
      </div>
    </Link>
  );
}

export default Logo;
