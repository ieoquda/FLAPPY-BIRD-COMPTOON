
import React, { useEffect, useState } from 'react';
import { getLeaderboard, resetLeaderboard } from '../services/api';

interface Props {
  openWinner: () => void;
}

const LeaderboardView: React.FC<Props> = ({ openWinner }) => {
  const [data, setData] = useState<{ rank: number; name: string; score: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  const fetchBoard = async () => {
    setLoading(true);
    const board = await getLeaderboard();
    setData(board);
    setLoading(false);
  };

  useEffect(() => {
    fetchBoard();
  }, []);

  const handleReset = async () => {
    const confirmMessage = "⚠️ WARNING: This will permanently delete ALL leaderboard data for all players. This action cannot be undone.\n\nAre you absolutely sure?";
    if (window.confirm(confirmMessage)) {
      setResetting(true);
      await resetLeaderboard();
      await fetchBoard();
      setResetting(false);
      alert("Leaderboard has been successfully reset!");
    }
  };

  return (
    <div className="absolute inset-0 pt-24 pb-20 px-4 flex flex-col items-center overflow-y-auto bg-blue-50">
      <div className="max-w-xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-game text-blue-600">Leaderboard</h1>
          <button 
            onClick={fetchBoard}
            disabled={loading}
            className={`text-blue-400 hover:text-blue-600 font-bold flex items-center gap-2 ${loading ? 'opacity-50' : ''}`}
          >
            {loading ? 'Updating...' : 'Refresh 🔄'}
          </button>
        </div>

        {loading && !resetting ? (
          <div className="text-center py-12 text-gray-400 italic">Loading scores...</div>
        ) : data.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-3xl shadow-inner border-2 border-dashed border-gray-200">
             No scores yet. Be the first to set a record! 🐦
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-white">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-blue-100 text-blue-600 font-game">
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Pilot</th>
                  <th className="px-6 py-4 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {data.map((entry, i) => (
                  <tr key={i} className={`border-b border-gray-50 hover:bg-yellow-50 transition-colors ${i === 0 ? 'bg-yellow-100/30' : ''}`}>
                    <td className="px-6 py-4 font-game text-blue-400">
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-700">
                        {entry.name}
                        {i === 0 && <span className="ml-2 text-xs bg-yellow-400 text-white px-2 py-0.5 rounded-full animate-pulse">BEST</span>}
                    </td>
                    <td className="px-6 py-4 text-right font-game text-2xl text-blue-600">
                        {entry.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-12 p-6 bg-white/50 rounded-2xl border-2 border-gray-200 text-center">
            <h3 className="text-gray-500 font-bold mb-4 uppercase text-sm tracking-widest">Admin Controls</h3>
            <button 
                onClick={handleReset}
                disabled={resetting}
                className={`w-full py-3 px-6 rounded-xl font-bold transition-all shadow-md ${
                    resetting 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-red-100 text-red-600 hover:bg-red-500 hover:text-white active:scale-95'
                }`}
            >
                {resetting ? 'RESETTING...' : '🗑️ RESET GLOBAL HISTORY'}
            </button>
            <p className="mt-4 text-xs text-gray-400 italic">
                Resetting clears all 10 slots. Use this when "Maximum player limit reached" appears.
            </p>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardView;
