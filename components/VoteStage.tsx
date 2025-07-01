'use client';

import { useGameStore } from '@/store/useGameStore';
import { getCategoryEmoji } from '@/lib/gameLogic';
import PlayerCard from './PlayerCard';

export default function VoteStage() {
  const { room, user, vote, loading } = useGameStore();
  
  if (!room || !user) return null;

  const currentPlayer = room.players[user.uid];
  const hasVoted = currentPlayer?.vote !== null;
  const voteRound = room.voteRound || 1;
  const isRevote = voteRound > 1;
  const isRandomWinner = !!room.randomWinner;
  const votingTurn = room.votingTurn;
  const isMyTurn = votingTurn === user.uid;

  const player1Id = room.createdBy;
  const player2Id = Object.keys(room.players).find(id => id !== player1Id) || '';
  const player1 = room.players[player1Id];
  const player2 = room.players[player2Id];

  // Find the final options and which player they belong to
  const finalOptions = room.finalOptions;
  // Map final options to playerId
  const optionToPlayerId: Record<string, string> = {};
  for (const pid of Object.keys(room.players)) {
    const player = room.players[pid];
    const remaining = player.options.filter(opt => !player.eliminated.includes(opt));
    if (remaining.length === 1) {
      optionToPlayerId[remaining[0]] = pid;
    }
  }

  // Voting logic
  const isFinalRound = finalOptions.length === 2;
  const bothVoted = Object.values(room.players).every(player => player.vote !== null);

  // Determine if current player can vote
  const canVoteNow = isFinalRound
    ? !hasVoted // Final round: can vote if haven't voted yet
    : isMyTurn && !hasVoted; // Intermediate rounds: turn-based

  const handleVote = async (option: string) => {
    if (hasVoted || loading) return;
    await vote(option);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {isFinalRound ? 'Final Vote' : 'Vote'}
        </h2>
        <p className="text-gray-600">
          {isFinalRound 
            ? 'Vote for your favorite from the two remaining options below'
            : 'Vote for your favorite option'
          }
        </p>
        <div className="mt-2 text-sm text-blue-700">
          {isFinalRound 
            ? 'Simultaneous voting - both players vote at the same time!'
            : (isRevote ? 'Revote: You disagreed! Try again.' : 'First vote')
          }
        </div>
      </div>

      {/* Voting on PlayerCard panels */}
      <div className="grid md:grid-cols-2 gap-6">
        {finalOptions.map((option, idx) => {
          const pid = optionToPlayerId[option];
          const player = room.players[pid];
          const labelNum = pid === player1Id ? 'Player 1' : 'Player 2';
          const firstName = player.displayName.split(' ')[0];
          const label = `${firstName} – ${labelNum}`;
          // In final round, hide votes until both have submitted
          const showVote = isFinalRound ? bothVoted : true;
          const isSelected = showVote && currentPlayer?.vote === option;
          
          return (
            <div key={pid} className="flex flex-col items-center">
              <span className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
              <div 
                className={`
                  w-full bg-white rounded-xl p-6 shadow-lg border-2 transition-all duration-200 cursor-pointer
                  ${isSelected ? 'border-green-500 bg-green-50' : 'border-primary-500 hover:border-primary-600 hover:shadow-xl'}
                  ${!canVoteNow || loading ? 'opacity-60 cursor-not-allowed' : ''}
                `}
                onClick={canVoteNow && !loading ? () => handleVote(option) : undefined}
              >
                <div className="text-center">
                  <div className="text-3xl mb-3">
                    {getCategoryEmoji(room.category || 'custom', pid === player1Id ? 1 : 2)}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{option}</h3>
                  {showVote && currentPlayer?.vote === option && (
                    <div className="text-green-600 font-semibold">✓ Your Vote</div>
                  )}
                  {showVote && currentPlayer?.vote && currentPlayer?.vote !== option && (
                    <div className="text-gray-500 text-sm">Not selected</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Messages */}
      {isFinalRound ? (
        // Final round status messages
        <>
          {!hasVoted && (
            <div className="text-center">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-700">Please cast your vote by clicking one of the options above</p>
              </div>
            </div>
          )}
          {hasVoted && !bothVoted && (
            <div className="text-center">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="animate-pulse text-blue-600">
                  Waiting for the other player to vote...
                </div>
              </div>
            </div>
          )}
          {/* No confirmation message after both have voted; parent will show result */}
        </>
      ) : (
        // Intermediate round status messages (existing logic)
        <>
          {!isMyTurn && (
            <div className="text-center">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="animate-pulse text-blue-600">
                  Waiting for the other player to vote...
                </div>
              </div>
            </div>
          )}
          {!hasVoted && isMyTurn && !loading && (
            <div className="text-center">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-700">Please cast your vote by clicking one of the options above</p>
              </div>
            </div>
          )}

          {hasVoted && !bothVoted && (
            <div className="text-center">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="animate-pulse text-blue-600">
                  Waiting for other player to vote...
                </div>
              </div>
            </div>
          )}

          {/* No confirmation message after both have voted; parent will show result */}

          {/* Revote message after first tie */}
          {isRevote && !isRandomWinner && !bothVoted && (
            <div className="text-center mt-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-orange-700 font-semibold">
                  You disagreed! Please revote. If you disagree again, a random winner will be chosen.
                </p>
              </div>
            </div>
          )}

          {/* Random winner message after second tie */}
          {isRandomWinner && (
            <div className="text-center mt-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 font-semibold">
                  A random winner will be selected due to a stalemate!
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="text-gray-600 mt-2">Processing vote...</p>
        </div>
      )}
    </div>
  );
} 