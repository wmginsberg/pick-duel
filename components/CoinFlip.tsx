'use client';

import { useEffect, useState } from 'react';

interface CoinFlipProps {
  option1: string;
  option2: string;
  winner: string;
  onComplete?: () => void;
}

export default function CoinFlip({ option1, option2, winner, onComplete }: CoinFlipProps) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipCount, setFlipCount] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    // Start the flip animation after a short delay
    const timer = setTimeout(() => {
      setIsFlipping(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isFlipping) {
      // Simulate multiple flips before settling on the winner
      const flipInterval = setInterval(() => {
        setFlipCount(prev => {
          if (prev >= 8) { // 8 flips total
            clearInterval(flipInterval);
            setIsFlipping(false);
            setShowResult(true);
            // Call onComplete after showing result
            setTimeout(() => {
              onComplete?.();
            }, 2000);
            return prev;
          }
          return prev + 1;
        });
      }, 300); // Flip every 300ms

      return () => clearInterval(flipInterval);
    }
  }, [isFlipping, onComplete]);

  const isHeads = flipCount % 2 === 0;
  const currentOption = isHeads ? option1 : option2;
  const isWinner = currentOption === winner;

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          🪙 Random Winner Selection 🪙
        </h3>
        <p className="text-gray-600">
          {isFlipping ? 'Flipping the coin...' : showResult ? 'Winner selected!' : 'Preparing to flip...'}
        </p>
      </div>

      {/* Coin */}
      <div className="relative">
        <div 
          className={`
            w-32 h-32 rounded-full border-4 border-yellow-400 bg-gradient-to-br from-yellow-300 to-yellow-500
            shadow-lg flex items-center justify-center text-center transition-all duration-300
            ${isFlipping ? 'animate-bounce' : ''}
            ${showResult && isWinner ? 'animate-pulse scale-110' : ''}
          `}
          style={{
            transform: isFlipping ? `rotateY(${flipCount * 180}deg)` : 'rotateY(0deg)',
          }}
        >
          <div className="text-sm font-bold text-yellow-900 px-2">
            {currentOption}
          </div>
        </div>
        
        {/* Coin shadow */}
        <div className="w-32 h-4 bg-black opacity-20 rounded-full mt-2 transform scale-x-75"></div>
      </div>

      {/* Options display */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md">
        <div className={`
          p-4 rounded-lg border-2 text-center transition-all duration-300
          ${currentOption === option1 && isFlipping ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-gray-50'}
          ${showResult && option1 === winner ? 'border-green-400 bg-green-50 animate-pulse' : ''}
          ${showResult && option1 !== winner ? 'border-gray-300 bg-gray-100 opacity-50' : ''}
        `}>
          <div className="text-lg font-semibold text-gray-800">{option1}</div>
          <div className="text-xs text-gray-500 mt-1">Heads</div>
        </div>
        
        <div className={`
          p-4 rounded-lg border-2 text-center transition-all duration-300
          ${currentOption === option2 && isFlipping ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-gray-50'}
          ${showResult && option2 === winner ? 'border-green-400 bg-green-50 animate-pulse' : ''}
          ${showResult && option2 !== winner ? 'border-gray-300 bg-gray-100 opacity-50' : ''}
        `}>
          <div className="text-lg font-semibold text-gray-800">{option2}</div>
          <div className="text-xs text-gray-500 mt-1">Tails</div>
        </div>
      </div>

      {/* Flip counter */}
      {isFlipping && (
        <div className="text-center">
          <div className="text-sm text-gray-500">
            Flip {flipCount} of 8
          </div>
        </div>
      )}

      {/* Winner announcement */}
      {showResult && (
        <div className="text-center animate-fade-in">
          <div className="bg-green-100 border border-green-300 rounded-lg p-4">
            <h4 className="text-lg font-bold text-green-800 mb-2">
              🎉 Winner! 🎉
            </h4>
            <p className="text-green-700 font-semibold">
              {winner}
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 