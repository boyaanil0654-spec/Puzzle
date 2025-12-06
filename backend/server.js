// backend/server.js - Complete Express Server
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

// Import routes
const cognitiveRoutes = require('./routes/cognitive');
const authRoutes = require('./routes/auth');
const analyticsRoutes = require('./routes/analytics');

// Import middleware
const { errorHandler, notFound } = require('./middleware/error');
const { authenticate } = require('./middleware/auth');
const { logRequest, logError } = require('./middleware/logger');

// Import services
const { PsychologyEngine } = require('./ml/psychology-engine');
const { SocketManager } = require('./realtime/socket-manager');

class CognitiveServer {
    constructor() {
        this.app = express();
        this.server = createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: process.env.NODE_ENV === 'production' 
                    ? process.env.CLIENT_URL 
                    : 'http://localhost:3000',
                credentials: true
            },
            transports: ['websocket', 'polling']
        });
        
        this.psychologyEngine = new PsychologyEngine();
        this.port = process.env.PORT || 4000;
        this.nodeEnv = process.env.NODE_ENV || 'development';
        
        this.initializeDatabase();
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeSocketIO();
        this.initializeErrorHandling();
        this.initializeHealthChecks();
    }

    async initializeDatabase() {
        try {
            const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cognitive_mirrors';
            
            mongoose.set('strictQuery', false);
            await mongoose.connect(mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            
            console.log('✅ MongoDB connected successfully');
            
            // Create indexes in background
            mongoose.connection.once('open', async () => {
                try {
                    await mongoose.connection.collection('cognitiveprofiles').createIndex({ 
                        cognitiveFingerprint: 1 
                    });
                    await mongoose.connection.collection('cognitiveprofiles').createIndex({ 
                        userId: 1, 
                        createdAt: -1 
                    });
                    console.log('✅ Database indexes created');
                } catch (err) {
                    console.warn('⚠️ Index creation warning:', err.message);
                }
            });
            
        } catch (error) {
            console.error('❌ MongoDB connection error:', error);
            process.exit(1);
        }
    }

    initializeMiddleware() {
        // Security headers
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", process.env.CLIENT_URL, "wss://"],
                },
            },
            crossOriginEmbedderPolicy: false,
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // Limit each IP to 100 requests per windowMs
            standardHeaders: true,
            legacyHeaders: false,
            message: 'Too many requests from this IP, please try again later.',
        });
        
        this.app.use('/api/', limiter);

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // CORS
        this.app.use(cors({
            origin: process.env.NODE_ENV === 'production' 
                ? process.env.CLIENT_URL 
                : 'http://localhost:3000',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        }));

        // Compression
        this.app.use(compression({
            level: 6,
            threshold: 1024,
        }));

        // Request logging
        this.app.use(logRequest);

        // Static files in production
        if (this.nodeEnv === 'production') {
            const clientBuildPath = path.join(__dirname, '../../client/build');
            this.app.use(express.static(clientBuildPath, {
                maxAge: '1y',
                setHeaders: (res, filePath) => {
                    if (filePath.endsWith('.html')) {
                        res.setHeader('Cache-Control', 'no-cache');
                    }
                },
            }));
        }
    }

    initializeRoutes() {
        // API Routes
        this.app.use('/api/cognitive', cognitiveRoutes);
        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/analytics', analyticsRoutes);

        // Public routes
        this.app.get('/api/health', (req, res) => {
            res.status(200).json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                environment: this.nodeEnv,
                database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            });
        });

        this.app.get('/api/version', (req, res) => {
            res.json({
                name: 'Cognitive Mirrors API',
                version: '1.0.0',
                psychologyEngine: 'v2.1',
                cognitiveModels: 7,
                puzzles: 12,
            });
        });

        // Serve React app in production
        if (this.nodeEnv === 'production') {
            this.app.get('*', (req, res) => {
                res.sendFile(path.join(__dirname, '../../client/build/index.html'));
            });
        }
    }

    initializeSocketIO() {
        const socketManager = new SocketManager(this.io, this.psychologyEngine);
        
        this.io.on('connection', (socket) => {
            console.log('🔗 New WebSocket connection:', socket.id);
            
            socketManager.handleConnection(socket);
            
            socket.on('disconnect', (reason) => {
                console.log('🔌 WebSocket disconnected:', socket.id, reason);
                socketManager.handleDisconnect(socket);
            });
            
            socket.on('error', (error) => {
                console.error('❌ WebSocket error:', socket.id, error);
                logError(error, { socketId: socket.id });
            });
        });

        console.log('✅ WebSocket server initialized');
    }

    initializeErrorHandling() {
        // 404 handler
        this.app.use(notFound);
        
        // Global error handler
        this.app.use(errorHandler);
        
        // Unhandled rejection handler
        process.on('unhandledRejection', (reason, promise) => {
            console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
            logError(new Error(`Unhandled Rejection: ${reason}`), { promise });
        });
        
        // Uncaught exception handler
        process.on('uncaughtException', (error) => {
            console.error('❌ Uncaught Exception:', error);
            logError(error, { type: 'uncaughtException' });
            process.exit(1);
        });
    }

    initializeHealthChecks() {
        // Database health check
        setInterval(async () => {
            try {
                await mongoose.connection.db.admin().ping();
            } catch (error) {
                console.error('❌ Database health check failed:', error.message);
                logError(error, { type: 'healthCheck', component: 'database' });
            }
        }, 30000); // Every 30 seconds
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`
            🧠 COGNITIVE MIRRORS SERVER 🧠
            ================================
            🚀 Server running on port: ${this.port}
            📁 Environment: ${this.nodeEnv}
            🗄️  Database: ${mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Disconnected ❌'}
            🔗 WebSocket: Ready
            ⏰ Started: ${new Date().toISOString()}
            ================================
            `);
            
            // Log startup complete
            logRequest({ method: 'STARTUP', url: '/', status: 200 }, 'Server started successfully');
        });

        // Graceful shutdown
        process.on('SIGTERM', () => this.gracefulShutdown());
        process.on('SIGINT', () => this.gracefulShutdown());
    }

    async gracefulShutdown() {
        console.log('🛑 Starting graceful shutdown...');
        
        try {
            // Close WebSocket connections
            this.io.close(() => {
                console.log('🔌 WebSocket server closed');
            });
            
            // Close HTTP server
            this.server.close(async () => {
                console.log('🔌 HTTP server closed');
                
                // Close database connection
                await mongoose.connection.close();
                console.log('🗄️  Database connection closed');
                
                console.log('👋 Shutdown complete');
                process.exit(0);
            });
            
            // Force shutdown after 10 seconds
            setTimeout(() => {
                console.error('⚠️ Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
            
        } catch (error) {
            console.error('❌ Error during shutdown:', error);
            process.exit(1);
        }
    }
}

// Start server if this file is run directly
if (require.main === module) {
    const server = new CognitiveServer();
    server.start();
}

module.exports = CognitiveServer;
