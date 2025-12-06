// js/neural-loader.js - Neural network loading animation
export function createNeuralNetwork(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const nodeCount = 20;
    const connectionCount = 30;
    
    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
        const node = document.createElement('div');
        node.className = 'neural-node';
        
        // Random position
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        
        node.style.left = `${x}%`;
        node.style.top = `${y}%`;
        
        // Random delay for animation
        node.style.animationDelay = `${Math.random() * 2}s`;
        
        // Random color from psychological palette
        const colors = [
            '#2A4B8C', // cognitive-blue
            '#6B46C1', // insight-purple
            '#0D9488', // awareness-teal
            '#EA580C', // energy-orange
            '#CA8A04', // caution-yellow
        ];
        node.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        container.appendChild(node);
    }
    
    // Create connections (visual only, no DOM elements)
    // This is simplified - in production, use Canvas or SVG
    const style = document.createElement('style');
    style.textContent = `
        .neural-node::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100px;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(107, 70, 193, 0.5), transparent);
            transform-origin: 0 0;
            animation: connect 3s infinite;
            animation-delay: calc(var(--connection-delay, 0) * 1s);
        }
    `;
    document.head.appendChild(style);
}

export function createAdvancedNeuralVisualization(canvasId, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const nodes = [];
    const connections = [];
    
    const config = {
        nodeCount: options.nodes || 30,
        connectionCount: options.connections || 50,
        colors: options.colors || ['#2A4B8C', '#6B46C1', '#0D9488', '#EA580C'],
        speed: options.speed || 0.5,
        opacity: options.opacity || 0.3,
        ...options
    };
    
    // Initialize nodes
    for (let i = 0; i < config.nodeCount; i++) {
        nodes.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 3 + 2,
            color: config.colors[Math.floor(Math.random() * config.colors.length)],
            vx: (Math.random() - 0.5) * config.speed,
            vy: (Math.random() - 0.5) * config.speed,
            pulse: Math.random() * Math.PI * 2
        });
    }
    
    // Create connections
    for (let i = 0; i < config.connectionCount; i++) {
        const nodeA = nodes[Math.floor(Math.random() * nodes.length)];
        const nodeB = nodes[Math.floor(Math.random() * nodes.length)];
        
        if (nodeA !== nodeB) {
            connections.push({
                nodeA,
                nodeB,
                strength: Math.random() * 0.5 + 0.5,
                pulse: Math.random() * Math.PI * 2
            });
        }
    }
    
    // Animation loop
    function animate() {
        // Clear canvas with fade effect
        ctx.fillStyle = `rgba(17, 24, 39, ${0.05})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw connections
        connections.forEach(conn => {
            const dx = conn.nodeB.x - conn.nodeA.x;
            const dy = conn.nodeB.y - conn.nodeA.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Only draw if nodes are close enough
            if (distance < 200) {
                const alpha = (1 - distance / 200) * config.opacity;
                const pulseAlpha = (Math.sin(conn.pulse) + 1) * 0.3;
                
                ctx.beginPath();
                ctx.moveTo(conn.nodeA.x, conn.nodeA.y);
                ctx.lineTo(conn.nodeB.x, conn.nodeB.y);
                ctx.strokeStyle = `rgba(107, 70, 193, ${alpha + pulseAlpha})`;
                ctx.lineWidth = conn.strength;
                ctx.stroke();
                
                conn.pulse += 0.02;
            }
        });
        
        // Update and draw nodes
        nodes.forEach(node => {
            // Update position with boundary checking
            node.x += node.vx;
            node.y += node.vy;
            
            if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
            if (node.y < 0 || node.y > canvas.height) node.vy *= -1;
            
            // Keep within bounds
            node.x = Math.max(0, Math.min(canvas.width, node.x));
            node.y = Math.max(0, Math.min(canvas.height, node.y));
            
            // Draw node with pulse effect
            const pulseRadius = node.radius * (1 + Math.sin(node.pulse) * 0.3);
            
            ctx.beginPath();
            ctx.arc(node.x, node.y, pulseRadius, 0, Math.PI * 2);
            ctx.fillStyle = node.color;
            ctx.fill();
            
            // Add glow effect
            ctx.shadowBlur = 15;
            ctx.shadowColor = node.color;
            ctx.fill();
            ctx.shadowBlur = 0;
            
            node.pulse += 0.05;
        });
        
        requestAnimationFrame(animate);
    }
    
    // Handle resize
    function resize() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }
    
    window.addEventListener('resize', resize);
    resize();
    animate();
    
    return {
        nodes,
        connections,
        stop: () => {
            // Cleanup if needed
        }
    };
}
