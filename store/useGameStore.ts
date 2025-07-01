import { create } from 'zustand';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { signInWithPopup, signOut } from 'firebase/auth';
import { db, auth, googleProvider } from '@/lib/firebase';
import { generateRoomId } from '@/lib/slug';
import { calculateFinalOptions, determineWinner } from '@/lib/gameLogic';
import { GameStore, RoomData, Player } from '@/types';

export const useGameStore = create<GameStore>((set, get) => ({
  // State
  user: null,
  room: null,
  step: 0,
  loading: false,
  error: null,

  // Actions
  setUser: (user) => set({ user }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  resetGame: () => set({ room: null, step: 0, error: null }),

  joinRoom: async (roomId) => {
    const { user } = get();
    if (!user) throw new Error('User not authenticated');

    set({ loading: true, error: null });

    try {
      const roomRef = doc(db, 'rooms', roomId);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        throw new Error('Room not found');
      }

      const roomData = roomSnap.data() as RoomData;
      
      // Check if room is full
      if (Object.keys(roomData.players).length >= 2) {
        throw new Error('Room is full');
      }

      // Add player to room
      const player: Player = {
        displayName: user.displayName || 'Anonymous',
        avatar: user.photoURL || '',
        options: [],
        eliminated: [],
        vote: null,
      };

      await updateDoc(roomRef, {
        [`players.${user.uid}`]: player,
      });

      // Set up real-time listener
      const unsubscribe = onSnapshot(roomRef, (doc) => {
        if (doc.exists()) {
          const updatedRoom = doc.data() as RoomData;
          set({ room: updatedRoom });
        }
      });

      // Store unsubscribe function for cleanup
      (window as any).roomUnsubscribe = unsubscribe;

    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to join room' });
    } finally {
      set({ loading: false });
    }
  },

  createRoom: async (category = 'custom') => {
    const { user } = get();
    if (!user) throw new Error('User not authenticated');

    set({ loading: true, error: null });

    try {
      const roomId = generateRoomId();
      const roomRef = doc(db, 'rooms', roomId);

      const player: Player = {
        displayName: user.displayName || 'Anonymous',
        avatar: user.photoURL || '',
        options: [],
        eliminated: [],
        vote: null,
      };

      const roomData: RoomData = {
        roomId,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        category,
        players: {
          [user.uid]: player,
        },
        eliminationStep: 0,
        votingTurn: null,
        finalOptions: [],
        winner: null,
        status: 'waiting',
      };

      await setDoc(roomRef, roomData);

      // Set up real-time listener
      const unsubscribe = onSnapshot(roomRef, (doc) => {
        if (doc.exists()) {
          const updatedRoom = doc.data() as RoomData;
          set({ room: updatedRoom });
        }
      });

      // Store unsubscribe function for cleanup
      (window as any).roomUnsubscribe = unsubscribe;

      return roomId;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create room' });
      console.error('Create room error:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  submitOptions: async (options: string[]) => {
    const { user, room } = get();
    if (!user || !room) throw new Error('User or room not found');

    if (options.length !== 3) {
      throw new Error('Must submit exactly 3 options');
    }

    set({ loading: true, error: null });

    try {
      const roomRef = doc(db, 'rooms', room.roomId);
      
      await updateDoc(roomRef, {
        [`players.${user.uid}.options`]: options,
      });

      // Check if both players have submitted options
      const updatedPlayers = {
        ...room.players,
        [user.uid]: {
          ...room.players[user.uid],
          options,
        },
      };

      const bothSubmitted = Object.values(updatedPlayers).every(
        player => player.options.length === 3
      );

      if (bothSubmitted) {
        const player1Id = room.createdBy;
        await updateDoc(roomRef, {
          status: 'playing',
          eliminationStep: 1,
          votingTurn: player1Id, // Start elimination with Player 1's turn
        });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to submit options' });
    } finally {
      set({ loading: false });
    }
  },

  eliminateOption: async (target: string) => {
    const { user, room } = get();
    if (!user || !room) throw new Error('User or room not found');

    // Check if it's the user's turn to eliminate
    if (room.votingTurn !== user.uid) return;

    set({ loading: true, error: null });

    try {
      const player1Id = room.createdBy;
      const player2Id = Object.keys(room.players).find(id => id !== player1Id);
      if (!player1Id || !player2Id) throw new Error('Both players not found');
      const roomRef = doc(db, 'rooms', room.roomId);
      let eliminatedPlayerId = user.uid;
      if (room.eliminationStep === 1) eliminatedPlayerId = player2Id;
      else if (room.eliminationStep === 2) eliminatedPlayerId = player1Id;
      // Steps 3 and 4: eliminate from own options (already correct)
      const eliminatedPlayer = room.players[eliminatedPlayerId];
      const updatedEliminated = [...eliminatedPlayer.eliminated, target];
      
      await updateDoc(roomRef, {
        [`players.${eliminatedPlayerId}.eliminated`]: updatedEliminated,
        revealElimination: { option: target, by: user.uid },
        eliminationAck: { [user.uid]: false, ...Object.fromEntries([player1Id, player2Id].filter(id => id !== user.uid).map(id => [id, false])) },
      });
      
    } catch (error) {
      console.error('Error in eliminateOption:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to eliminate option' });
    } finally {
      set({ loading: false });
    }
  },

  acknowledgeEliminationReveal: async () => {
    const { user, room } = get();
    if (!user || !room || !room.revealElimination) return;
    set({ loading: true, error: null });
    try {
      const player1Id = room.createdBy;
      const player2Id = Object.keys(room.players).find(id => id !== player1Id);
      if (!player1Id || !player2Id) throw new Error('Both players not found');
      const roomRef = doc(db, 'rooms', room.roomId);
      
      // Create the updated acknowledgment state
      const newAck = { ...(room.eliminationAck || {}), [user.uid]: true };
      
      // Update the acknowledgment in the database
      await updateDoc(roomRef, { eliminationAck: newAck });
      
      // Check if both players have acknowledged
      const allAck = [player1Id, player2Id].every(id => newAck[id]);
      
      if (allAck) {
        let nextStep = room.eliminationStep + 1;
        let updates: any = { revealElimination: null, eliminationAck: {} };
        
        if (nextStep <= 4) {
          updates.eliminationStep = nextStep;
          // Set votingTurn for next elimination step
          if (nextStep === 2 || nextStep === 4) {
            updates.votingTurn = player2Id; // Player 2's turn
          } else {
            updates.votingTurn = player1Id; // Player 1's turn
          }
          await updateDoc(roomRef, updates);
        } else {
          // Elimination phase complete, move to voting
          const updatedRoom = {
            ...room,
            players: {
              ...room.players,
              [user.uid]: {
                ...room.players[user.uid],
                eliminated: [...room.players[user.uid].eliminated, room.revealElimination!.option]
              }
            }
          };
          const finalOptions = calculateFinalOptions(updatedRoom);
          updates.status = 'voting';
          updates.finalOptions = finalOptions;
          updates.voteRound = 1;
          // Set votingTurn to Player 1 (createdBy) for voting phase
          updates.votingTurn = player1Id;
          // Reset votes and final votes tracking
          for (const id of [player1Id, player2Id]) {
            updates[`players.${id}.vote`] = null;
          }
          updates.finalVotesSubmitted = {};
          await updateDoc(roomRef, updates);
        }
      }
    } catch (error) {
      console.error('Error in acknowledgeEliminationReveal:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to acknowledge elimination reveal' });
    } finally {
      set({ loading: false });
    }
  },

  vote: async (option: string) => {
    const { user, room } = get();
    if (!user || !room) throw new Error('User or room not found');
    const player1Id = room.createdBy;
    const player2Id = Object.keys(room.players).find(id => id !== player1Id);
    if (!player1Id || !player2Id) throw new Error('Both players not found');
    
    const isFinalRound = room.finalOptions.length === 2;
    
    if (isFinalRound) {
      // Simultaneous voting: allow both players to vote at any time
      if (room.players[user.uid].vote) return; // Already voted
    } else {
      // Turn-based voting
      if (room.votingTurn !== user.uid) return;
      if (room.players[user.uid].vote) return; // Already voted
    }
    set({ loading: true, error: null });
    try {
      const roomRef = doc(db, 'rooms', room.roomId);
      await updateDoc(roomRef, {
        [`players.${user.uid}.vote`]: option,
      });
      
      // After voting, check if both have voted
      const updatedPlayers = {
        ...room.players,
        [user.uid]: {
          ...room.players[user.uid],
          vote: option,
        },
      };
      const votes = Object.values(updatedPlayers).map(p => p.vote);
      const votesCount = votes.filter(Boolean).length;
      
      if (isFinalRound) {
        if (votesCount === 2) {
          const [vote1, vote2] = votes;
          if (vote1 === vote2) {
            await updateDoc(roomRef, {
              status: 'complete',
              winner: vote1,
              randomWinner: false,
              votingTurn: null,
            });
          } else {
            // Check if this is already a revote
            const voteRound = room.voteRound || 1;
            if (voteRound < 2) {
              // Reset votes for revote
              const resetVotes: any = {};
              for (const id of [player1Id, player2Id]) {
                resetVotes[`players.${id}.vote`] = null;
              }
              await updateDoc(roomRef, {
                ...resetVotes,
                voteRound: voteRound + 1,
              });
            } else {
              // After revote, still disagree - pick random winner
              const winner = Math.random() < 0.5 ? vote1 : vote2;
              await updateDoc(roomRef, {
                status: 'complete',
                winner,
                randomWinner: true,
                votingTurn: null,
              });
            }
          }
        }
      } else {
        if (votesCount === 1) {
          // Advance to next player's turn and reset their vote to null
          const otherPlayerId = [player1Id, player2Id].find(id => id !== user.uid);
          await updateDoc(roomRef, {
            votingTurn: otherPlayerId,
            [`players.${otherPlayerId}.vote`]: null,
          });
        } else if (votesCount === 2) {
          const [vote1, vote2] = votes;
          if (vote1 === vote2) {
            await updateDoc(roomRef, {
              status: 'complete',
              winner: vote1,
              randomWinner: false,
              votingTurn: null,
            });
          } else {
            const voteRound = room.voteRound || 1;
            if (voteRound < 2) {
              const resetVotes: any = {};
              for (const id of [player1Id, player2Id]) {
                resetVotes[`players.${id}.vote`] = null;
              }
              await updateDoc(roomRef, {
                ...resetVotes,
                voteRound: voteRound + 1,
                votingTurn: player1Id,
              });
            } else {
              const winner = Math.random() < 0.5 ? vote1 : vote2;
              await updateDoc(roomRef, {
                status: 'complete',
                winner,
                randomWinner: true,
                votingTurn: null,
              });
            }
          }
        }
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to vote' });
    } finally {
      set({ loading: false });
    }
  },
}));

// Auth helper functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    useGameStore.getState().setUser(result.user);
  } catch (error) {
    console.error('Sign in error:', error);
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
    useGameStore.getState().setUser(null);
    useGameStore.getState().resetGame();
    
    // Clean up room listener
    if ((window as any).roomUnsubscribe) {
      (window as any).roomUnsubscribe();
      (window as any).roomUnsubscribe = null;
    }
  } catch (error) {
    console.error('Sign out error:', error);
  }
}; 