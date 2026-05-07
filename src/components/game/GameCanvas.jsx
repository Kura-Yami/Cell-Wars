// @ts-nocheck
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ABILITY_CONFIG,
  activateAbility,
  createGameState,
  getLeaderboard,
  initGameImages,
  mapRoomPlayerToGamePlayer,
  renderGame,
  updateGameState,
} from '@/lib/gameEngine';
import imgWhiteBloodCell from '@/Images/Whiteblood cell.png';
import imgRedBloodCell from '@/Images/RedBloodCell.png';
import imgSingleBacteria from '@/Images/Single_Bacteria_cell.png';
import imgVirus from '@/Images/Virus.png';
import imgCancerCell from '@/Images/Cancercell.png';
import { leaveRoomPlayer, subscribeToRoomPlayers, updateRoomPlayerState } from '@/api/gameRooms';
import Leaderboard from './Leaderboard';
import ScoreDisplay from './ScoreDisplay';
import Minimap from './Minimap';

const PLAYER_SYNC_INTERVAL_MS = 120;
const PLAYER_SYNC_DISTANCE_THRESHOLD = 2;
const PLAYER_SYNC_ANGLE_THRESHOLD = 0.04;

const FUN_FACTS = {
  wbc: [
    'White blood cells can squeeze through tiny gaps in blood vessel walls to reach infections!',
    'Your body produces about 100 billion white blood cells every single day.',
    'Neutrophils can detect and destroy bacteria in less than 0.01 seconds.',
    'White blood cells remember past invaders — that\'s exactly how vaccines work!',
    'Some white blood cells live only a few hours; others survive for years.',
    'White blood cells make up just 1% of your blood, but they do all the fighting.',
    'A white blood cell can chase a bacterium at up to 30 micrometers per minute.',
    'Macrophages can engulf particles up to their own size — like eating something as big as you!',
  ],
  bacteria: [
    'Bacteria can double their entire population every 20 minutes under ideal conditions!',
    'A single bacterium can become over 8 million copies in just 8 hours.',
    'Some bacteria form tough spores that survive boiling water and even radiation.',
    'Bacteria were the first life on Earth — they\'ve been here for 3.5 billion years.',
    'There are more bacteria in your mouth right now than there are people on Earth.',
    'Bacteria can swap DNA with each other, instantly sharing antibiotic resistance.',
    'Some bacteria produce their own light through a process called bioluminescence.',
    'Your gut contains about 38 trillion bacteria that help you digest food every day.',
  ],
  virus: [
    'Viruses are 100× smaller than bacteria — thousands fit inside a single cell.',
    'One virus particle can hijack a cell to produce 10,000 copies of itself.',
    'Viruses mutate so fast that flu vaccines need to be updated every single year.',
    'Some viruses can survive on hard surfaces for up to 3 days outside a host.',
    'Scientists have discovered viruses that infect other viruses — called virophages!',
    'HIV, flu, and COVID-19 are RNA viruses — they mutate faster than DNA viruses.',
    'Viruses are not considered "alive" — they have no metabolism outside a host cell.',
    'The smallest viruses are just 17 nanometers wide — about 6,000× thinner than a hair.',
  ],
  cancer: [
    'Cancer cells ignore the body\'s "stop dividing" signals that normal cells always obey.',
    'A tumor can grow its own blood vessels to feed itself — a process called angiogenesis.',
    'Cancer cells travel through the bloodstream to start new tumors in distant organs.',
    'Normal cells stop dividing after ~50 times. Cancer cells can divide indefinitely.',
    'Cancer cells reprogram their metabolism to consume glucose 10× faster than normal cells.',
    'The immune system silently destroys millions of potential cancer cells every day.',
    'Some cancer cells disguise themselves to avoid being recognized by the immune system.',
    'Cancer is not one disease — there are over 100 different types affecting different cells.',
  ],
};

