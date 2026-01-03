
import React, { useState, useEffect } from 'react';
import GameView from './components/GameView';
import LeaderboardView from './components/LeaderboardView';
import WinnerModal from './components/WinnerModal';
import { getWinner } from './services/api';

type Tab = 'GAME' | 'LEADERBOARD';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('GAME');
  const [playerName, setPlayerName] = useState<string>('');
  const [isNameSet, setIsNameSet] = useState<boolean>(false);
  const [showWinner, setShowWinner] = useState<boolean>(false);
  const [winnerData, setWinnerData] = useState<{ name: string; score: number } | null>(null);

  useEffect(() => {
    const savedName = localStorage.getItem('skybound_player_name');
    if (savedName) {
      setPlayerName(savedName);
      setIsNameSet(true);
    }
  }, []);

  const handleStart = (name: string) => {
    const trimmed = name.trim().slice(0, 20);
    if (trimmed) {
      setPlayerName(trimmed);
      setIsNameSet(true);
      localStorage.setItem('skybound_player_name', trimmed);
    }
  };

  const handleChangeName = () => {
    setIsNameSet(false);
    localStorage.removeItem('skybound_player_name');
  };

  const openWinner = async () => {
    const winner = await getWinner();
    setWinnerData(winner);
    setShowWinner(true);
  };

  return (
    <div className="relative w-screen h-screen bg-sky-100 overflow-hidden flex flex-col">
      {/* Navigation Header */}
      <nav className="absolute top-0 left-0 w-full flex justify-between items-center p-4 z-40 pointer-events-auto">
        <div className="flex space-x-2">
            <button 
              onClick={() => setActiveTab('GAME')}
              className={`px-6 py-2 rounded-full font-game shadow-lg transition-all ${activeTab === 'GAME' ? 'bg-yellow-400 text-white scale-110' : 'bg-white/80 text-blue-500 hover:bg-white'}`}
            >
              GAME
            </button>
            <button 
              onClick={() => setActiveTab('LEADERBOARD')}
              className={`px-6 py-2 rounded-full font-game shadow-lg transition-all ${activeTab === 'LEADERBOARD' ? 'bg-yellow-400 text-white scale-110' : 'bg-white/80 text-blue-500 hover:bg-white'}`}
            >
              LEADERBOARD
            </button>
        </div>
        
        {isNameSet && (
            <button 
                onClick={handleChangeName}
                className="bg-white/50 hover:bg-white px-4 py-2 rounded-full text-xs font-bold text-blue-600 shadow-sm transition-all"
            >
                CHANGE NAME
            </button>
        )}
      </nav>

      <div className="flex-grow relative">
        {activeTab === 'GAME' ? (
          <GameView 
            isNameSet={isNameSet} 
            playerName={playerName} 
            onSetName={handleStart} 
          />
        ) : (
          <LeaderboardView openWinner={openWinner} />
        )}
      </div>

      <div className="absolute bottom-4 right-4 z-40 flex flex-col items-end space-y-2">
         {activeTab === 'LEADERBOARD' && (
           <button 
            onClick={openWinner}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full font-bold shadow-xl border-2 border-white animate-bounce"
           >
             🏆 SHOW WINNER
           </button>
         )}
      </div>

      {showWinner && (
        <WinnerModal 
          winner={winnerData} 
          onClose={() => setShowWinner(false)} 
        />
      )}
    </div>
  );
};

export default App;
