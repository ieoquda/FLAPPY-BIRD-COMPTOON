
import React, { useRef, useEffect, useState } from 'react';
import { submitScore, getLeaderboard } from '../services/api';
import { playSound } from '../services/audio';

interface Props {
  isNameSet: boolean;
  playerName: string;
  onSetName: (name: string) => void;
}

const GameView: React.FC<Props> = ({ isNameSet, playerName, onSetName }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [highScoreMessage, setHighScoreMessage] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const engineRef = useRef({
    birdY: 0,
    birdVel: 0,
    birdRot: 0,
    pipes: [] as { x: number; top: number; passed: boolean }[],
    bgOffset: 0,
    cloudOffset: 0,
    hillOffset: 0,
    particles: [] as any[],
    frame: 0,
  });

  const GRAVITY = 0.22;
  const FLAP_LIFT = -5.5;
  const PIPE_WIDTH = 80;
  const PIPE_GAP = 220;
  const PIPE_SPACING = 350;
  const BIRD_SIZE = 40;
  const GROUND_HEIGHT = 100;

  const initGame = (width: number, height: number) => {
    engineRef.current.birdY = height / 2;
    engineRef.current.birdVel = 0;
    engineRef.current.pipes = [
      { x: width + 300, top: height / 2 - 100, passed: false },
      { x: width + 300 + PIPE_SPACING, top: height / 2, passed: false },
    ];
    engineRef.current.particles = [];
    setScore(0);
    setHighScoreMessage(null);
  };

  const spawnParticle = (x: number, y: number, type: 'feather' | 'sparkle') => {
    for (let i = 0; i < 5; i++) {
        engineRef.current.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 1.0,
            type
        });
    }
  };

  const handleInteraction = () => {
    if (gameState === 'START') {
        setGameState('PLAYING');
        engineRef.current.birdVel = FLAP_LIFT;
        playSound('flap');
    } else if (gameState === 'PLAYING') {
        engineRef.current.birdVel = FLAP_LIFT;
        spawnParticle(60, engineRef.current.birdY, 'feather');
        playSound('flap');
    }
  };

  const checkAndSubmitName = async () => {
    const trimmed = tempName.trim();
    if (!trimmed) return;
    if (isChecking) return;

    setIsChecking(true);
    setErrorMsg(null);
    
    try {
        const board = await getLeaderboard();
        const uniqueNames = new Set(board.map((e: any) => e.name));
        
        // Check if player is already in the list OR if there is room for a new player
        if (!uniqueNames.has(trimmed) && uniqueNames.size >= 10) {
            setErrorMsg("Maximum player reached (10/10). Reset the leaderboard to add new names.");
            setIsChecking(false);
            return;
        }
        
        onSetName(trimmed);
    } catch (e) {
        setErrorMsg("Connection error. Using fallback mode.");
        onSetName(trimmed);
    } finally {
        setIsChecking(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (gameState === 'START') {
        initGame(canvas.width, canvas.height);
      }
    };

    window.addEventListener('resize', resize);
    resize();

    const loop = () => {
      const { current: engine } = engineRef;
      engine.frame++;

      // 1. SKY
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, '#7DD3FC');
      skyGrad.addColorStop(1, '#E0F2FE');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. SUN
      ctx.fillStyle = 'rgba(255, 255, 100, 0.3)';
      ctx.beginPath();
      ctx.arc(canvas.width - 100, 100, 80, 0, Math.PI * 2);
      ctx.fill();

      // 3. CLOUDS
      engine.cloudOffset -= 0.3;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      for(let i = 0; i < 5; i++) {
          const cx = ((i * 400 + engine.cloudOffset) % (canvas.width + 400)) - 200;
          ctx.beginPath();
          ctx.arc(cx, 150 + Math.sin(i) * 20, 40, 0, Math.PI * 2);
          ctx.arc(cx + 40, 140 + Math.sin(i) * 20, 50, 0, Math.PI * 2);
          ctx.arc(cx + 80, 150 + Math.sin(i) * 20, 40, 0, Math.PI * 2);
          ctx.fill();
      }

      // 4. HILLS
      engine.hillOffset -= 0.8;
      ctx.fillStyle = '#4ADE80';
      for(let i = -1; i < 5; i++) {
          const hx = ((i * 500 + engine.hillOffset) % (canvas.width + 500)) - 250;
          ctx.beginPath();
          ctx.ellipse(hx, canvas.height - 80, 300, 150, 0, 0, Math.PI * 2);
          ctx.fill();
      }

      // 5. PIPES
      if (gameState === 'PLAYING' || gameState === 'GAMEOVER') {
          engine.pipes.forEach(pipe => {
            if (gameState === 'PLAYING') pipe.x -= 2.5;

            const pipeGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
            pipeGrad.addColorStop(0, '#22C55E');
            pipeGrad.addColorStop(0.3, '#4ADE80');
            pipeGrad.addColorStop(1, '#166534');
            ctx.fillStyle = pipeGrad;
            
            ctx.beginPath();
            ctx.roundRect(pipe.x, -50, PIPE_WIDTH, pipe.top + 50, [0, 0, 15, 15]);
            ctx.fill();

            ctx.beginPath();
            ctx.roundRect(pipe.x, pipe.top + PIPE_GAP, PIPE_WIDTH, canvas.height - (pipe.top + PIPE_GAP) + 50, [15, 15, 0, 0]);
            ctx.fill();

            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(pipe.x + 5, pipe.top - 20, PIPE_WIDTH - 10, 10);
            ctx.fillRect(pipe.x + 5, pipe.top + PIPE_GAP + 10, PIPE_WIDTH - 10, 10);
          });

          if (engine.pipes.length > 0 && engine.pipes[0].x < -PIPE_WIDTH) {
              engine.pipes.shift();
              const lastPipeX = engine.pipes[engine.pipes.length - 1].x;
              engine.pipes.push({
                  x: lastPipeX + PIPE_SPACING,
                  top: 100 + Math.random() * (canvas.height - GROUND_HEIGHT - PIPE_GAP - 200),
                  passed: false
              });
          }
      }

      // 6. GROUND
      engine.bgOffset -= 3;
      const groundGrad = ctx.createLinearGradient(0, canvas.height - GROUND_HEIGHT, 0, canvas.height);
      groundGrad.addColorStop(0, '#22C55E');
      groundGrad.addColorStop(1, '#15803D');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);
      
      ctx.strokeStyle = '#166534';
      ctx.lineWidth = 2;
      for (let i = 0; i < canvas.width + 100; i += 40) {
          const gx = (i + engine.bgOffset) % (canvas.width + 100);
          ctx.beginPath();
          ctx.moveTo(gx, canvas.height - GROUND_HEIGHT + 10);
          ctx.lineTo(gx - 5, canvas.height - GROUND_HEIGHT + 25);
          ctx.stroke();
      }

      // 7. PLAYER BIRD
      if (gameState !== 'START') {
          if (gameState === 'PLAYING') {
              engine.birdVel += GRAVITY;
              engine.birdY += engine.birdVel;
              engine.birdRot = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, engine.birdVel * 0.1));

              if (engine.birdY + BIRD_SIZE/2 > canvas.height - GROUND_HEIGHT || engine.birdY - BIRD_SIZE/2 < 0) {
                  endGame();
              }
              engine.pipes.forEach(pipe => {
                  const bx = 60;
                  if (bx + BIRD_SIZE/2 > pipe.x && bx - BIRD_SIZE/2 < pipe.x + PIPE_WIDTH) {
                      if (engine.birdY - BIRD_SIZE/2 < pipe.top || engine.birdY + BIRD_SIZE/2 > pipe.top + PIPE_GAP) {
                          endGame();
                      }
                  }
                  if (!pipe.passed && bx > pipe.x + PIPE_WIDTH/2) {
                      pipe.passed = true;
                      setScore(s => s + 1);
                      spawnParticle(bx, engine.birdY, 'sparkle');
                      playSound('score');
                  }
              });
          } else if (gameState === 'GAMEOVER') {
             engine.birdY = Math.min(canvas.height - GROUND_HEIGHT - BIRD_SIZE/2, engine.birdY + 10);
             engine.birdRot = Math.PI/2;
          }

          ctx.save();
          ctx.translate(60, engine.birdY);
          ctx.rotate(engine.birdRot);

          ctx.fillStyle = 'rgba(0,0,0,0.1)';
          ctx.beginPath();
          ctx.ellipse(0, 40, 15, 5, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FACC15';
          ctx.beginPath();
          ctx.ellipse(0, 0, BIRD_SIZE/2, BIRD_SIZE/2.5, 0, 0, Math.PI * 2);
          ctx.fill();

          const wingPhase = Math.sin(engine.frame * 0.4) * 15;
          ctx.fillStyle = '#EAB308';
          ctx.beginPath();
          ctx.ellipse(-5, 5, 12, 8 + (gameState === 'PLAYING' ? wingPhase/2 : 0), 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(10, -5, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'black';
          ctx.beginPath();
          ctx.arc(12, -5, 2.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FB923C';
          ctx.beginPath();
          ctx.moveTo(18, 0);
          ctx.lineTo(28, 2);
          ctx.lineTo(18, 5);
          ctx.fill();

          ctx.restore();
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.font = 'bold 12px Quicksand';
          ctx.textAlign = 'center';
          ctx.fillText(playerName, 60, engine.birdY - 30);
      }

      // 8. PARTICLES
      engine.particles = engine.particles.filter(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.02;
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.type === 'feather' ? '#FEF9C3' : '#FDE047';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.type === 'feather' ? 3 : 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
          return p.life > 0;
      });

      animationId = requestAnimationFrame(loop);
    };

    const endGame = async () => {
        if (gameState !== 'PLAYING') return;
        setGameState('GAMEOVER');
        playSound('gameOver');
        
        try {
           const result = await submitScore(playerName, score);
           if (result.success) {
               const board = await getLeaderboard();
               const isTop = board.some((entry: any) => entry.name === playerName && entry.score === score);
               if (isTop) {
                   setHighScoreMessage("NEW RECORD! 🏆");
                   playSound('cheer');
               }
           }
        } catch (err) {
            console.error("Score submission failed", err);
        }
    };

    loop();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [gameState, playerName, score]);

  const resetGame = () => {
      initGame(window.innerWidth, window.innerHeight);
      setGameState('START');
  };

  return (
    <div className="relative w-full h-full cursor-pointer" onClick={handleInteraction}>
      <canvas ref={canvasRef} className="block" />

      {!isNameSet && (
        <div className="absolute inset-0 bg-blue-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="relative bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center border-4 border-yellow-400">
            {/* Close Icon / Cross */}
            <button 
                onClick={(e) => { e.stopPropagation(); onSetName('Player'); }}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                aria-label="Skip name entry"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <h1 className="text-4xl font-game text-blue-600 mb-2">Welcome!</h1>
            <p className="text-gray-600 mb-6">Enter your name to fly.</p>
            <input 
              autoFocus
              maxLength={20}
              placeholder="Your Pilot Name"
              value={tempName}
              disabled={isChecking}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && tempName && checkAndSubmitName()}
              className={`w-full px-4 py-3 rounded-xl border-2 border-blue-200 focus:border-blue-500 outline-none text-xl text-center mb-4 bg-gray-50 ${isChecking ? 'opacity-50' : ''}`}
            />
            {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl mb-4 font-bold flex flex-col gap-1">
                    <span>{errorMsg}</span>
                    <span className="text-[10px] opacity-70 uppercase tracking-tighter">Visit Leaderboard to Reset</span>
                </div>
            )}
            <button 
              disabled={!tempName || isChecking}
              onClick={(e) => { e.stopPropagation(); checkAndSubmitName(); }}
              className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-white font-game text-xl rounded-xl shadow-lg transition-transform active:scale-95"
            >
              {isChecking ? 'FLYING...' : "LET'S FLY!"}
            </button>
          </div>
        </div>
      )}

      {isNameSet && gameState === 'START' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="bg-white/30 backdrop-blur-md p-8 rounded-full border-4 border-white/50 animate-pulse text-white font-game text-4xl shadow-2xl">
            TAP TO START
          </div>
          <p className="mt-4 text-white font-bold drop-shadow-lg uppercase tracking-widest">Player: {playerName}</p>
        </div>
      )}

      {gameState === 'PLAYING' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="text-6xl font-game text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
            {score}
          </div>
        </div>
      )}

      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center border-4 border-red-400 animate-[bounce_1s_ease-in-out]">
            <h2 className="text-3xl font-game text-red-500 mb-1">Oops!</h2>
            <div className="text-6xl font-game text-blue-600 my-4">{score}</div>
            <p className="text-gray-500 mb-2">POINTS</p>
            {highScoreMessage && (
                <div className="text-2xl font-game text-yellow-500 mb-6 animate-bounce">
                    {highScoreMessage}
                </div>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); resetGame(); }}
              className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-game text-2xl rounded-xl shadow-lg transition-transform active:scale-95"
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameView;
