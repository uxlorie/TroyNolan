import Shuffle from './Shuffle';
import './Hero.css';

const DETAILS = [
  {
    label: 'honor roll student',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 2 8l10 5 10-5-10-5Z" />
        <path d="M6 10v4.5c0 1.5 2.7 3 6 3s6-1.5 6-3V10" />
        <path d="M20 8v6" />
      </svg>
    )
  },
  {
    label: 'tennis player',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="9" r="6.5" />
        <path d="M14.5 14.5 21 21" />
        <path d="M6 6l6 6M12 6 6 12" />
      </svg>
    )
  },
  {
    label: 'gamer',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 11h4v4H6v-4Zm8 0h2v2h2v-2h2v-2h-2V7h-2v2h-2v2Z" />
        <path d="M6 7h12a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4Z" />
      </svg>
    )
  }
];

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
        <div className="hero__text">
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
          <ul className="hero__details">
            {DETAILS.map(({ label, icon }) => (
              <li key={label} className="hero__detail">
                <span className="hero__detail-icon">{icon}</span>
                <span className="hero__detail-label">{label}</span>
              </li>
            ))}
          </ul>
        </div>
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
