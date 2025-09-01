import React from 'react';
import { Button } from '@/components/ui/button';
import { Timer, TimerOff } from 'lucide-react';
import type { TimerDuration } from '@/hooks/camera/useCameraTimer';

interface TimerControlsProps {
  duration: TimerDuration;
  isActive: boolean;
  countdown: number;
  onSetDuration: (duration: TimerDuration) => void;
}

const TimerControls: React.FC<TimerControlsProps> = ({
  duration,
  isActive,
  countdown,
  onSetDuration
}) => {
  const timers: TimerDuration[] = [0, 3, 10];

  if (isActive) {
    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="bg-black bg-opacity-75 text-white rounded-full w-24 h-24 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold">{countdown}</div>
            <div className="text-xs opacity-75">secondi</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex flex-col gap-2">
      {timers.map((timer) => (
        <Button
          key={timer}
          onClick={() => onSetDuration(timer)}
          variant="secondary"
          size="sm"
          className={`bg-black bg-opacity-50 border-white rounded-full w-10 h-10 p-0 ${
            duration === timer
              ? 'text-green-400 border-green-400'
              : 'text-white'
          }`}
        >
          {timer === 0 ? (
            <TimerOff className="h-4 w-4" />
          ) : (
            <div className="text-xs font-bold">{timer}s</div>
          )}
        </Button>
      ))}
    </div>
  );
};

export default TimerControls;