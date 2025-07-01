import { User as FirebaseUser } from 'firebase/auth';

export interface Player {
  displayName: string;
  avatar: string;
  options: string[];
  eliminated: string[];
  vote: string | null;
}

export interface RoomData {
  roomId: string;
  createdAt: any; // Firestore Timestamp
  createdBy: string;
  category: string;
  players: {
    [userId: string]: Player;
  };
  eliminationStep: number;
  votingTurn: string | null; // userId whose turn it is to vote or eliminate
  finalOptions: string[];
  winner: string | null;
  status: 'waiting' | 'playing' | 'voting' | 'complete';
  revealElimination?: { option: string; by: string } | null;
  eliminationAck?: { [userId: string]: boolean };
  voteRound?: number; // 1 for first vote, 2 for revote
  randomWinner?: boolean;
}

export interface GameState {
  user: FirebaseUser | null;
  room: RoomData | null;
  step: number;
  loading: boolean;
  error: string | null;
}

export interface GameActions {
  setUser: (user: FirebaseUser | null) => void;
  joinRoom: (roomId: string) => Promise<void>;
  createRoom: (category?: string) => Promise<string>;
  submitOptions: (options: string[]) => Promise<void>;
  eliminateOption: (target: string) => Promise<void>;
  acknowledgeEliminationReveal: () => Promise<void>;
  vote: (option: string) => Promise<void>;
  resetGame: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export type GameStore = GameState & GameActions; 