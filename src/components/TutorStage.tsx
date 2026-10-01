import { useEffect, useRef, useState } from 'react';
import type { AnimeTutor } from '../data/animeTutors';
import { AnimatedAvatar, type AvatarMood } from './AnimatedAvatar';
import { getCachedVideo } from '../data/videoCache';

// Shows a pre-recorded talking-head VIDEO for the current spoken line when
// one is cached (instant, realistic) — otherwise the animated portrait.
// This is what makes pre-recorded lessons feel like real-time interaction.
export function TutorStage({
  tutor,
  imageSrc,
  mood,
  line,
  size = 400,
  videoEnabled,
}: {
  tutor: AnimeTutor;
  imageSrc?: string;
  mood: AvatarMood;
  /** The exact text the tutor is currently "saying". */
  line: string;
  size?: number;
  /** Whether to look up cached video (D-ID key present + videoMode on). */
  videoEnabled: boolean;
}) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const vidRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setVideoUrl(null);
    if (videoEnabled && line) {
      getCachedVideo(tutor.id, line).then((url) => {
        if (!cancelled) setVideoUrl(url);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [tutor.id, line, videoEnabled]);

  if (videoUrl) {
    return (
      <video
        ref={vidRef}
        src={videoUrl}
        autoPlay
        playsInline
        controls={false}
        style={{
          width: size,
          height: size,
          objectFit: 'cover',
          borderRadius: 24,
          border: `3px solid ${tutor.accent}`,
          boxShadow: `0 0 30px ${tutor.accent}66`,
        }}
      />
    );
  }

  return (
    <AnimatedAvatar
      imageSrc={imageSrc}
      mood={mood}
      accent={tutor.accent}
      size={size}
      fallbackGlyph={tutor.fallbackGlyph}
    />
  );
}
