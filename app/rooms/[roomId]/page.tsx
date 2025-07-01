'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useGameStore, signOutUser } from '@/store/useGameStore';
import InputGrid from '@/components/InputGrid';
import EliminationStage from '@/components/EliminationStage';
import VoteStage from '@/components/VoteStage';
import FinalResult from '@/components/FinalResult';

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, room, joinRoom, submitOptions, loading, error, resetGame } = useGameStore();
  const [copied, setCopied] = useState(false);
  const [inputSubmitted, setInputSubmitted] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  // --- Auth redirect fix ---
  useEffect(() => {
    if (!user) {
      // Redirect to home with redirect param
      router.replace(`/?redirectRoomId=${roomId}`);
      return;
    }
    if (user && roomId && !hasJoined) {
      joinRoom(roomId as string)
        .then(() => setHasJoined(true))
        .catch(() => {
          router.replace('/');
        });
    }
    // eslint-disable-next-line
  }, [roomId, user, hasJoined]);

  // On home page, after login, redirect to room if redirectRoomId param exists
  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const redirectRoomId = params.get('redirectRoomId');
      if (redirectRoomId) {
        router.replace(`/rooms/${redirectRoomId}`);
      }
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-700">Loading room...</p>
        </div>
      </div>
    );
  }

  const playerIds = Object.keys(room.players);
  const isInputStage = room.status === 'waiting';
  const isEliminationStage = room.status === 'playing';
  const isVotingStage = room.status === 'voting';
  const isFinalStage = room.status === 'complete';
  const currentPlayer = room.players[user.uid];

  const handleSubmitOptions = async (options: string[]) => {
    await submitOptions(options);
    setInputSubmitted(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveRoom = () => {
    resetGame();
    router.replace('/');
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-6 md:p-10 space-y-6 animate-fade-in">
        {/* Room Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-primary-700">Room: <span className="font-mono text-lg">{room.roomId}</span></h1>
            <p className="text-gray-500 text-sm">Share this link with your friend to join:</p>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={typeof window !== 'undefined' ? window.location.href : ''}
                readOnly
                className="w-full md:w-72 px-2 py-1 border rounded text-xs bg-gray-100"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700"
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

        </div>

        {/* Step Indicator */}
        {/* ... removed progress bar and labels ... */}

        {/* Game Stages */}
        {(!currentPlayer || currentPlayer.options.length !== 3) ? (
          <div>
            <InputGrid
              onSubmit={handleSubmitOptions}
              disabled={currentPlayer?.options.length === 3 || loading}
              category={room.category}
            />
          </div>
        ) : (
          <>
            {isEliminationStage && <EliminationStage />}
            {isVotingStage && <VoteStage />}
            {isFinalStage && <FinalResult />}
          </>
        )}

        {/* Error/Loading */}
        {error && (
          <div className="text-center text-red-500 text-sm mt-2">{error}</div>
        )}
        {loading && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="text-gray-600 mt-2">Processing...</p>
          </div>
        )}
      </div>
    </main>
  );
} 