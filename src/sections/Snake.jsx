import { useEffect, useRef, useState, useCallback } from 'react';
import { useBackgroundPause } from '../context/BackgroundPauseContext';
import {
  loadLeaderboard,
  qualifiesForLeaderboard,
  addLeaderboardEntry
} from './snakeLeaderboard';
import './Snake.css';

const TICK_MS = { desktop: 320, mobile: 400 };
const INITIAL_LENGTH = 3;

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

function isMobileLayout() {
  return window.matchMedia('(max-width: 767px), (hover: none) and (pointer: coarse)').matches;
}

function getTickMs() {
  return isMobileLayout() ? TICK_MS.mobile : TICK_MS.desktop;
}

function getDpr() {
  return Math.min(window.devicePixelRatio || 1, 2);
}

function getLogicalSize(canvas) {
  const dpr = getDpr();
  return { w: canvas.width / dpr, h: canvas.height / dpr, dpr };
}

function getGrid(w, h) {
  const targetCols = 16;
  const cell = Math.max(12, Math.floor(Math.min(w, h) / targetCols));
  const cols = Math.floor(w / cell);
  const rows = Math.floor(h / cell);
  return { cols, rows, cell };
}

function spawnFood(snake, cols, rows) {
  const occupied = new Set(snake.map((s) => `${s.x},${s.y}`));
  const empty = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!occupied.has(`${x},${y}`)) empty.push({ x, y });
    }
  }
  if (!empty.length) return null;
  return empty[Math.floor(Math.random() * empty.length)];
}

function createInitialState(cols, rows) {
  const startX = Math.min(cols - 2, Math.max(INITIAL_LENGTH, Math.floor(cols / 2)));
  const startY = Math.floor(rows / 2);
  const snake = Array.from({ length: INITIAL_LENGTH }, (_, i) => ({
    x: startX - i,
    y: startY
  }));

  return {
    snake,
    direction: DIRECTIONS.right,
    pendingDirection: DIRECTIONS.right,
    food: spawnFood(snake, cols, rows),
    score: 0
  };
}

function isOpposite(a, b) {
  return a.x === -b.x && a.y === -b.y;
}

function drawFood(ctx, x, y, size) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size * 0.38;

  const gradient = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
  gradient.addColorStop(0, '#eaff6b');
  gradient.addColorStop(1, '#9bc42a');

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
}

