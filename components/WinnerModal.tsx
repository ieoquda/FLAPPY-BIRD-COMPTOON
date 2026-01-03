
import React, { useEffect } from 'react';
import { playSound } from '../services/audio';

interface Props {
  winner: { name: string; score: number } | null;
  onClose: () => void;
}

const WinnerModal: React.FC<Props> = ({ winner, onClose }) => {
  useEffect(() => {
    if (winner) playSound('cheer');
  }, [winner]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
         {/* Simple Confetti Placeholder Animation */}
         <div className="relative w-full h-full overflow-hidden">
             {[...Array(50)].map((_, i) => (
                 <div 
                    key={i}
                    className="absolute w-2 h-2 rounded-full animate-ping"
                    style={{
                        backgroundColor: ['#FACC15', '#FB923C', '#60A5FA', '#F472B6'][i % 4],
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 3}s`,
                        animationDuration: `${2 + Math.random() * 2}s`
                    }}
                 />
             ))}
         </div>
      </div>

      <div className="relative bg-gradient-to-b from-blue-600 to-blue-800 rounded-3xl p-10 border-8 border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.5)] text-center max-w-lg w-full scale-110 animate-[bounce_0.5s_ease-out]">
        <div className="text-8xl mb-6">🏆</div>
        <h1 className="text-3xl font-game text-yellow-400 mb-2 tracking-widest uppercase">Global Champion</h1>
        
        {winner ? (
          <>
            <div className="text-6xl font-game text-white my-6 drop-shadow-xl animate-pulse">
                {winner.name}
            </div>
            <div className="text-2xl font-bold text-blue-200">
                With a massive score of
                <div className="text-5xl font-game text-yellow-300 mt-2">{winner.score}</div>
            </div>
          </>
        ) : (
          <div className="text-2xl text-white font-game py-12">NO CHAMPION YET</div>
        )}

        <button 
          onClick={onClose}
          className="mt-12 px-10 py-4 bg-yellow-400 hover:bg-yellow-500 text-white font-game text-xl rounded-2xl shadow-xl transition-all active:scale-95"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};

export default WinnerModal;
