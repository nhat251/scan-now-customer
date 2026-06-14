type ReportDonutChartProps = {
  value: number;
  label: string;
  caption: string;
  color: string;
};

export const ReportDonutChart = ({ value, label, caption, color }: ReportDonutChartProps) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className="relative mx-auto size-28">
      <svg viewBox="0 0 120 120" className="size-28 -rotate-90">
        <circle cx="60" cy="60" r={radius} className="stroke-muted fill-none" strokeWidth="14" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          className="fill-none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-lg font-black">{label}</p>
        <p className="text-muted-foreground text-[11px] font-semibold">{caption}</p>
      </div>
    </div>
  );
};
