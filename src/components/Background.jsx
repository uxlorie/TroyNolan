import LiquidEther from './LiquidEther';
import './Background.css';

export default function Background() {
  return (
    <div className="background">
      <LiquidEther
        colors={['#39ff14', '#4ade80', '#86efac']}
        mouseForce={30}
        cursorSize={130}
        resolution={0.5}
        autoDemo={true}
        autoSpeed={0.9}
        autoIntensity={8}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
