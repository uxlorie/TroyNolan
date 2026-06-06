import LiquidEther from './LiquidEther';
import './Background.css';

export default function Background({ paused = false }) {
  return (
    <div className="background">
      <LiquidEther
        paused={paused}
        colors={['#14532d', '#166534', '#1e3a2f']}
        mouseForce={12}
        cursorSize={80}
        resolution={0.4}
        autoDemo={true}
        autoSpeed={0.35}
        autoIntensity={3}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
