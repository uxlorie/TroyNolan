import Shuffle from './Shuffle';
import './Hero.css';

function scrollToSnake(e) {
  e.preventDefault();
  document.getElementById('snake')?.scrollIntoView({ behavior: 'smooth' });
}

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero__content">
        <img
          className="hero__photo"
          src="/troynolan.png"
          alt="Troy Nolan Thompson"
        />
        <Shuffle
          text="Troy Nolan Thompson"
          tag="h1"
          className="hero__name"
          style={{ textAlign: 'inherit' }}
          shuffleDirection="right"
          duration={0.35}
          animationMode="evenodd"
          shuffleTimes={1}
          ease="power3.out"
          stagger={0.03}
          threshold={0}
          rootMargin="0px"
          triggerOnce={true}
          triggerOnHover={true}
          respectReducedMotion={true}
        />
      </div>

      <a
        href="#snake"
        className="hero__scroll"
        aria-label="Scroll down to play Snake"
        onClick={scrollToSnake}
      >
        <span className="hero__scroll-label">Play Snake</span>
        <svg
          className="hero__scroll-arrow"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 4v14M6 14l6 6 6-6" />
        </svg>
      </a>
    </section>
  );
}