const REVIVAL_QUESTIONS = {
  wbc: [
    {
      q: 'White blood cells are part of the immune system.',
      type: 'tf',
      answer: true,
    },
    {
      q: 'Which type of white blood cell produces antibodies?',
      type: 'mc',
      options: ['Neutrophil', 'B Cell', 'Red Blood Cell', 'Platelet'],
      answer: 1,
    },
    {
      q: 'How do vaccines work with white blood cells?',
      type: 'mc',
      options: ['They kill all bacteria instantly', 'They teach WBCs to recognize a pathogen', 'They make cells grow bigger', 'They block viruses from the body'],
      answer: 1,
    },
  ],
  bacteria: [
    {
      q: 'All bacteria are harmful to the human body.',
      type: 'tf',
      answer: false,
    },
    {
      q: 'How do bacteria reproduce?',
      type: 'mc',
      options: ['Sexual reproduction', 'Budding', 'Binary fission', 'Photosynthesis'],
      answer: 2,
    },
    {
      q: 'Bacteria can double their population every 20 minutes under ideal conditions.',
      type: 'tf',
      answer: true,
    },
  ],
  virus: [
    {
      q: 'Viruses are considered living organisms.',
      type: 'tf',
      answer: false,
    },
    {
      q: 'What do viruses need in order to reproduce?',
      type: 'mc',
      options: ['Sunlight', 'A host cell', 'Water', 'Oxygen'],
      answer: 1,
    },
    {
      q: 'Why do flu vaccines need to be updated every year?',
      type: 'mc',
      options: ['Vaccines expire quickly', 'Flu disappears each season', 'Viruses mutate rapidly', 'Doctors change the formula randomly'],
      answer: 2,
    },
  ],
  cancer: [
    {
      q: 'Cancer cells grow and divide in an uncontrolled way.',
      type: 'tf',
      answer: true,
    },
    {
      q: 'What is it called when cancer spreads to other parts of the body?',
      type: 'mc',
      options: ['Inflammation', 'Angiogenesis', 'Mutation', 'Metastasis'],
      answer: 3,
    },
    {
      q: 'The immune system can detect and destroy some cancer cells.',
      type: 'tf',
      answer: true,
    },
  ],
};

