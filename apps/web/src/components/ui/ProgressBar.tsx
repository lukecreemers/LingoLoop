interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = (current / total) * 100;

  return (
    <div className="w-full flex items-center gap-4">
      <div className="flex-1 h-4 border-2 border-black bg-white p-[2px]">
        <div
          className="h-full bg-bauhaus-blue transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-sm font-bold font-mono">
        {current.toString().padStart(2, '0')} / {total.toString().padStart(2, '0')}
      </div>
    </div>
  );
}
