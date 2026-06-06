import LiquidEther from './LiquidEther';
import './Background.css';

export default function Background() {
  return (
    <div className="background">
      <LiquidEther
        colors={['#39ff14', '#4ade80', '#86efac']}
        mouseForce={40}
        cursorSize={160}
        resolution={0.5}
        autoDemo={true}
        autoSpeed={1.2}
        autoIntensity={12}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
