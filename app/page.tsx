'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGameStore, signInWithGoogle, signOutUser } from '@/store/useGameStore';
import { isValidRoomId } from '@/lib/slug';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const CATEGORY_OPTIONS = [
  'Movies',
  'Cuisines',
  'Restaurants',
  'Travel Destinations',
  'Names',
  'Custom',
];

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, createRoom, joinRoom, loading } = useGameStore();
  const [roomId, setRoomId] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [error, setError] = useState('');
  const [createdRoomUrl, setCreatedRoomUrl] = useState('');
  const [redirectRoomName, setRedirectRoomName] = useState<string | null>(null);

  // Redirect to room after login if redirectRoomId param exists
  useEffect(() => {
    if (user) {
      const redirectRoomId = searchParams.get('redirectRoomId');
      if (redirectRoomId) {
        router.replace(`/rooms/${redirectRoomId}`);
      }
    }
  }, [user, searchParams, router]);

  // Show greeting if redirectRoomId param exists
  useEffect(() => {
    const redirectRoomId = searchParams.get('redirectRoomId');
    if (redirectRoomId) {
      // Fetch room from Firestore
      const fetchRoom = async () => {
        const roomRef = doc(db, 'rooms', redirectRoomId);
        const roomSnap = await getDoc(roomRef);
        if (roomSnap.exists()) {
          setRedirectRoomName(roomSnap.id);
        } else {
          setRedirectRoomName(redirectRoomId); // fallback to ID
        }
      };
      fetchRoom();
    } else {
      setRedirectRoomName(null);
    }
  }, [searchParams]);

  const handleLogin = async () => {
    await signInWithGoogle();
  };

  const handleSignOut = async () => {
    await signOutUser();
  };

  const handleCreateRoom = async () => {
    setError('');
    let finalCategory = category;
    if (category === 'Custom') {
      if (!customCategory.trim()) {
        setError('Please enter a custom category.');
        return;
      }
      finalCategory = customCategory.trim();
    }
    try {
      const newRoomId = await createRoom(finalCategory);
      const url = `${window.location.origin}/rooms/${newRoomId}`;
      setCreatedRoomUrl(url);
      router.push(`/rooms/${newRoomId}`);
    } catch (err) {
      setError('Failed to create room.');
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isValidRoomId(roomId)) {
      setError('Room IDs must be in the format: spicy-tiger-echo (two hyphens, all lowercase)');
      return;
    }
    try {
      await joinRoom(roomId);
      router.push(`/rooms/${roomId}`);
    } catch (err) {
      setError('Failed to join room.');
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-8 animate-fade-in">
        <div className="flex flex-col items-center space-y-2">
          <img src="/logo.svg" alt="Pick Duel Logo" className="w-16 h-16 mb-2" />
          <h1 className="text-3xl font-bold text-primary-700">Pick Duel</h1>
          <p className="text-gray-600 text-center">
            A fun two-player game to help you make decisions together. Secretly enter options, eliminate, then vote!
          </p>
        </div>

        {!user ? (
          <div className="flex flex-col items-center space-y-4">
            {redirectRoomName && (
              <div className="w-full text-center bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-4 py-2 mb-2">
                <span className="font-semibold">Sign in to join room:</span> <span className="font-mono">{redirectRoomName}</span>
              </div>
            )}
            <button
              onClick={handleLogin}
              className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              disabled={loading}
            >
              <img src="/google.svg" alt="Google" className="w-5 h-5" />
              Sign in with Google
            </button>
          </div>
        ) : (
          <div className="space-y-6">


            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={loading}
                >
                  {CATEGORY_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {category === 'Custom' && (
                  <input
                    type="text"
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    className="w-full mt-2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter your custom category..."
                    disabled={loading}
                  />
                )}
              </div>
              <button
                onClick={handleCreateRoom}
                className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
                disabled={loading}
              >
                Create New Room
              </button>
              {createdRoomUrl && (
                <div className="mt-2">
                  <label className="block text-xs text-gray-500 mb-1">Room URL</label>
                  <input
                    type="text"
                    value={createdRoomUrl}
                    readOnly
                    className="w-full px-3 py-2 border rounded bg-gray-100 text-xs"
                  />
                </div>
              )}
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Join Room by ID</label>
              <input
                type="text"
                value={roomId}
                onChange={e => setRoomId(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g. spicy-tiger-echo"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">Room IDs must be in the format: <span className="font-mono">spicy-tiger-echo</span> (two hyphens, all lowercase)</p>
              <button
                type="submit"
                className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
                disabled={loading}
              >
                Join Room
              </button>
            </form>
          </div>
        )}

        {error && (
          <div className="text-center text-red-500 text-sm mt-2">{error}</div>
        )}
      </div>
      <div className="mt-8 text-gray-400 text-xs text-center">
        &copy; {new Date().getFullYear()} Pick Duel. All rights reserved.
      </div>
    </main>
  );
} 