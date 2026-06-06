import { useEffect, useRef, useState, useCallback } from 'react';
import { useBackgroundPause } from '../context/BackgroundPauseContext';
import './Pong.css';

const WIN_SCORE = 5;
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 80;
const BALL_RADIUS = 11;
const PADDLE_MARGIN = 16;
const SPEEDS = {
  desktop: { ball: 5, ai: 4.2, paddle: 6 },
  mobile: { ball: 3, ai: 3, paddle: 5 }
};

function isMobileLayout() {
  return window.matchMedia('(max-width: 767px), (hover: none) and (pointer: coarse)').matches;
}

function getSpeeds() {
  return isMobileLayout() ? SPEEDS.mobile : SPEEDS.desktop;
}

function getDpr() {
  return Math.min(window.devicePixelRatio || 1, 2);
}

function getLogicalSize(canvas) {
  const dpr = getDpr();
  return { w: canvas.width / dpr, h: canvas.height / dpr, dpr };
}

function drawTennisBall(ctx, x, y, radius) {
  ctx.save();
  ctx.translate(x, y);

  const gradient = ctx.createRadialGradient(
    -radius * 0.35,
    -radius * 0.35,
    radius * 0.1,
    0,
    0,
    radius
  );
  gradient.addColorStop(0, '#eaff6b');
  gradient.addColorStop(0.55, '#c6e836');
  gradient.addColorStop(1, '#8fb82a');

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = Math.max(2, radius * 0.14);
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.arc(-radius * 0.12, 0, radius * 0.72, -Math.PI * 0.52, Math.PI * 0.52);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(radius * 0.12, 0, radius * 0.72, Math.PI * 0.48, Math.PI * 1.52);
  ctx.stroke();

  ctx.restore();
}

function createBall(w, h, direction = 1, ballSpeed = SPEEDS.desktop.ball) {
  const angle = (Math.random() * Math.PI) / 3 - Math.PI / 6;
  return {
    x: w / 2,
    y: h / 2,
    vx: Math.cos(angle) * ballSpeed * direction,
    vy: Math.sin(angle) * ballSpeed
  };
}

function bindHold(keysRef, direction) {
  return {
    onPointerDown: (e) => {
      e.preventDefault();
      keysRef.current[direction] = true;
      e.currentTarget.classList.add('is-active');
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerUp: (e) => {
      keysRef.current[direction] = false;
      e.currentTarget.classList.remove('is-active');
    },
    onPointerLeave: (e) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) {
        keysRef.current[direction] = false;
        e.currentTarget.classList.remove('is-active');
      }
    },
    onPointerCancel: (e) => {
      keysRef.current[direction] = false;
      e.currentTarget.classList.remove('is-active');
    }
  };
}

