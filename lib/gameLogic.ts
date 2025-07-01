import { RoomData, Player } from '@/types';

export function getEliminationStepDescription(step: number): string {
  switch (step) {
    case 0:
      return 'Waiting for both players to submit options';
    case 1:
      return 'Player 1 eliminates one option from Player 2';
    case 2:
      return 'Player 2 eliminates one option from Player 1';
    case 3:
      return 'Player 1 eliminates one of their own options';
    case 4:
      return 'Player 2 eliminates one of their own options';
    default:
      return 'Voting on final options';
  }
}

export function getCurrentPlayerTurn(room: RoomData): string | null {
  // For both elimination and voting phases, use votingTurn
  return room.votingTurn || null;
}

export function getAvailableOptionsForElimination(room: RoomData, currentPlayerId: string): string[] {
  const playerIds = Object.keys(room.players);
  if (playerIds.length !== 2) return [];

  const [player1Id, player2Id] = playerIds;
  const currentPlayer = room.players[currentPlayerId];
  const otherPlayer = room.players[currentPlayerId === player1Id ? player2Id : player1Id];

  switch (room.eliminationStep) {
    case 1: // Player 1 eliminates from Player 2
      return otherPlayer.options.filter(option => !otherPlayer.eliminated.includes(option));
    case 2: // Player 2 eliminates from Player 1
      return otherPlayer.options.filter(option => !otherPlayer.eliminated.includes(option));
    case 3: // Player 1 eliminates from their own
      return currentPlayer.options.filter(option => !currentPlayer.eliminated.includes(option));
    case 4: // Player 2 eliminates from their own
      return currentPlayer.options.filter(option => !currentPlayer.eliminated.includes(option));
    default:
      return [];
  }
}

export function calculateFinalOptions(room: RoomData): string[] {
  const allOptions: string[] = [];
  
  Object.values(room.players).forEach(player => {
    const remainingOptions = player.options.filter(option => !player.eliminated.includes(option));
    allOptions.push(...remainingOptions);
  });

  return allOptions;
}

export function bothAcknowledgedElimination(room: RoomData): boolean {
  if (!room.eliminationAck) return false;
  const playerIds = Object.keys(room.players);
  return playerIds.every(id => room.eliminationAck?.[id]);
}

export function determineWinner(room: RoomData): string | null {
  if (room.status !== 'voting') return null;
  const votes = Object.values(room.players).map(player => player.vote).filter(Boolean);
  if (votes.length !== 2) return null;
  const [vote1, vote2] = votes;
  if (vote1 === vote2) {
    return vote1;
  }
  // If votes are different, check voteRound
  if (room.voteRound && room.voteRound >= 2) {
    // Randomly select one after a failed revote
    return Math.random() < 0.5 ? vote1 : vote2;
  }
  // No winner yet, need a revote
  return null;
}

export function canProceedToNextStep(room: RoomData): boolean {
  if (room.status === 'waiting') {
    // Check if both players have submitted options
    return Object.values(room.players).every(player => player.options.length === 3);
  }
  
  if (room.status === 'playing') {
    // Check if current elimination step is complete
    const currentPlayerTurn = getCurrentPlayerTurn(room);
    if (!currentPlayerTurn) return false;
    
    // Check if the current player has made their elimination
    const availableOptions = getAvailableOptionsForElimination(room, currentPlayerTurn);
    return availableOptions.length === 1; // Only one option left means elimination is complete
  }
  
  if (room.status === 'voting') {
    // Check if both players have voted
    return Object.values(room.players).every(player => player.vote !== null);
  }
  
  return false;
}

export function getCategoryEmoji(category: string, playerNumber: number): string {
  switch (category.toLowerCase()) {
    case 'movies':
      return playerNumber === 1 ? '🎬' : '📽️';
    case 'cuisines':
      return playerNumber === 1 ? '🌮' : '🍣';
    case 'restaurants':
      return playerNumber === 1 ? '🧑‍🍳' : '🍽️';
    case 'travel destinations':
      return playerNumber === 1 ? '🏖️' : '🏔️';
    case 'names':
      return playerNumber === 1 ? '⭐️' : '❤️';
    default:
      return playerNumber === 1 ? '🏆' : '🚀';
  }
} 