import { useEffect, useRef, useState } from 'react';

export type AvatarMood = 'idle' | 'speaking' | 'happy' | 'thinking' | 'cheer';

/**
 * Brings a still portrait to life:
 *  - gentle idle "breathing" float
 *  - periodic blink (dark eyelid sweep)
 *  - lip-sync: a soft mouth-motion overlay pulses while `speaking`
 *  - mood glow + subtle tilt for happy/thinking/cheer
 *
 * `imageSrc` is a data URL (uploaded by the caregiver) or undefined
 * (falls back to an emoji placeholder so the app always works).
 */
export function AnimatedAvatar({
  imageSrc,
  mood,
  accent = '#e0925c',
  size = 260,
  fallbackGlyph = '🧑\u200d🎓',
}: {
  imageSrc?: string;
  mood: AvatarMood;
  accent?: string;
  size?: number;
  fallbackGlyph?: string;
}) {
  const [blink, setBlink] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(false);
  const mouthTimer = useRef<number | null>(null);

  // Periodic natural blinking.
  useEffect(() => {
    let timeout: number;
    const scheduleBlink = () => {
      const delay = 2200 + Math.random() * 2600;
      timeout = window.setTimeout(() => {
        setBlink(true);
        window.setTimeout(() => setBlink(false), 140);
        scheduleBlink();
      }, delay);
    };
    scheduleBlink();
    return () => window.clearTimeout(timeout);
  }, []);

  // Lip-sync: while speaking, flap the mouth overlay at a lively cadence.
  useEffect(() => {
    if (mood === 'speaking') {
      const tick = () => {
        setMouthOpen((o) => !o);
        mouthTimer.current = window.setTimeout(tick, 90 + Math.random() * 80);
      };
      tick();
    } else {
      setMouthOpen(false);
      if (mouthTimer.current) window.clearTimeout(mouthTimer.current);
    }
    return () => {
      if (mouthTimer.current) window.clearTimeout(mouthTimer.current);
    };
  }, [mood]);

  const tilt = mood === 'happy' || mood === 'cheer' ? -2 : mood === 'thinking' ? 2 : 0;
  const bob = mood === 'cheer' ? 'avatar-cheer' : 'avatar-idle';

  return (
    <div
      className={`avatar-stage ${bob}`}
      style={{
        width: size,
        height: size,
        // Mood glow ring
        boxShadow:
          mood === 'speaking'
            ? `0 0 0 4px ${accent}, 0 0 34px ${accent}aa`
            : mood === 'happy' || mood === 'cheer'
              ? `0 0 0 3px ${accent}, 0 0 26px ${accent}88`
              : `0 0 0 2px ${accent}55`,
        transform: `rotate(${tilt}deg)`,
      }}
    >
      {imageSrc ? (
        <img className="avatar-photo" src={imageSrc} alt="Your tutor" draggable={false} />
      ) : (
        <div className="avatar-photo avatar-fallback" aria-hidden>
          {fallbackGlyph}
        </div>
      )}

      {/* Blink overlay: a quick soft shade across the upper face. */}
      <div className={`avatar-blink ${blink ? 'on' : ''}`} />

      {/* Lip-sync overlay: subtle shadow near the mouth that pulses. */}
      {imageSrc && (
        <div
          className="avatar-mouth"
          style={{
            opacity: mood === 'speaking' ? (mouthOpen ? 0.28 : 0.05) : 0,
            transform: `scaleY(${mouthOpen ? 1.4 : 0.6})`,
          }}
        />
      )}

      {/* Speaking sound waves for extra "alive" feel + accessibility cue. */}
      {mood === 'speaking' && (
        <div className="avatar-waves" aria-hidden>
          <span style={{ background: accent }} />
          <span style={{ background: accent }} />
          <span style={{ background: accent }} />
        </div>
      )}
    </div>
  );
}