function RevivalQuiz({ question, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);

  const options = question.type === 'tf' ? ['False', 'True'] : question.options;
  const correctIdx = question.type === 'tf' ? (question.answer ? 1 : 0) : question.answer;

  const handleSelect = (i) => {
    if (result) return;
    setSelected(i);
    const isCorrect = i === correctIdx;
    setResult(isCorrect ? 'correct' : 'wrong');
    setTimeout(() => onAnswer(isCorrect), 1400);
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/65 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="w-full max-w-md px-4"
      >
        <div className="rounded-2xl bg-white p-6 shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-red-500">You were eliminated!</p>
          <p className="mt-0.5 text-xs text-gray-400">Answer correctly to revive immediately</p>
          <p className="mt-4 font-heading text-lg font-bold leading-snug text-gray-900">{question.q}</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {options.map((opt, i) => {
              let cls = 'rounded-xl border-2 px-3 py-3 text-sm font-medium text-left transition-all ';
              if (result === null) {
                cls += 'border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer';
              } else if (i === correctIdx) {
                cls += 'border-green-400 bg-green-50 text-green-700';
              } else if (selected === i) {
                cls += 'border-red-400 bg-red-50 text-red-700';
              } else {
                cls += 'border-gray-100 opacity-40';
              }
              return (
                <button key={i} className={cls} onClick={() => handleSelect(i)}>
                  {opt}
                </button>
              );
            })}
          </div>
          {result && (
            <p className={`mt-4 text-center text-sm font-bold ${result === 'correct' ? 'text-green-600' : 'text-red-500'}`}>
              {result === 'correct' ? '✓ Correct! Reviving...' : '✗ Incorrect. Respawning shortly...'}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function FunFactBanner({ fact, visible }) {
  return (
    <AnimatePresence>
      {visible && fact && (
        <motion.div
          initial={{ y: -90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -90, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          className="fixed top-4 left-0 right-0 z-20 mx-auto flex justify-center px-4"
        >
          <div className="w-full max-w-lg rounded-2xl border border-white/20 bg-black/75 px-5 py-3 text-center shadow-2xl backdrop-blur-md">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-yellow-300">
              Fun Fact
            </span>
            <p className="text-sm leading-5 text-white">{fact}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AbilityButton({ role, cooldown, active, onActivate }) {
  const cfg = ABILITY_CONFIG[role];
  if (!cfg) return null;
  const onCooldown = cooldown > 0;
  const circumference = 2 * Math.PI * 28;
  const dashOffset = circumference * (onCooldown ? cooldown / cfg.cooldown : 0);

  return (
    <div className="absolute bottom-[170px] right-4 z-10 flex flex-col items-center gap-1">
      <button
        onClick={onActivate}
        disabled={onCooldown}
        style={{ borderColor: active ? cfg.color : undefined }}
        className={`relative w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-sm border-2 transition-all
          ${active ? 'border-yellow-300 bg-yellow-400/20 text-yellow-200' :
            onCooldown ? 'border-white/20 bg-black/50 text-white/40 cursor-not-allowed' :
            'border-white/40 bg-black/60 text-white hover:bg-black/80 cursor-pointer'}`}
      >
        <svg className="absolute inset-0" width="64" height="64" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
          {onCooldown && (
            <circle
              cx="32" cy="32" r="28"
              fill="none"
              stroke="rgba(255,255,255,0.65)"
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 32 32)"
            />
          )}
        </svg>
        <span className="relative z-10 text-xs font-bold text-center leading-tight px-1">
          {active ? 'ACTIVE' : onCooldown ? `${Math.ceil(cooldown)}s` : cfg.name.split(' ')[0]}
        </span>
      </button>
      <span className="text-[10px] text-white/60 bg-black/40 rounded px-2 py-0.5 font-body whitespace-nowrap">
        {cfg.name}
      </span>
    </div>
  );
}

function getPlayerSyncSnapshot(player, team) {
  return {
    x: player.x,
    y: player.y,
    angle: player.angle || 0,
    score: Math.round(player.score),
    size: player.radius,
    is_eliminated: !player.alive,
    role: player.role,
    team,
  };
}

function shouldPublishPlayerState(previous, next) {
  if (!previous) return true;

  const moved = Math.hypot(next.x - previous.x, next.y - previous.y);
  return (
    moved > PLAYER_SYNC_DISTANCE_THRESHOLD ||
    Math.abs(next.angle - previous.angle) > PLAYER_SYNC_ANGLE_THRESHOLD ||
    next.score !== previous.score ||
    Math.abs(next.size - previous.size) > 0.4 ||
    next.is_eliminated !== previous.is_eliminated ||
    next.role !== previous.role ||
    next.team !== previous.team
  );
}

export default function GameCanvas({ playerName, players = [], roomId, playerId, playerTeam = 'defender', playerRole = 'wbc' }) {
  const canvasRef = useRef(null);
  const gameStateRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef(null);
  const isLeavingRef = useRef(false);
  const lastTimeRef = useRef(0);
  const lastSyncRef = useRef(0);
  const lastPublishedStateRef = useRef(null);
  const syncInFlightRef = useRef(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState(null);
  const [abilityState, setAbilityState] = useState({ cooldown: 0, active: false, duration: 0 });
  const [funFact, setFunFact] = useState('');
  const [showFact, setShowFact] = useState(false);
  const factTimerRef = useRef(null);
  const lastFactTimeRef = useRef(0);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const quizShownRef = useRef(false);

  useEffect(() => {
    initGameImages({
      wbc: imgWhiteBloodCell,
      rbc: imgRedBloodCell,
      bacteria: imgSingleBacteria,
      virus: imgVirus,
      cancer: imgCancerCell,
    });
  }, []);

  const markPlayerLeft = useCallback(async () => {
    if (!playerId || isLeavingRef.current) {
      return;
    }

    isLeavingRef.current = true;
    await leaveRoomPlayer(playerId);
  }, [playerId]);

  const publishPlayerState = useCallback((force = false) => {
    if (!roomId || !playerId || isLeavingRef.current || syncInFlightRef.current) {
      return;
    }

    const player = gameStateRef.current?.player;
    if (!player) {
      return;
    }

    const snapshot = getPlayerSyncSnapshot(player, playerTeam);
    if (!force && !shouldPublishPlayerState(lastPublishedStateRef.current, snapshot)) {
      return;
    }

    syncInFlightRef.current = true;
    updateRoomPlayerState(playerId, snapshot)
      .then(() => {
        lastPublishedStateRef.current = snapshot;
      })
      .catch((error) => {
        console.error('Failed to sync player state', error);
      })
      .finally(() => {
        syncInFlightRef.current = false;
      });
  }, [playerId, playerTeam, roomId]);

  // Initialize game state
  useEffect(() => {
    const existingPlayerSlots = roomId ? Array.from({ length: 3 }) : players;
    gameStateRef.current = createGameState(playerName, existingPlayerSlots, playerTeam, playerRole);
    if (playerId) {
      gameStateRef.current.player.id = playerId;
    }
    lastPublishedStateRef.current = null;
    syncInFlightRef.current = false;
    setGameState(gameStateRef.current);
    publishPlayerState(true);
  }, [playerName, playerId, playerRole, playerTeam, players, publishPlayerState, roomId]);

  useEffect(() => {
    if (!roomId || !playerId) return undefined;

    const handlePageHide = () => {
      markPlayerLeft().catch((error) => {
        console.error('Failed to leave game during page close', error);
      });
    };

    window.addEventListener('pagehide', handlePageHide);

    const unsubscribe = subscribeToRoomPlayers(roomId, (roomPlayers) => {
      const state = gameStateRef.current;
      if (!state) return;

      state.otherPlayers = roomPlayers
        .filter((player) => player.id !== playerId && !player.is_eliminated)
        .map(mapRoomPlayerToGamePlayer);

      setLeaderboard(getLeaderboard(state));
      setGameState({ ...state });
    });

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      unsubscribe();
    };
  }, [roomId, playerId, markPlayerLeft]);

  // Handle mouse/touch movement
  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouseRef.current.y = (e.clientY - rect.top) * (canvas.height / rect.height);
  }, []);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas || !touch) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = (touch.clientX - rect.left) * (canvas.width / rect.width);
    mouseRef.current.y = (touch.clientY - rect.top) * (canvas.height / rect.height);
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let leaderboardTimer = 0;

    const gameLoop = (timestamp) => {
      const dt = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0.016;
      lastTimeRef.current = timestamp;

      if (gameStateRef.current) {
        updateGameState(
          gameStateRef.current,
          mouseRef.current.x,
          mouseRef.current.y,
          canvas.width,
          canvas.height,
          dt
        );
        renderGame(ctx, gameStateRef.current, canvas.width, canvas.height);

        // Fun fact banner
        if (gameStateRef.current.funFactTrigger) {
          const role = gameStateRef.current.funFactTrigger;
          gameStateRef.current.funFactTrigger = null;
          const now = performance.now();
          if (now - lastFactTimeRef.current > 3000) {
            lastFactTimeRef.current = now;
            const facts = FUN_FACTS[role] || FUN_FACTS.wbc;
            setFunFact(facts[Math.floor(Math.random() * facts.length)]);
            setShowFact(true);
            if (factTimerRef.current) clearTimeout(factTimerRef.current);
            factTimerRef.current = setTimeout(() => setShowFact(false), 3500);
          }
        }

        if (!isLeavingRef.current && roomId && playerId && timestamp - lastSyncRef.current > PLAYER_SYNC_INTERVAL_MS) {
          lastSyncRef.current = timestamp;
          publishPlayerState();
        }

        // Update React state periodically (not every frame for performance)
        leaderboardTimer += dt;
        if (leaderboardTimer > 0.5) {
          leaderboardTimer = 0;
          setLeaderboard(getLeaderboard(gameStateRef.current));
          setScore(gameStateRef.current.player.score);
          setGameState({ ...gameStateRef.current });
          const { abilityCooldown, abilityActive, abilityDuration, alive, quizPending } = gameStateRef.current.player;
          setAbilityState({ cooldown: abilityCooldown, active: abilityActive, duration: abilityDuration });

          // Revival quiz detection
          if (!alive && quizPending && !quizShownRef.current) {
            quizShownRef.current = true;
            const questions = REVIVAL_QUESTIONS[playerRole] || REVIVAL_QUESTIONS.wbc;
            setActiveQuiz(questions[Math.floor(Math.random() * questions.length)]);
          }
          if (alive) {
            quizShownRef.current = false;
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [playerId, publishPlayerState, roomId]);

  const handleQuizAnswer = useCallback((isCorrect) => {
    setActiveQuiz(null);
    quizShownRef.current = false;
    if (!gameStateRef.current) return;
    const { player } = gameStateRef.current;
    const savedRadius = player.preDeathRadius || player.radius;
    player.quizPending = false;
    player.preDeathRadius = null;
    player.radius = savedRadius;
    player.maxRadius = savedRadius;
    if (isCorrect) {
      player.alive = true;
      player.x = Math.random() * 4000;
      player.y = Math.random() * 4000;
    } else {
      player.respawnTimer = 3;
      player.score = 0;
    }
  }, []);

  const handleAbility = useCallback(() => {
    if (gameStateRef.current) {
      activateAbility(gameStateRef.current);
      const { abilityCooldown, abilityActive, abilityDuration } = gameStateRef.current.player;
      setAbilityState({ cooldown: abilityCooldown, active: abilityActive, duration: abilityDuration });
    }
  }, []);

  const handleLeaveGame = async () => {
    try {
      await markPlayerLeft();
    } catch (error) {
      console.error('Failed to leave game', error);
    } finally {
      localStorage.removeItem('bd_player_id');
      localStorage.removeItem('bd_room_id');
      window.location.href = '/';
    }
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-none touch-none"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchMove}
      />
      <FunFactBanner fact={funFact} visible={showFact} />
      {activeQuiz && <RevivalQuiz question={activeQuiz} onAnswer={handleQuizAnswer} />}
      <ScoreDisplay score={score} playerName={playerName} />
      <Leaderboard entries={leaderboard} />
      {gameState && <Minimap gameState={gameState} />}

      {/* Ability button */}
      <AbilityButton
        role={playerRole}
        cooldown={abilityState.cooldown}
        active={abilityState.active}
        onActivate={handleAbility}
      />

      {/* Back button */}
      <button
        onClick={handleLeaveGame}
        className="absolute bottom-4 left-4 z-10 bg-black/60 backdrop-blur-sm text-white/70 hover:text-white rounded-lg px-3 py-2 text-xs font-body transition-colors"
      >
        ← Leave Game
      </button>
    </div>
  );
}
