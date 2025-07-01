'use client';

import { useGameStore } from '@/store/useGameStore';
import { getCurrentPlayerTurn, getAvailableOptionsForElimination, getEliminationStepDescription } from '@/lib/gameLogic';
import PlayerCard from './PlayerCard';
import { useEffect, useState } from 'react';

export default function EliminationStage() {
  const { room, user, eliminateOption, acknowledgeEliminationReveal, loading } = useGameStore();
  const [flashOption, setFlashOption] = useState<string | null>(null);

  useEffect(() => {
    if (room && room.revealElimination?.option) {
      setFlashOption(room.revealElimination.option);
      const timeout = setTimeout(() => {
        setFlashOption(null);
      }, 700); // flash for 700ms
      return () => clearTimeout(timeout);
    }
  }, [room?.revealElimination?.option]);

  if (!room || !user) return null;

  const currentPlayerTurn = getCurrentPlayerTurn(room);
  const isMyTurn = currentPlayerTurn === user.uid;
  const availableOptions = getAvailableOptionsForElimination(room, currentPlayerTurn || '');
  const stepDescription = getEliminationStepDescription(room.eliminationStep);

  const handleEliminate = async (option: string) => {
    if (!isMyTurn || loading) return;
    await eliminateOption(option);
  };

  const handleAcknowledge = async () => {
    if (loading) return;
    await acknowledgeEliminationReveal();
  };

  const player1Id = room.createdBy;
  const player2Id = Object.keys(room.players).find(id => id !== player1Id) || '';
  const player1 = room.players[player1Id];
  const player2 = room.players[player2Id];

  // Check if there's a pending elimination reveal that needs acknowledgment
  const hasPendingReveal = room.revealElimination && !room.eliminationAck?.[user.uid];
  const bothAcknowledged = room.eliminationAck && Object.values(room.eliminationAck).every(Boolean);
  const hasAnyPendingReveal = room.revealElimination && !bothAcknowledged;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Progress Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Elimination Phase
        </h2>
        <p className="text-gray-600 mb-4">{stepDescription}</p>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(room.eliminationStep / 4) * 100}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-500">
          Step {room.eliminationStep} of 4
        </p>
      </div>

      {/* Players */}
      <div className="grid grid-cols-2 gap-4">
        <PlayerCard
          player={player1}
          label={`${player1.displayName.split(' ')[0]} – Player 1`}
          isCurrent={currentPlayerTurn === player1Id}
          isSelf={user?.uid === player1Id}
          options={player1.options}
          eliminated={player1.eliminated}
          onEliminate={handleEliminate}
          disabled={currentPlayerTurn !== player1Id || user?.uid !== player1Id}
          eliminationAck={undefined}
          revealElimination={undefined}
          flashOption={flashOption}
          category={room.category}
          playerNumber={1}
        />
        {player2 ? (
          <PlayerCard
            player={player2}
            label={`${player2.displayName.split(' ')[0]} – Player 2`}
            isCurrent={currentPlayerTurn === player2Id}
            isSelf={user?.uid === player2Id}
            options={player2.options}
            eliminated={player2.eliminated}
            onEliminate={handleEliminate}
            disabled={currentPlayerTurn !== player2Id || user?.uid !== player2Id}
            eliminationAck={undefined}
            revealElimination={undefined}
            flashOption={flashOption}
            category={room.category}
            playerNumber={2}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[120px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 text-gray-400">
            <span className="text-lg font-semibold mb-2">Waiting for Player 2...</span>
            <span className="text-xs">Share the room link to invite a friend!</span>
          </div>
        )}
      </div>

      {/* Elimination Interface */}
      {isMyTurn && !hasAnyPendingReveal && player2 && player2.options.length === 3 && (
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-primary-500">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
            Choose an option to eliminate:
          </h3>
          <div className="grid gap-3">
            {(() => {
              // Determine whose options are being eliminated this step
              let targetPlayer;
              if (room.eliminationStep === 1) targetPlayer = player2;
              else if (room.eliminationStep === 2) targetPlayer = player1;
              else if (room.eliminationStep === 3) targetPlayer = player1;
              else if (room.eliminationStep === 4) targetPlayer = player2;
              else targetPlayer = null;
              if (!targetPlayer) return null;
              return targetPlayer.options.map((option) => {
                const isEliminated = targetPlayer.eliminated.includes(option);
                const isFlashing = flashOption === option;
                return (
                  <button
                    key={option}
                    onClick={() => handleEliminate(option)}
                    disabled={loading || isEliminated}
                    className={`
                      p-4 rounded-lg border-2 transition-all duration-200
                      ${isFlashing ? 'bg-yellow-200 border-yellow-400 animate-flash' : ''}
                      ${isEliminated && !isFlashing
                        ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed line-through'
                        : !isEliminated && !isFlashing
                        ? 'bg-red-50 border-red-300 hover:bg-red-100 hover:border-red-400 text-red-700 font-medium hover:scale-105 hover:shadow-lg'
                        : ''
                      }
                    `}
                  >
                    {option}
                  </button>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Waiting Message */}
      {!isMyTurn && (
        <div className="text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="animate-pulse text-blue-600">
              Waiting for {room.players[currentPlayerTurn || '']?.displayName?.split(' ')[0] || 'other player'} to make their choice...
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="text-gray-600 mt-2">Processing...</p>
        </div>
      )}

      {/* Elimination Reveal Acknowledgment */}
      {hasPendingReveal && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">
            Elimination Revealed!
          </h3>
          <p className="text-yellow-700 mb-4">
            <strong>{room.players[room.revealElimination!.by]?.displayName}</strong> eliminated: <strong>{room.revealElimination!.option}</strong>
          </p>
          <button
            onClick={handleAcknowledge}
            disabled={loading}
            className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Acknowledge'}
          </button>
        </div>
      )}

      {/* Waiting for other player to acknowledge */}
      {room.revealElimination && !hasPendingReveal && !bothAcknowledged && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <div className="animate-pulse text-blue-600">
            Waiting for other player to acknowledge the elimination...
          </div>
        </div>
      )}
    </div>
  );
} 