export default function Pong() {
  const setBackgroundPaused = useBackgroundPause();
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const arenaRef = useRef(null);
  const keysRef = useRef({ up: false, down: false });
  const touchYRef = useRef(null);
  const stateRef = useRef(null);
  const scoresRef = useRef({ player: 0, ai: 0 });
  const gameOverRef = useRef(false);
  const speedRef = useRef(getSpeeds());
  const rafRef = useRef(null);

  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [message, setMessage] = useState('First to 5 wins!');
  const [gameOver, setGameOver] = useState(false);

  const serveBall = useCallback((direction) => {
    const canvas = canvasRef.current;
    const state = stateRef.current;
    if (!canvas || !state) return;
    const { w, h } = getLogicalSize(canvas);
    state.ball = createBall(w, h, direction, speedRef.current.ball);
  }, []);

  const resetGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { w, h } = getLogicalSize(canvas);

    stateRef.current = {
      playerY: h / 2 - PADDLE_HEIGHT / 2,
      aiY: h / 2 - PADDLE_HEIGHT / 2,
      ball: createBall(w, h, Math.random() > 0.5 ? 1 : -1, speedRef.current.ball)
    };

    scoresRef.current = { player: 0, ai: 0 };
    gameOverRef.current = false;

    setPlayerScore(0);
    setAiScore(0);
    setGameOver(false);
    setMessage('First to 5 wins!');
  }, []);

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

    const resize = () => {
      speedRef.current = getSpeeds();
      const rect = arena.getBoundingClientRect();
      const dpr = getDpr();
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));

      canvas.width = width;
      canvas.height = height;

      const { w, h } = getLogicalSize(canvas);

      if (!stateRef.current) {
        stateRef.current = {
          playerY: h / 2 - PADDLE_HEIGHT / 2,
          aiY: h / 2 - PADDLE_HEIGHT / 2,
          ball: createBall(w, h, 1, speedRef.current.ball)
        };
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(arena);

    const onKeyDown = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysRef.current.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keysRef.current.down = true;
    };

    const onKeyUp = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keysRef.current.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keysRef.current.down = false;
    };

    const onTouch = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const { h } = getLogicalSize(canvas);
      const scaleY = h / rect.height;
      touchYRef.current = (touch.clientY - rect.top) * scaleY;
    };

    const onTouchEnd = () => {
      touchYRef.current = null;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('touchstart', onTouch, { passive: false });
    canvas.addEventListener('touchmove', onTouch, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    const tick = () => {
      const ctx = canvas.getContext('2d');
      const { w, h, dpr } = getLogicalSize(canvas);
      const state = stateRef.current;

      if (!ctx || !state) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (!gameOverRef.current) {
        const { ball: ballSpeed, ai: aiSpeed, paddle: paddleSpeed } = speedRef.current;

        if (keysRef.current.up) state.playerY -= paddleSpeed;
        if (keysRef.current.down) state.playerY += paddleSpeed;
        if (touchYRef.current !== null) {
          state.playerY = touchYRef.current - PADDLE_HEIGHT / 2;
        }

        state.playerY = Math.max(0, Math.min(h - PADDLE_HEIGHT, state.playerY));

        const aiCenter = state.aiY + PADDLE_HEIGHT / 2;
        const ballCenter = state.ball.y;
        if (aiCenter < ballCenter - 8) state.aiY += aiSpeed;
        else if (aiCenter > ballCenter + 8) state.aiY -= aiSpeed;
        state.aiY = Math.max(0, Math.min(h - PADDLE_HEIGHT, state.aiY));

        state.ball.x += state.ball.vx;
        state.ball.y += state.ball.vy;

        if (state.ball.y - BALL_RADIUS <= 0) {
          state.ball.y = BALL_RADIUS;
          state.ball.vy *= -1;
        }
        if (state.ball.y + BALL_RADIUS >= h) {
          state.ball.y = h - BALL_RADIUS;
          state.ball.vy *= -1;
        }

        const playerX = PADDLE_MARGIN;
        const aiX = w - PADDLE_MARGIN - PADDLE_WIDTH;

        if (
          state.ball.vx < 0 &&
          state.ball.x - BALL_RADIUS <= playerX + PADDLE_WIDTH &&
          state.ball.x + BALL_RADIUS >= playerX &&
          state.ball.y >= state.playerY &&
          state.ball.y <= state.playerY + PADDLE_HEIGHT
        ) {
          state.ball.x = playerX + PADDLE_WIDTH + BALL_RADIUS;
          state.ball.vx = Math.abs(state.ball.vx) * 1.04;
          state.ball.vy += (state.ball.y - (state.playerY + PADDLE_HEIGHT / 2)) * 0.08;
        }

        if (
          state.ball.vx > 0 &&
          state.ball.x + BALL_RADIUS >= aiX &&
          state.ball.x - BALL_RADIUS <= aiX + PADDLE_WIDTH &&
          state.ball.y >= state.aiY &&
          state.ball.y <= state.aiY + PADDLE_HEIGHT
        ) {
          state.ball.x = aiX - BALL_RADIUS;
          state.ball.vx = -Math.abs(state.ball.vx) * 1.04;
          state.ball.vy += (state.ball.y - (state.aiY + PADDLE_HEIGHT / 2)) * 0.08;
        }

        const maxVy = ballSpeed * 2.2;
        state.ball.vy = Math.max(-maxVy, Math.min(maxVy, state.ball.vy));

        if (state.ball.x < 0) {
          scoresRef.current.ai += 1;
          setAiScore(scoresRef.current.ai);
          if (scoresRef.current.ai >= WIN_SCORE) {
            gameOverRef.current = true;
            setGameOver(true);
            setMessage('Computer wins! Play again?');
          } else {
            setMessage(`Computer scores! ${WIN_SCORE - scoresRef.current.ai} to win.`);
            serveBall(-1);
          }
        }

        if (state.ball.x > w) {
          scoresRef.current.player += 1;
          setPlayerScore(scoresRef.current.player);
          if (scoresRef.current.player >= WIN_SCORE) {
            gameOverRef.current = true;
            setGameOver(true);
            setMessage('Player One wins! Play again?');
          } else {
            setMessage(`Player One scores! ${WIN_SCORE - scoresRef.current.player} to win.`);
            serveBall(1);
          }
        }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(74, 222, 128, 0.2)';
      ctx.setLineDash([6, 10]);
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#4ade80';
      ctx.fillRect(PADDLE_MARGIN, state.playerY, PADDLE_WIDTH, PADDLE_HEIGHT);
      ctx.fillStyle = '#86efac';
      ctx.fillRect(w - PADDLE_MARGIN - PADDLE_WIDTH, state.aiY, PADDLE_WIDTH, PADDLE_HEIGHT);

      drawTennisBall(ctx, state.ball.x, state.ball.y, BALL_RADIUS);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('touchstart', onTouch);
      canvas.removeEventListener('touchmove', onTouch);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [serveBall]);

  const upHold = bindHold(keysRef, 'up');
  const downHold = bindHold(keysRef, 'down');

  return (
    <section className="pong" id="pong" ref={sectionRef}>
      <h2 className="pong__title">Pong</h2>

      <div className="pong__scoreboard">
        <span>Player One {playerScore}</span>
        <span className="pong__score-divider">—</span>
        <span>Computer {aiScore}</span>
      </div>

      <div className="pong__playfield">
        <div className="pong__controls" aria-label="Paddle controls">
          <button
            type="button"
            className="pong__control-btn"
            aria-label="Move paddle up"
            {...upHold}
          >
            ▲
          </button>
          <button
            type="button"
            className="pong__control-btn"
            aria-label="Move paddle down"
            {...downHold}
          >
            ▼
          </button>
        </div>

        <div className="pong__arena" ref={arenaRef}>
          <canvas ref={canvasRef} className="pong__canvas" />
        </div>
      </div>

      <p className="pong__message">{message}</p>

      {!gameOver && (
        <>
          <p className="pong__hint pong__hint--desktop">
            Use ↑ ↓ or W / S to move · On touch screens, drag on the court
          </p>
          <p className="pong__hint pong__hint--mobile">
            Tap ▲ ▼ to move · Or drag on the court
          </p>
        </>
      )}

      {gameOver && (
        <button type="button" className="pong__restart" onClick={resetGame}>
          Play Again
        </button>
      )}
    </section>
  );
}
