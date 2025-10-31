import { howItWorks } from "@/lib/data";
import { useId } from "react";

export function FeaturesGradient() {
  return (
    <div className="py-10 lg:py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10 md:gap-2 max-w-7xl mx-auto">
        {howItWorks.map((feature, index) => (
          <div
            key={feature.title}
            className="relative bg-gradient-to-b dark:from-neutral-900 from-neutral-100 dark:to-neutral-950 to-white p-6 rounded-3xl overflow-hidden"
          >
            <Grid size={20} gridIndex={index} />
            <p className="text-base font-bold text-neutral-800 dark:text-white relative z-20">
              {feature.title}
            </p>
            <p className="text-neutral-600 dark:text-neutral-400 mt-4 text-base font-normal relative z-20">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export const Grid = ({
  pattern,
  size,
  gridIndex = 0,
}: {
  pattern?: number[][];
  size?: number;
  gridIndex?: number;
}) => {
  // Use gridIndex to create stable, unique patterns for each grid
  const p = pattern ?? [
    [Math.floor((gridIndex * 7 + 1) % 4) + 7, Math.floor((gridIndex * 3 + 1) % 6) + 1],
    [Math.floor((gridIndex * 11 + 2) % 4) + 7, Math.floor((gridIndex * 5 + 2) % 6) + 1],
    [Math.floor((gridIndex * 13 + 3) % 4) + 7, Math.floor((gridIndex * 7 + 3) % 6) + 1],
    [Math.floor((gridIndex * 17 + 4) % 4) + 7, Math.floor((gridIndex * 9 + 4) % 6) + 1],
    [Math.floor((gridIndex * 19 + 5) % 4) + 7, Math.floor((gridIndex * 11 + 5) % 6) + 1],
  ];
  return (
    <div className="pointer-events-none absolute left-1/2 top-0  -ml-20 -mt-2 h-full w-full [mask-image:linear-gradient(white,transparent)]">
      <div className="absolute inset-0 bg-gradient-to-r  [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] dark:from-primary/30 from-primary/30 to-prifrom-primary/30 dark:to-prifrom-primary/30 opacity-100">
        <GridPattern
          width={size ?? 20}
          height={size ?? 20}
          x="-12"
          y="4"
          squares={p}
          gridIndex={gridIndex}
          className="absolute inset-0 h-full w-full  mix-blend-overlay dark:fill-primary/10 dark:stroke-primary/10 stroke-primary/10 fill-primary"
        />
      </div>
    </div>
  );
};

export function GridPattern({ width, height, x, y, squares, gridIndex = 0, ...props }: any) {
  const patternId = useId();

  return (
    <svg aria-hidden="true" {...props}>
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect
        width="100%"
        height="100%"
        strokeWidth={0}
        fill={`url(#${patternId})`}
      />
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([x, y]: any, index: number) => (
            <rect
              strokeWidth="0"
              key={`${gridIndex}-${x}-${y}-${index}`}
              width={width + 1}
              height={height + 1}
              x={x * width}
              y={y * height}
            />
          ))}
        </svg>
      )}
    </svg>
  );
}
