// js/api/cognitive.js - API Client for Cognitive Backend
export class CognitiveAPI {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
    }

    async checkHealth() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            if (!response.ok) throw new Error('Health check failed');
            return await response.json();
        } catch (error) {
            console.error('Health check error:', error);
            return { healthy: false, error: error.message };
        }
    }

    async createSession(sessionData) {
        try {
            const response = await fetch(`${this.baseURL}/cognitive/session/start`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(sessionData),
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create session');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Session creation error:', error);
            throw error;
        }
    }

    async trackEvent(sessionId, eventData) {
        try {
            const response = await fetch(`${this.baseURL}/cognitive/event`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    sessionId,
                    ...eventData,
                }),
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to track event');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Event tracking error:', error);
            // Don't throw for tracking errors - they shouldn't break the app
            return null;
        }
    }

    async completeSession(sessionId, finalState) {
        try {
            const response = await fetch(`${this.baseURL}/cognitive/session/complete`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    sessionId,
                    finalState,
                }),
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to complete session');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Session completion error:', error);
            throw error;
        }
    }

    async getComparativeInsights(userId, archetype) {
        try {
            const url = `${this.baseURL}/cognitive/comparative/${userId}`;
            const params = new URLSearchParams();
            if (archetype) params.append('archetype', archetype);
            
            const response = await fetch(`${url}?${params}`, {
                headers: this.headers,
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to get comparative insights');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Comparative insights error:', error);
            throw error;
        }
    }

    async getVisualization(sessionId) {
        try {
            const response = await fetch(`${this.baseURL}/cognitive/visualization/${sessionId}`, {
                headers: this.headers,
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to get visualization');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Visualization error:', error);
            throw error;
        }
    }

    async shareProfile(profileData, privacyLevel = 'public') {
        try {
            const response = await fetch(`${this.baseURL}/cognitive/share`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    profileData,
                    privacyLevel,
                }),
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to share profile');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Share profile error:', error);
            throw error;
        }
    }

    async findCognitiveMatches(userId, desiredInteraction) {
        try {
            const response = await fetch(`${this.baseURL}/cognitive/match`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    userId,
                    desiredInteraction,
                }),
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to find matches');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Match finding error:', error);
            throw error;
        }
    }

    async getRecommendation(userId) {
        try {
            const response = await fetch(`${this.baseURL}/cognitive/recommendation/${userId}`, {
                headers: this.headers,
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to get recommendation');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Recommendation error:', error);
            throw error;
        }
    }

    // Utility method for error handling
    async handleError(response) {
        if (!response.ok) {
            let errorMessage;
            try {
                const error = await response.json();
                errorMessage = error.message || `HTTP ${response.status}`;
            } catch {
                errorMessage = `HTTP ${response.status}`;
            }
            throw new Error(errorMessage);
        }
    }
}
