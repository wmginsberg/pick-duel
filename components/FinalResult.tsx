'use client';

import { useEffect, useState } from 'react';
// @ts-ignore
import confetti from 'canvas-confetti';
import { useGameStore } from '@/store/useGameStore';
import PlayerCard from './PlayerCard';
import CoinFlip from './CoinFlip';

export default function FinalResult() {
  const { room, user, resetGame, createRoom } = useGameStore();
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCoinFlip, setShowCoinFlip] = useState(false);
  
  if (!room || !user) return null;

  useEffect(() => {
    if (room.winner && !showConfetti) {
      setShowConfetti(true);
      
      // Show coin flip for random winners
      if (room.randomWinner) {
        setShowCoinFlip(true);
      } else {
        // Trigger confetti animation for non-random winners
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
  }, [room.winner, showConfetti, room.randomWinner]);

  const handlePlayAgain = async () => {
    try {
      const newRoomId = await createRoom(room.category);
      // Redirect to new room
      window.location.href = `/rooms/${newRoomId}`;
    } catch (error) {
      console.error('Failed to create new room:', error);
    }
  };

  const handleNewRoom = () => {
    resetGame();
    window.location.href = '/';
  };

  const playerIds = Object.keys(room.players);
  const [player1Id, player2Id] = playerIds;
  const player1 = room.players[player1Id];
  const player2 = room.players[player2Id];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Coin Flip Animation for Random Winners */}
      {showCoinFlip && room.randomWinner && room.winner && (
        <CoinFlip
          option1={room.finalOptions[0]}
          option2={room.finalOptions[1]}
          winner={room.winner}
          onComplete={() => {
            setShowCoinFlip(false);
            // Trigger confetti after coin flip completes
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
          }}
        />
      )}

      {/* Winner Announcement */}
      {(!showCoinFlip || !room.randomWinner) && (
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎉 Winner! 🎉
          </h1>
          
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-8 shadow-2xl border-4 border-yellow-300">
            <h2 className="text-3xl font-bold text-white mb-2">
              {room.winner}
            </h2>
            <p className="text-yellow-100 text-lg">
              is your final choice!
            </p>
          </div>
        </div>
      )}

      {/* Game Summary */}
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
          Game Summary
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Final Options:</h4>
            <div className="space-y-2">
              {room.finalOptions.map((option, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    option === room.winner
                      ? 'bg-green-100 text-green-700 border-2 border-green-300'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {option}
                  {option === room.winner && <span className="ml-2">👑</span>}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Votes:</h4>
            <div className="space-y-2">
              {Object.entries(room.players).map(([playerId, player]) => (
                <div key={playerId} className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {player.displayName}:
                  </span>
                  <span className="font-medium text-blue-600">
                    {player.vote}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Players */}
      <div className="grid md:grid-cols-2 gap-6">
        <PlayerCard
          player={player1}
          label={`${player1.displayName.split(' ')[0]} – Player 1`}
          isCurrent={false}
          isSelf={player1Id === user.uid}
          options={player1.options}
          eliminated={player1.eliminated}
          category={room.category}
          playerNumber={1}
        />
        <PlayerCard
          player={player2}
          label={`${player2.displayName.split(' ')[0]} – Player 2`}
          isCurrent={false}
          isSelf={player2Id === user.uid}
          options={player2.options}
          eliminated={player2.eliminated}
          category={room.category}
          playerNumber={2}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={handlePlayAgain}
          className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          Play Again
        </button>
        
        <button
          onClick={handleNewRoom}
          className="px-8 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          New Room
        </button>
      </div>

      {/* Share Result */}
      <div className="text-center">
        <p className="text-gray-600 mb-2">Share this result:</p>
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => {
              navigator.share?.({
                title: 'Pick Duel Result',
                text: `We chose: ${room.winner}! Play Pick Duel at ${window.location.origin}`,
              }).catch(() => {
                // Fallback to copying to clipboard
                navigator.clipboard.writeText(`We chose: ${room.winner}! Play Pick Duel at ${window.location.origin}`);
              });
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors duration-200"
          >
            Share Result
          </button>
        </div>
      </div>
    </div>
  );
} 