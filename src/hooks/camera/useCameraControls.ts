
import { useCallback } from 'react';
import { toast } from 'sonner';
import type { CameraState } from './types';

export const useCameraControls = (
  state: CameraState,
  setters: {
    setFacingMode: (mode: 'user' | 'environment') => void;
    setFlashEnabled: (enabled: boolean) => void;
  }
) => {
  const { stream, hasFlash, flashEnabled } = state;
  const { setFacingMode, setFlashEnabled } = setters;

  const switchCamera = useCallback(() => {
    setFacingMode(state.facingMode === 'user' ? 'environment' : 'user');
    console.log('🔄 Switching camera facing mode...');
  }, [state.facingMode, setFacingMode]);

  const toggleFlash = useCallback(async () => {
    if (!stream || !hasFlash) {
      toast.error('Flash non supportato su questo dispositivo');
      return;
    }

    try {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && 'applyConstraints' in videoTrack) {
        await videoTrack.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any]
        });
        setFlashEnabled(!flashEnabled);
        toast.success(`Flash ${!flashEnabled ? 'abilitato' : 'disabilitato'}`);
      }
    } catch (error) {
      console.error('Flash toggle error:', error);
      toast.error('Errore durante attivazione/disattivazione flash');
    }
  }, [stream, hasFlash, flashEnabled, setFlashEnabled]);

  return { switchCamera, toggleFlash };
};
