import Shuffle from './Shuffle';
import './Hero.css';

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
    </section>
  );
}