export default function Snake() {
  const setBackgroundPaused = useBackgroundPause();
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const arenaRef = useRef(null);
  const stateRef = useRef(null);
  const gridRef = useRef(null);
  const gameOverRef = useRef(false);
  const tickMsRef = useRef(getTickMs());
  const lastTickRef = useRef(0);
  const rafRef = useRef(null);
  const swipeStartRef = useRef(null);

  const handleGameEndRef = useRef(() => {});

  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('Eat the dots to grow!');
  const [gameOver, setGameOver] = useState(false);
  const [leaderboard, setLeaderboard] = useState(() => loadLeaderboard());
  const [showInitialsEntry, setShowInitialsEntry] = useState(false);
  const [pendingScore, setPendingScore] = useState(0);
  const [initials, setInitials] = useState('');

  const handleGameEnd = useCallback((finalScore) => {
    if (qualifiesForLeaderboard(finalScore, loadLeaderboard())) {
      setPendingScore(finalScore);
      setInitials('');
      setShowInitialsEntry(true);
    }
  }, []);

  handleGameEndRef.current = handleGameEnd;

  const queueDirection = useCallback((dir) => {
    const state = stateRef.current;
    if (!state || gameOverRef.current) return;
    if (!isOpposite(dir, state.pendingDirection)) {
      state.pendingDirection = dir;
    }
  }, []);

  const initState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h } = getLogicalSize(canvas);
    const grid = getGrid(w, h);
    gridRef.current = grid;
    stateRef.current = createInitialState(grid.cols, grid.rows);
    gameOverRef.current = false;
    lastTickRef.current = 0;
    setScore(0);
    setGameOver(false);
    setShowInitialsEntry(false);
    setPendingScore(0);
    setInitials('');
    setMessage('Eat the dots to grow!');
  }, []);

  const handleSaveInitials = (e) => {
    e.preventDefault();
    if (initials.length !== 3) return;
    const savedInitials = initials;
    const savedScore = pendingScore;
    const updated = addLeaderboardEntry(savedInitials, savedScore);
    setLeaderboard(updated);
    setShowInitialsEntry(false);
    setPendingScore(0);
    setInitials('');
    setMessage(`Nice! ${savedInitials} scored ${savedScore}`);
  };

  const handleDirectionTap = (dir) => ({
    onPointerDown: (e) => {
      e.preventDefault();
      queueDirection(dir);
      e.currentTarget.classList.add('is-active');
    },
    onPointerUp: (e) => {
      e.currentTarget.classList.remove('is-active');
    },
    onPointerLeave: (e) => {
      e.currentTarget.classList.remove('is-active');
    }
  });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        setBackgroundPaused(entry.isIntersecting && entry.intersectionRatio >= 0.15);
      },
      { threshold: [0, 0.15, 0.3, 0.5] }
    );

    io.observe(section);
    return () => {
      io.disconnect();
      setBackgroundPaused(false);
    };
  }, [setBackgroundPaused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const arena = arenaRef.current;
    if (!canvas || !arena) return;

    let active = true;

    const resize = () => {
      tickMsRef.current = getTickMs();
      const rect = arena.getBoundingClientRect();
      const dpr = getDpr();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));

      const { w, h } = getLogicalSize(canvas);
      const grid = getGrid(w, h);
      gridRef.current = grid;

      if (!stateRef.current) {
        stateRef.current = createInitialState(grid.cols, grid.rows);
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(arena);

    const onKeyDown = (e) => {
      const map = {
        ArrowUp: DIRECTIONS.up,
        ArrowDown: DIRECTIONS.down,
        ArrowLeft: DIRECTIONS.left,
        ArrowRight: DIRECTIONS.right,
        w: DIRECTIONS.up,
        W: DIRECTIONS.up,
        s: DIRECTIONS.down,
        S: DIRECTIONS.down,
        a: DIRECTIONS.left,
        A: DIRECTIONS.left,
        d: DIRECTIONS.right,
        D: DIRECTIONS.right
      };
      if (map[e.key]) {
        e.preventDefault();
        queueDirection(map[e.key]);
      }
    };

    const onTouchStart = (e) => {
      const touch = e.touches[0];
      swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const onTouchEnd = (e) => {
      if (!swipeStartRef.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - swipeStartRef.current.x;
      const dy = touch.clientY - swipeStartRef.current.y;
      swipeStartRef.current = null;

      if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;

      if (Math.abs(dx) > Math.abs(dy)) {
        queueDirection(dx > 0 ? DIRECTIONS.right : DIRECTIONS.left);
      } else {
        queueDirection(dy > 0 ? DIRECTIONS.down : DIRECTIONS.up);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });

    const step = () => {
      const state = stateRef.current;
      const grid = gridRef.current;
      if (!state || !grid || gameOverRef.current) return;

      state.direction = state.pendingDirection;

      const head = state.snake[0];
      const newHead = {
        x: head.x + state.direction.x,
        y: head.y + state.direction.y
      };

      const hitWall =
        newHead.x < 0 || newHead.y < 0 || newHead.x >= grid.cols || newHead.y >= grid.rows;

      const willEat = state.food && newHead.x === state.food.x && newHead.y === state.food.y;
      const bodyToCheck = willEat ? state.snake : state.snake.slice(0, -1);
      const hitSelf = bodyToCheck.some((seg) => seg.x === newHead.x && seg.y === newHead.y);

      if (hitWall || hitSelf) {
        gameOverRef.current = true;
        setGameOver(true);
        setMessage(`Game over! Score: ${state.score}`);
        handleGameEndRef.current(state.score);
        return;
      }

      state.snake.unshift(newHead);

      if (willEat) {
        state.score += 1;
        setScore(state.score);
        state.food = spawnFood(state.snake, grid.cols, grid.rows);
        if (!state.food) {
          gameOverRef.current = true;
          setGameOver(true);
          setMessage('You win! Board full!');
          handleGameEndRef.current(state.score);
        }
      } else {
        state.snake.pop();
      }
    };

    const draw = () => {
      const ctx = canvas.getContext('2d');
      const state = stateRef.current;
      const grid = gridRef.current;
      if (!ctx || !state || !grid) return;

      const { w, h, dpr } = getLogicalSize(canvas);
      const { cols, rows, cell } = grid;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const offsetX = (w - cols * cell) / 2;
      const offsetY = (h - rows * cell) / 2;

      state.snake.forEach((seg, i) => {
        const px = offsetX + seg.x * cell;
        const py = offsetY + seg.y * cell;
        const pad = 2;

        ctx.fillStyle = i === 0 ? '#86efac' : '#4ade80';
        ctx.fillRect(px + pad, py + pad, cell - pad * 2, cell - pad * 2);
      });

      if (state.food) {
        drawFood(
          ctx,
          offsetX + state.food.x * cell,
          offsetY + state.food.y * cell,
          cell
        );
      }
    };

    const tick = (now) => {
      if (!active || document.hidden) {
        lastTickRef.current = now;
        rafRef.current = requestAnimationFrame(tick);
        draw();
        return;
      }

      if (!lastTickRef.current) lastTickRef.current = now;

      const elapsed = now - lastTickRef.current;
      if (elapsed >= tickMsRef.current) {
        step();
        lastTickRef.current = now - (elapsed % tickMsRef.current);
      }

      draw();
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      active = false;
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [queueDirection]);

  return (
    <section className="snake" id="snake" ref={sectionRef}>
      <h2 className="snake__title">Snake</h2>

      <div className="snake__scoreboard">Score: {score}</div>

      <div className="snake__playfield">
        <div className="snake__arena" ref={arenaRef}>
          <canvas ref={canvasRef} className="snake__canvas" />
        </div>

        <div className="snake__controls" aria-label="Direction controls">
          <button
            type="button"
            className="snake__control-btn snake__control-btn--up"
            aria-label="Move up"
            {...handleDirectionTap(DIRECTIONS.up)}
          >
            ▲
          </button>
          <button
            type="button"
            className="snake__control-btn snake__control-btn--left"
            aria-label="Move left"
            {...handleDirectionTap(DIRECTIONS.left)}
          >
            ◀
          </button>
          <button
            type="button"
            className="snake__control-btn snake__control-btn--down"
            aria-label="Move down"
            {...handleDirectionTap(DIRECTIONS.down)}
          >
            ▼
          </button>
          <button
            type="button"
            className="snake__control-btn snake__control-btn--right"
            aria-label="Move right"
            {...handleDirectionTap(DIRECTIONS.right)}
          >
            ▶
          </button>
        </div>
      </div>

      <p className="snake__message">{message}</p>

      {!gameOver && (
        <>
          <p className="snake__hint snake__hint--desktop">
            Arrow keys or W A S D to steer
          </p>
          <p className="snake__hint snake__hint--mobile">
            Swipe on the board or use the direction pad
          </p>
        </>
      )}

      {gameOver && showInitialsEntry && (
        <div className="snake__initials">
          <p className="snake__initials-label">Top 10! Enter your initials</p>
          <form className="snake__initials-form" onSubmit={handleSaveInitials}>
            <input
              className="snake__initials-input"
              type="text"
              value={initials}
              onChange={(e) =>
                setInitials(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))
              }
              maxLength={3}
              placeholder="ABC"
              aria-label="Three letter initials"
              autoComplete="off"
              autoFocus
            />
            <button
              type="submit"
              className="snake__initials-save"
              disabled={initials.length !== 3}
            >
              Save
            </button>
          </form>
        </div>
      )}

      {gameOver && (
        <button type="button" className="snake__restart" onClick={initState}>
          Play Again
        </button>
      )}

      <div className="snake__leaderboard">
        <h3 className="snake__leaderboard-title">Leaderboard</h3>
        {leaderboard.length === 0 ? (
          <p className="snake__leaderboard-empty">No scores yet — be the first!</p>
        ) : (
          <ol className="snake__leaderboard-list">
            {leaderboard.map((entry, index) => (
              <li key={`${entry.initials}-${entry.score}-${entry.date}`} className="snake__leaderboard-item">
                <span className="snake__leaderboard-rank">{index + 1}.</span>
                <span>{entry.initials}</span>
                <span>{entry.score}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
