import type { SceneKind } from '../data/rooms';

// Animated cyber-fantasy backdrop. Pure CSS layers so it's smooth and free.
// Sits behind the lesson content (pointer-events: none).
export function RoomScene({ scene }: { scene: SceneKind }) {
  return (
    <div className="scene" aria-hidden>
      {scene === 'galaxy' && (
        <>
          <div className="scene-stars" />
          <div className="scene-stars scene-stars-2" />
          <div className="scene-planet" />
          <div className="scene-orb scene-orb-a" />
          <div className="scene-orb scene-orb-b" />
        </>
      )}
      {scene === 'neon-city' && (
        <>
          <div className="scene-stars" />
          <div className="scene-city" />
          <div className="scene-rain" />
          <div className="scene-glow scene-glow-a" />
          <div className="scene-glow scene-glow-b" />
        </>
      )}
      {scene === 'aurora' && (
        <>
          <div className="scene-stars" />
          <div className="scene-aurora scene-aurora-a" />
          <div className="scene-aurora scene-aurora-b" />
          <div className="scene-aurora scene-aurora-c" />
        </>
      )}
      {scene === 'cyber-grid' && (
        <>
          <div className="scene-stars" />
          <div className="scene-sun" />
          <div className="scene-grid" />
          <div className="scene-glow scene-glow-a" />
        </>
      )}
      {scene === 'princess' && (
        <>
          <div className="scene-stars" />
          <div className="scene-castle" />
          <div className="scene-sparkles" />
          <div className="scene-glow scene-glow-pink" />
          <div className="scene-glow scene-glow-gold" />
          <div className="scene-diamonds">
            <span>💎</span><span>✨</span><span>👑</span><span>💎</span><span>⭐</span><span>✨</span>
          </div>
        </>
      )}
    </div>
  );
}
