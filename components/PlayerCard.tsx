'use client';

import { Player } from '@/types';
import { getCategoryEmoji } from '@/lib/gameLogic';

interface PlayerCardProps {
  player: Player;
  label: string;
  isCurrent: boolean;
  isSelf: boolean;
  options: string[];
  eliminated: string[];
  onEliminate?: (option: string) => void;
  disabled?: boolean;
  eliminationAck?: any;
  revealElimination?: any;
  flashOption?: string | null;
  category?: string;
  playerNumber?: number;
}

export default function PlayerCard({ 
  player, 
  label,
  isCurrent, 
  isSelf,
  options,
  eliminated,
  onEliminate,
  disabled = false,
  eliminationAck,
  revealElimination,
  flashOption,
  category = 'custom',
  playerNumber = 1
}: PlayerCardProps) {
  const emoji = getCategoryEmoji(category, playerNumber);
  
  return (
    <div className={`
      bg-white rounded-lg p-4 shadow-md border-2 transition-all duration-200
      ${isCurrent ? 'border-primary-500' : 'border-gray-200'}
      ${isCurrent ? 'animate-pulse-glow' : ''}
      ${disabled ? 'opacity-60' : ''}
    `}>
      <div className="flex items-center space-x-3 mb-3">
        <div className="relative">
          <div className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-gray-200 text-lg bg-gray-100">
            {emoji}
          </div>
          {isSelf && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full border border-white"></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-800 text-sm truncate">
            {label}
            {isSelf && <span className="text-primary-600 ml-1">(You)</span>}
          </h3>
          <p className="text-xs text-gray-500">
            {isCurrent ? 'Your turn' : 'Waiting...'}
          </p>
        </div>
      </div>

      {/* Options display */}
      {options.length > 0 && (
        <div className="space-y-1">
          {options.map((option, index) => {
            const isEliminated = eliminated.includes(option);
            const isFlashing = flashOption === option;
            return (
              <div
                key={index}
                className={`
                  px-2 py-1 rounded text-xs transition-all duration-300
                  ${isFlashing ? 'bg-yellow-200 border-yellow-400 animate-flash' : ''}
                  ${isEliminated && !isFlashing
                    ? 'bg-gray-100 text-gray-500 line-through'
                    : !isEliminated && !isFlashing
                    ? 'bg-green-100 text-green-700'
                    : ''
                  }
                `}
              >
                {option}
              </div>
            );
          })}
        </div>
      )}

      {player.vote && (
        <div className="mt-3 p-2 bg-blue-100 rounded text-xs">
          <p className="font-medium text-blue-800">Voted for:</p>
          <p className="text-blue-700">{player.vote}</p>
        </div>
      )}
    </div>
  );
} 