/**
 * Sound Effects Manager
 * Immersive audio feedback using Web Audio API
 */

(function() {
    'use strict';

    console.log('[SoundFX] Sound Effects module loading...');

    // ========================================
    // Audio Context Setup
    // ========================================
    
    let audioContext = null;
    let masterGain = null;
    let soundEnabled = true;
    let isInitialized = false;

    function initAudioContext() {
        if (audioContext && isInitialized) return true;
        
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            masterGain = audioContext.createGain();
            masterGain.connect(audioContext.destination);
            masterGain.gain.value = 0.4; // Master volume (increased)
            
            // Resume if suspended
            if (audioContext.state === 'suspended') {
                audioContext.resume().then(() => {
                    console.log('[SoundFX] Audio context resumed');
                    isInitialized = true;
                });
            } else {
                isInitialized = true;
            }
            
            console.log('[SoundFX] Audio context initialized, state:', audioContext.state);
            return true;
        } catch (e) {
            console.warn('[SoundFX] Web Audio API not supported:', e);
            soundEnabled = false;
            return false;
        }
    }

    // Initialize on first user interaction
    function handleFirstInteraction() {
        console.log('[SoundFX] First user interaction detected');
        initAudioContext();
        
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume().then(() => {
                console.log('[SoundFX] Audio context resumed after interaction');
                isInitialized = true;
                // Play a silent sound to fully unlock audio
                playClick();
            });
        }
    }

    // Listen for multiple interaction types
    ['click', 'touchstart', 'keydown', 'mousedown'].forEach(event => {
        document.addEventListener(event, handleFirstInteraction, { once: true, passive: true });
    });

    // ========================================
    // Sound Synthesis Functions
    // ========================================

    /**
     * Create a pleasant chime sound
     */
    function playChime(frequency = 880, duration = 0.3, type = 'sine') {
        if (!soundEnabled) return;
        if (!initAudioContext()) return;
        
        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(masterGain);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            const now = audioContext.currentTime;
            gainNode.gain.setValueAtTime(0.4, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
            
            oscillator.start(now);
            oscillator.stop(now + duration);
        } catch (e) {
            console.warn('[SoundFX] Error playing chime:', e);
        }
    }

    /**
     * Create a multi-note arpeggio sound
     */
    function playArpeggio(notes, duration = 0.1, delay = 0.05) {
        if (!soundEnabled) return;
        if (!initAudioContext()) return;
        
        notes.forEach((note, index) => {
            setTimeout(() => {
                playChime(note, duration, 'sine');
            }, index * delay * 1000);
        });
    }

    /**
     * Create a whoosh/sweep sound
     */
    function playWhoosh(startFreq = 200, endFreq = 800, duration = 0.2) {
        if (!soundEnabled) return;
        if (!initAudioContext()) return;
        
        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            const filter = audioContext.createBiquadFilter();
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(masterGain);
            
            oscillator.type = 'sawtooth';
            filter.type = 'lowpass';
            filter.frequency.value = 2000;
            
            const now = audioContext.currentTime;
            oscillator.frequency.setValueAtTime(startFreq, now);
            oscillator.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
            
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
            
            oscillator.start(now);
            oscillator.stop(now + duration);
        } catch (e) {
            console.warn('[SoundFX] Error playing whoosh:', e);
        }
    }

    /**
     * Create a soft pop/click sound
     */
    function playPop(frequency = 400, duration = 0.08) {
        if (!soundEnabled) return;
        if (!initAudioContext()) return;
        
        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(masterGain);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            const now = audioContext.currentTime;
            gainNode.gain.setValueAtTime(0.5, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
            
            oscillator.start(now);
            oscillator.stop(now + duration);
        } catch (e) {
            console.warn('[SoundFX] Error playing pop:', e);
        }
    }

    /**
     * Create a success fanfare sound
     */
    function playSuccess() {
        if (!soundEnabled) return;
        console.log('[SoundFX] Playing success sound');
        
        // Major chord arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        playArpeggio(notes, 0.15, 0.08);
    }

    /**
     * Create an error/failure sound
     */
    function playError() {
        if (!soundEnabled) return;
        console.log('[SoundFX] Playing error sound');
        
        // Descending minor notes
        const notes = [392, 349.23]; // G4, F4
        playArpeggio(notes, 0.2, 0.15);
    }

    /**
     * Create a hover/focus sound
     */
    function playHover() {
        if (!soundEnabled) return;
        playChime(1200, 0.05, 'sine');
    }

    /**
     * Create a drag start sound
     */
    function playDragStart() {
        if (!soundEnabled) return;
        console.log('[SoundFX] Playing drag start sound');
        playWhoosh(300, 600, 0.15);
    }

    /**
     * Create a drop/place sound
     */
    function playDrop() {
        if (!soundEnabled) return;
        console.log('[SoundFX] Playing drop sound');
        
        // Satisfying thud + chime
        playPop(200, 0.1);
        setTimeout(() => {
            playChime(800, 0.2, 'triangle');
        }, 50);
    }

    /**
     * Create a theme switch sound
     */
    function playThemeSwitch() {
        if (!soundEnabled) return;
        console.log('[SoundFX] Playing theme switch sound');
        
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            // Going dark - descending
            playArpeggio([880, 698.46, 523.25], 0.1, 0.06);
        } else {
            // Going light - ascending
            playArpeggio([523.25, 698.46, 880], 0.1, 0.06);
        }
    }

    /**
     * Create a refresh/reload sound
     */
    function playRefresh() {
        if (!soundEnabled) return;
        console.log('[SoundFX] Playing refresh sound');
        playWhoosh(400, 1200, 0.3);
    }

    /**
     * Create a notification/toast sound
     */
    function playNotification(type = 'info') {
        if (!soundEnabled) return;
        console.log('[SoundFX] Playing notification sound:', type);
        
        if (type === 'success') {
            playSuccess();
        } else if (type === 'error') {
            playError();
        } else {
            playChime(880, 0.2, 'triangle');
        }
    }

    /**
     * Create a click/tap sound
     */
    function playClick() {
        if (!soundEnabled) return;
        playPop(600, 0.05);
    }

    /**
     * Create a context menu open sound
     */
    function playContextMenu() {
        if (!soundEnabled) return;
        console.log('[SoundFX] Playing context menu sound');
        playArpeggio([800, 1000], 0.05, 0.03);
    }

    /**
     * Create a modal open sound
     */
    function playModalOpen() {
        if (!soundEnabled) return;
        console.log('[SoundFX] Playing modal open sound');
        playWhoosh(200, 600, 0.2);
        setTimeout(() => playChime(1000, 0.15), 100);
    }

    /**
     * Create a modal close sound
     */
    function playModalClose() {
        if (!soundEnabled) return;
        console.log('[SoundFX] Playing modal close sound');
        playWhoosh(600, 200, 0.15);
    }

    // ========================================
    // Event Bindings (Direct)
    // ========================================

    // Bind sounds to drag events
    document.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('project-card')) {
            playDragStart();
        }
    });

    document.addEventListener('drop', (e) => {
        const container = e.target.classList.contains('card-container') 
            ? e.target 
            : e.target.closest('.card-container');
        if (container) {
            playDrop();
        }
    });

    // Bind sounds to card hover (with debounce)
    let lastHoveredCard = null;
    document.addEventListener('mouseover', (e) => {
        const card = e.target.closest('.project-card');
        if (card && card !== lastHoveredCard && !card.classList.contains('dragging')) {
            lastHoveredCard = card;
            playHover();
        }
    });

    document.addEventListener('mouseout', (e) => {
        const card = e.target.closest('.project-card');
        if (card === lastHoveredCard) {
            lastHoveredCard = null;
        }
    });

    // Bind sounds to buttons (using capture phase for reliability)
    document.addEventListener('click', (e) => {
        // Button clicks
        const btn = e.target.closest('.btn');
        if (btn) {
            if (btn.classList.contains('btn-refresh')) {
                playRefresh();
            } else if (btn.classList.contains('btn-theme')) {
                // Theme sound handled after theme change
                setTimeout(playThemeSwitch, 100);
            } else if (btn.classList.contains('btn-help')) {
                playModalOpen();
            } else {
                playClick();
            }
            return;
        }
        
        // Modal close button
        if (e.target.classList.contains('modal-close')) {
            playModalClose();
            return;
        }
        
        // Context menu items
        if (e.target.classList.contains('menu-item')) {
            playClick();
            return;
        }
    }, true); // Use capture phase

    // Bind sounds to context menu
    document.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.project-card')) {
            playContextMenu();
        }
    });

    // Bind sounds to double-click (open file)
    document.addEventListener('dblclick', (e) => {
        if (e.target.closest('.project-card')) {
            playSuccess();
        }
    });

    // Bind sounds to keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            playRefresh();
        }
        if (e.key === '?') {
            playModalOpen();
        }
        if (e.key === 'Escape') {
            const modal = document.getElementById('help-modal');
            if (modal && modal.classList.contains('active')) {
                playModalClose();
            }
        }
    });

    // ========================================
    // Delayed Override of Original Functions
    // ========================================

    function setupOverrides() {
        console.log('[SoundFX] Setting up function overrides...');

        // Override showToast to add sound
        if (window.showToast && !window.showToast._soundOverridden) {
            const originalShowToast = window.showToast;
            window.showToast = function(message, type) {
                playNotification(type);
                return originalShowToast.apply(this, arguments);
            };
            window.showToast._soundOverridden = true;
            console.log('[SoundFX] showToast overridden');
        }

        // Override toggleTheme to add sound
        if (window.toggleTheme && !window.toggleTheme._soundOverridden) {
            const originalToggleTheme = window.toggleTheme;
            window.toggleTheme = function() {
                const result = originalToggleTheme.apply(this, arguments);
                setTimeout(playThemeSwitch, 50);
                return result;
            };
            window.toggleTheme._soundOverridden = true;
            console.log('[SoundFX] toggleTheme overridden');
        }

        // Override showHelp to add sound
        if (window.showHelp && !window.showHelp._soundOverridden) {
            const originalShowHelp = window.showHelp;
            window.showHelp = function() {
                playModalOpen();
                return originalShowHelp.apply(this, arguments);
            };
            window.showHelp._soundOverridden = true;
            console.log('[SoundFX] showHelp overridden');
        }

        // Override closeHelp to add sound
        if (window.closeHelp && !window.closeHelp._soundOverridden) {
            const originalCloseHelp = window.closeHelp;
            window.closeHelp = function() {
                playModalClose();
                return originalCloseHelp.apply(this, arguments);
            };
            window.closeHelp._soundOverridden = true;
            console.log('[SoundFX] closeHelp overridden');
        }
    }

    // Try to setup overrides after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(setupOverrides, 100);
        });
    } else {
        setTimeout(setupOverrides, 100);
    }

    // Also try after a longer delay in case scripts load late
    setTimeout(setupOverrides, 500);
    setTimeout(setupOverrides, 1000);

    // ========================================
    // Volume Control
    // ========================================

    function setVolume(value) {
        if (masterGain) {
            masterGain.gain.value = Math.max(0, Math.min(1, value));
            console.log('[SoundFX] Volume set to:', value);
        }
    }

    function toggleSound() {
        soundEnabled = !soundEnabled;
        console.log('[SoundFX] Sound toggled:', soundEnabled);
        if (soundEnabled) {
            initAudioContext();
            playClick(); // Feedback
        }
        return soundEnabled;
    }

    // ========================================
    // Expose API
    // ========================================

    window.SoundEffects = {
        playChime,
        playArpeggio,
        playWhoosh,
        playPop,
        playSuccess,
        playError,
        playHover,
        playDragStart,
        playDrop,
        playThemeSwitch,
        playRefresh,
        playNotification,
        playClick,
        playContextMenu,
        playModalOpen,
        playModalClose,
        setVolume,
        toggleSound,
        isEnabled: () => soundEnabled,
        init: initAudioContext
    };

    console.log('[SoundFX] Sound Effects module loaded. Call SoundEffects.playClick() to test.');

})();
