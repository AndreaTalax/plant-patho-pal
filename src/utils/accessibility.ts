/**
 * Accessibility utilities for voice-over and screen reader support
 */

interface AnnouncementOptions {
  priority?: 'polite' | 'assertive';
  delay?: number;
}

class AccessibilityManager {
  private announcer: HTMLElement | null = null;

  constructor() {
    this.createAnnouncer();
  }

  private createAnnouncer() {
    if (typeof window === 'undefined') return;

    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.className = 'sr-only';
    this.announcer.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    
    document.body.appendChild(this.announcer);
  }

  /**
   * Announce message to screen readers
   */
  announce(message: string, options: AnnouncementOptions = {}) {
    if (!this.announcer) return;

    const { priority = 'polite', delay = 100 } = options;
    
    this.announcer.setAttribute('aria-live', priority);
    
    setTimeout(() => {
      if (this.announcer) {
        this.announcer.textContent = message;
        
        // Clear after announcement
        setTimeout(() => {
          if (this.announcer) {
            this.announcer.textContent = '';
          }
        }, 1000);
      }
    }, delay);
  }

  /**
   * Announce navigation changes
   */
  announceNavigation(location: string) {
    this.announce(`Navigato a ${location}`, { priority: 'assertive' });
  }

  /**
   * Announce form errors
   */
  announceError(error: string) {
    this.announce(`Errore: ${error}`, { priority: 'assertive' });
  }

  /**
   * Announce success messages
   */
  announceSuccess(message: string) {
    this.announce(`Successo: ${message}`, { priority: 'polite' });
  }

  /**
   * Announce loading states
   */
  announceLoading(message: string = 'Caricamento in corso') {
    this.announce(message, { priority: 'polite' });
  }

  /**
   * Announce completion of actions
   */
  announceCompletion(action: string) {
    this.announce(`${action} completato`, { priority: 'polite' });
  }
}

// Singleton instance
export const accessibilityManager = new AccessibilityManager();

/**
 * Hook for managing focus
 */
export const useFocusManagement = () => {
  const focusElement = (selector: string, delay: number = 100) => {
    setTimeout(() => {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        element.focus();
      }
    }, delay);
  };

  const focusFirstInput = (container?: HTMLElement) => {
    const root = container || document;
    const firstInput = root.querySelector(
      'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled])'
    ) as HTMLElement;
    
    if (firstInput) {
      firstInput.focus();
    }
  };

  const trapFocus = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  };

  return {
    focusElement,
    focusFirstInput,
    trapFocus
  };
};

/**
 * Generate accessible IDs
 */
export const generateAccessibleId = (prefix: string = 'element'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Voice over announcements for specific actions
 */
export const voiceOverAnnouncements = {
  photoTaken: () => accessibilityManager.announce('Foto scattata con successo'),
  cameraInitialized: () => accessibilityManager.announce('Fotocamera inizializzata e pronta'),
  zoomChanged: (level: number) => accessibilityManager.announce(`Zoom impostato a ${level.toFixed(1)}x`),
  flashToggled: (enabled: boolean) => accessibilityManager.announce(`Flash ${enabled ? 'attivato' : 'disattivato'}`),
  timerSet: (seconds: number) => accessibilityManager.announce(`Timer impostato a ${seconds} secondi`),
  audioRecordingStarted: () => accessibilityManager.announce('Registrazione audio avviata'),
  audioRecordingStopped: () => accessibilityManager.announce('Registrazione audio terminata'),
  messageSent: () => accessibilityManager.announce('Messaggio inviato'),
  messageReceived: () => accessibilityManager.announce('Nuovo messaggio ricevuto'),
  diagnosisStarted: () => accessibilityManager.announce('Analisi della pianta in corso'),
  diagnosisCompleted: () => accessibilityManager.announce('Analisi completata')
};