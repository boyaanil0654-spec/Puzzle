// js/app.js - Main Frontend Application
import { createNeuralVisualization } from './visualizations/neural.js';
import { CognitiveAPI } from './api/cognitive.js';
import { startSession, trackEvent } from './analytics/tracker.js';

class CognitiveApp {
    constructor() {
        this.api = new CognitiveAPI();
        this.currentSession = null;
        this.userProfile = null;
        this.isInitialized = false;
        
        // Psychological color palette
        this.colors = {
            cognitiveBlue: '#2A4B8C',
            insightPurple: '#6B46C1',
            awarenessTeal: '#0D9488',
            energyOrange: '#EA580C',
            cautionYellow: '#CA8A04',
        };
    }

    async init() {
        try {
            console.log('🧠 Initializing Cognitive Mirrors...');
            
            // Check API health
            const health = await this.api.checkHealth();
            if (!health.healthy) {
                throw new Error('API server is not available');
            }
            
            // Initialize session
            this.currentSession = await this.startNewSession();
            
            // Load user profile if exists
            this.userProfile = await this.loadUserProfile();
            
            // Initialize visualizations
            await this.initializeVisualizations();
            
            // Start analytics
            await startSession();
            
            this.isInitialized = true;
            console.log('✅ Cognitive Mirrors initialized successfully');
            
            // Dispatch ready event
            this.dispatchEvent('app:ready', {
                session: this.currentSession,
                profile: this.userProfile,
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.showError(error);
            return false;
        }
    }

    async startNewSession() {
        const sessionData = {
            userId: this.getUserId(),
            puzzleType: 'ego_labyrinth',
            resolution: `${window.innerWidth}x${window.innerHeight}`,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
        };
        
        const session = await this.api.createSession(sessionData);
        
        // Store session ID
        localStorage.setItem('cognitive_session_id', session.sessionId);
        
        // Track session start
        trackEvent('session_start', {
            sessionId: session.sessionId,
            puzzleType: sessionData.puzzleType,
        });
        
        return session;
    }

    async loadUserProfile() {
        const userId = this.getUserId();
        const storedProfile = localStorage.getItem(`cognitive_profile_${userId}`);
        
        if (storedProfile) {
            try {
                return JSON.parse(storedProfile);
            } catch (e) {
                console.warn('Failed to parse stored profile:', e);
            }
        }
        
        // Create new profile
        const profile = {
            userId,
            archetype: null,
            sessions: [],
            createdAt: new Date().toISOString(),
            preferences: {
                theme: 'dark',
                difficulty: 'adaptive',
                hints: true,
                animations: true,
            },
        };
        
        localStorage.setItem(`cognitive_profile_${userId}`, JSON.stringify(profile));
        return profile;
    }

    async initializeVisualizations() {
        // Create neural network background
        createNeuralVisualization('neuralBackground', {
            nodes: 50,
            connections: 100,
            colors: Object.values(this.colors),
            speed: 0.5,
            opacity: 0.3,
        });
        
        // Initialize interactive elements
        this.initializeInteractiveElements();
    }

    initializeInteractiveElements() {
        // Create main navigation
        this.createNavigation();
        
        // Create hero section
        this.createHeroSection();
        
        // Create puzzle selector
        this.createPuzzleSelector();
        
        // Create user panel
        this.createUserPanel();
    }

    createNavigation() {
        const nav = document.createElement('nav');
        nav.className = 'cognitive-nav';
        nav.innerHTML = `
            <div class="nav-container">
                <div class="nav-brand">
                    <span class="nav-logo">🧠</span>
                    <span class="nav-title">Cognitive Mirrors</span>
                </div>
                <div class="nav-links">
                    <a href="#puzzles" class="nav-link" data-navigate="puzzles">Puzzles</a>
                    <a href="#profile" class="nav-link" data-navigate="profile">Your Mind</a>
                    <a href="#compare" class="nav-link" data-navigate="compare">Compare</a>
                    <a href="#about" class="nav-link" data-navigate="about">About</a>
                </div>
                <div class="nav-actions">
                    <button class="btn-secondary" id="themeToggle">
                        <span class="theme-icon">🌓</span>
                    </button>
                    <button class="btn-primary" id="startPuzzle">
                        Start Journey
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(nav);
        
        // Add event listeners
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('startPuzzle').addEventListener('click', () => this.startPuzzle());
        
        // Navigation links
        document.querySelectorAll('[data-navigate]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.dataset.navigate;
                this.navigateTo(page);
            });
        });
    }

    createHeroSection() {
        const hero = document.createElement('section');
        hero.className = 'cognitive-hero';
        hero.innerHTML = `
            <div class="hero-container">
                <div class="hero-content">
                    <h1 class="hero-title">
                        Discover the 
                        <span class="gradient-text">Architecture</span>
                        of Your Mind
                    </h1>
                    <p class="hero-subtitle">
                        Every puzzle is a mirror. Every solution reveals what your conscious mind hides.
                        Uncover your cognitive patterns, biases, and unique thinking style through
                        interactive psychological games.
                    </p>
                    <div class="hero-stats">
                        <div class="stat">
                            <div class="stat-value" id="totalPuzzles">0</div>
                            <div class="stat-label">Psychological Puzzles</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value" id="analyzedMinds">0</div>
                            <div class="stat-label">Minds Analyzed</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value" id="cognitiveBiases">24</div>
                            <div class="stat-label">Biases Detected</div>
                        </div>
                    </div>
                    <div class="hero-actions">
                        <button class="btn-hero-primary" id="heroStart">
                            <span>Start Your Analysis</span>
                            <span class="arrow">→</span>
                        </button>
                        <button class="btn-hero-secondary" id="watchDemo">
                            <span>Watch Demo</span>
                        </button>
                    </div>
                </div>
                <div class="hero-visualization">
                    <canvas id="heroCanvas" width="600" height="400"></canvas>
                </div>
            </div>
        `;
        
        document.body.appendChild(hero);
        
        // Animate stats
        this.animateStats();
        
        // Add event listeners
        document.getElementById('heroStart').addEventListener('click', () => this.startPuzzle());
        document.getElementById('watchDemo').addEventListener('click', () => this.showDemo());
    }

    async startPuzzle(puzzleType = 'ego_labyrinth') {
        if (!this.isInitialized) {
            await this.init();
        }
        
        // Track puzzle start
        trackEvent('puzzle_start', { puzzleType });
        
        // Navigate to puzzle
        this.navigateTo('puzzle', { puzzleType });
    }

    navigateTo(page, params = {}) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        // Show requested page
        const pageElement = document.getElementById(`page-${page}`);
        if (pageElement) {
            pageElement.classList.add('active');
        } else {
            // Load page dynamically
            this.loadPage(page, params);
        }
        
        // Update URL
        window.history.pushState({ page, params }, '', `#${page}`);
        
        // Dispatch navigation event
        this.dispatchEvent('app:navigate', { page, params });
    }

    dispatchEvent(name, data) {
        const event = new CustomEvent(name, { detail: data });
        window.dispatchEvent(event);
    }

    getUserId() {
        let userId = localStorage.getItem('cognitive_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('cognitive_user_id', userId);
        }
        return userId;
    }

    showError(error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-overlay';
        errorDiv.innerHTML = `
            <div class="error-content">
                <div class="error-icon">⚠️</div>
                <h3>Cognitive Engine Error</h3>
                <p>${error.message || 'An unexpected error occurred'}</p>
                <div class="error-actions">
                    <button onclick="location.reload()" class="btn-primary">
                        Retry
                    </button>
                    <button onclick="this.closest('.error-overlay').remove()" class="btn-secondary">
                        Continue Anyway
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
    }

    // Add more methods as needed...
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    window.CognitiveApp = new CognitiveApp();
    await window.CognitiveApp.init();
});

// Export for module usage
export { CognitiveApp };
