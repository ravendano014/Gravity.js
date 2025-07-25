// Global variables
var h = 0.005;
var context, particleList = [], wormholeList = [];
var frametime, starttime, width, height;
var startCoords = [-1, -1], endCoords = [-1, -1];
var newMass = 1e3, onControlBox = false, shiftDown = false;
var trailsEnabled = false, currentParticleType = "matter";
var gravityFieldEnabled = false, showParticleNames = false;
var showMagnetospheres = false, magnetosphereList = [];
var showOrbits = false, showGravityWells = false;
var showParticleMass = false, showGravitationalLensing = false;
var collisionEffectsEnabled = true;
var newName = "New Particle", newType = "matter";
var gravityMode = "inverseSquare"; // Nuevo: modo de gravedad

// Camera variables
var zoomLevel = 1.0;
var panX = 0;
var panY = 0;

// Physics parameters
var G = 1;
var collisionRestitution = 0.8;
var darkMatterInteractionFactor = 0.5;

// Helper function for sech
function sech(x) {
    return 1 / Math.cosh(x);
}

// Initializes the canvas and event listeners
function init() {
    var canvas = document.getElementById("canvas");
    var controlBox = document.getElementById("controlbox");
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    width = canvas.width;
    height = canvas.height;
    context = canvas.getContext("2d");
    
    // Event listeners
    window.addEventListener("mousedown", mouseDownListener, false);
    window.addEventListener('wheel', mouseWheelListener, { passive: false });
    controlBox.onmouseover = function() { onControlBox = true; };
    controlBox.onmouseout = function() { onControlBox = false; };
}

// Mouse down event listener
function mouseDownListener(t){
    onControlBox||(
        shiftDown=t.shiftKey,
        startCoords[0]=t.clientX,
        startCoords[1]=t.clientY,
        endCoords[0]=t.clientX,
        endCoords[1]=t.clientY,
        window.addEventListener("mousemove",mouseMoveListener,!1),
        window.addEventListener("mouseup",mouseUpListener,!1)
    )
}

// Mouse move event listener
function mouseMoveListener(t){endCoords[0]=t.clientX,endCoords[1]=t.clientY}

// Mouse up event listener
function mouseUpListener(t){
    window.removeEventListener("mousemove",mouseMoveListener);
    window.removeEventListener("mouseup",mouseUpListener);

    if (!t.shiftKey && !shiftDown) {
        var worldStartX = (startCoords[0] - panX) / zoomLevel;
        var worldStartY = (startCoords[1] - panY) / zoomLevel;
        var worldEndX = (endCoords[0] - panX) / zoomLevel;
        var worldEndY = (endCoords[1] - panY) / zoomLevel;

        particleList.push(new Particle(newMass, worldStartX, worldStartY, (worldEndX - worldStartX), (worldEndY - worldStartY), currentParticleType, newName));
    } else if (t.shiftKey && shiftDown) {
        var screenDx = endCoords[0] - startCoords[0];
        var screenDy = endCoords[1] - startCoords[1];

        panX += screenDx;
        panY += screenDy;
    }
    startCoords=[-1,-1];
    endCoords=[-1,-1];
}

// Mouse wheel listener for zoom
function mouseWheelListener(event) {
    event.preventDefault();

    var scaleFactor = 1.1;
    var mouseX = event.clientX;
    var mouseY = event.clientY;

    var delta = event.deltaY > 0 ? 1 / scaleFactor : scaleFactor;

    var worldX = (mouseX - panX) / zoomLevel;
    var worldY = (mouseY - panY) / zoomLevel;

    zoomLevel *= delta;

    panX = mouseX - worldX * zoomLevel;
    panY = mouseY - worldY * zoomLevel;

    main();
}

// Sets the mass for new particles
function setNewMass(t,n,pt){
    newMass=t;
    newName=n;
    newType=pt;
}


// Toggles particle trails
function toggleTrails(){trailsEnabled=!trailsEnabled}

// Toggles particle type (matter/antimatter)
function toggleParticleType(){currentParticleType=currentParticleType=="matter"?"antimatter":"matter",document.getElementById("particleTypeBtn").innerHTML=currentParticleType=="matter"?"Matter":"Antimatter"}

// Toggles gravitational field visualization
var gravityFieldMode = 0;
function toggleGravityField(){
    gravityFieldMode = (gravityFieldMode + 1) % 3;
    gravityFieldEnabled = gravityFieldMode > 0;
    document.getElementById("gravityFieldBtn").innerHTML = 
        gravityFieldMode === 0 ? "Show Field" : 
        gravityFieldMode === 1 ? "Show Arrows Field" : "Show Grid Field";
}

// Toggles particle name display
function toggleParticleNames(){showParticleNames=!showParticleNames}

// Toggles magnetosphere visibility
function toggleMagnetospheres() {
    showMagnetospheres = !showMagnetospheres;
}

// Toggles orbit visibility
function toggleOrbits() {
    showOrbits = !showOrbits;
}

// Function to clear all particle orbit paths
function clearAllParticleOrbits() {
    for (var i = 0; i < particleList.length; i++) {
        particleList[i].path = [];
    }
}

// Toggles gravity well visibility
function toggleGravityWells() {
    showGravityWells = !showGravityWells;
}

// Toggles particle mass display
function toggleParticleMass() {
    showParticleMass = !showParticleMass;
}

// Main simulation loop
function main() {
    starttime = Date.now();
    if (!isPaused) {
        integrate();
    }
    draw();
    frametime = Date.now() - starttime;
}

// Physics integration
function integrate() {
    // Calculate accelerations
    for (var i = 0; i < particleList.length; i++) {
        var p1 = particleList[i];
        p1.ax = 0;
        p1.ay = 0;
        
        for (var j = 0; j < particleList.length; j++) {
            if (i !== j) {
                var p2 = particleList[j];
                var dx = p2.x - p1.x;
                var dy = p2.y - p1.y;
                var distSq = dx * dx + dy * dy;
                var dist = Math.sqrt(distSq);
                
                if (dist > 1e-5) {
                    // Calculate gravitational force
                    var force = 0;
                    var scaledDist = dist/100;

                    switch(gravityMode) {
                        case "inverseSquare":
                            force = G * p2.mass / distSq;
                            break;
                        case "exponential":
                            force = G * p2.mass * Math.exp(-scaledDist);
                            break;
                        case "arctanSquared":
                            var arctanDist = Math.atan(scaledDist);
                            force = G * p2.mass / (arctanDist * arctanDist);
                            break;
                        case "sechSquared":
                            force = G * p2.mass * Math.pow(sech(scaledDist), 2);
                            break;
                        case "sech":
                            force = G * p2.mass * sech(scaledDist);
                            break;
                    }
                    
                    // Different interaction rules for different particle types
                    if (p1.type === "dark" && p2.type === "dark") {
                        // Dark matter interacts weakly with other dark matter
                        force = G * darkMatterInteractionFactor;
                    } else if (p1.type === "dark" || p2.type === "dark") {
                        // Dark matter interacts normally with normal matter
                        force = G * p2.mass / distSq;
                    } else {
                        // Normal matter/antimatter interaction
                        var n = p1.type === p2.type ? 1 : -1; // Antimatter repels matter
                        force = n * G * p2.mass / distSq;
                    }
                    
                    // Black holes have stronger gravity
                    if (p2.isBlackHole) {
                        force *= 10;
                    }
                    
                    // Apply force
                    p1.ax += force * dx / dist;
                    p1.ay += force * dy / dist;
                    
                    // Handle event horizon crossing
                    if (p2.isBlackHole && dist < p2.eventHorizonRadius) {
                        // Particle is absorbed by black hole
                        p1.x = p2.x;
                        p1.y = p2.y;
                        p1.vx = p2.vx;
                        p1.vy = p2.vy;
                        
                        // Add to black hole mass
                        p2.mass += p1.mass * 0.9; // 10% mass converted to energy
                        p2.radius = Math.sqrt(p2.mass) / 50;
                        p2.eventHorizonRadius = (2 * p2.mass) / 1000;
                        p2.accretionDiskRadius = p2.eventHorizonRadius * 3;
                        
                        // Mark for removal
                        p1.lifetime = 0;
                    }
                }
            }
        }
    }
    
    // Update velocities and positions
    for (var i = 0; i < particleList.length; i++) {
        var p = particleList[i];
        
        if (p.lifetime <= 0) continue;
        
        p.vx += p.ax * h;
        p.vy += p.ay * h;
        p.x += p.vx * h;
        p.y += p.vy * h;
        p.age += h;
        
        // Update paths for orbits
        if (showOrbits) {
            p.path.push({x: p.x, y: p.y});
            if (p.path.length > p.pathLength) {
                p.path.shift();
            }
        }
        
        // Age particles
        if (p.age > p.lifetime) {
            p.lifetime = 0; // Mark for removal
        }
        
        // Update collision effects
        if (p.collisionTimer > 0) {
            p.collisionTimer -= h;
            p.collisionEnergy *= 0.95; // Decay collision energy
        }
    }
    
    // Handle wormholes
    for (var i = 0; i < wormholeList.length; i++) {
        var wormhole = wormholeList[i];
        if (wormhole.linkedWormhole) {
            for (var j = 0; j < particleList.length; j++) {
                var p = particleList[j];
                if (p.type !== "wormhole") {
                    var dx = p.x - wormhole.x;
                    var dy = p.y - wormhole.y;
                    var dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < wormhole.wormholeRadius) {
                        // Calculate exit position (mirrored on the other side)
                        var angle = Math.atan2(dy, dx);
                        var exitDist = dist / wormhole.wormholeRadius * wormhole.linkedWormhole.wormholeRadius;
                        
                        // Teleport particle
                        p.x = wormhole.linkedWormhole.x + exitDist * Math.cos(angle);
                        p.y = wormhole.linkedWormhole.y + exitDist * Math.sin(angle);
                        
                        // Add some velocity in the exit direction
                        p.vx += Math.cos(angle) * 2;
                        p.vy += Math.sin(angle) * 2;
                        
                        // Visual effect
                        p.collisionEnergy = 1.0;
                        p.collisionTimer = 0.5;
                    }
                }
            }
        }
    }
    
    // Handle collisions
    var collided = new Array(particleList.length).fill(false);
    var newParticles = [];
    
    for (var i = 0; i < particleList.length; i++) {
        if (!collided[i]) {
            var p1 = particleList[i];
            
            for (var j = i + 1; j < particleList.length; j++) {
                if (!collided[j]) {
                    var p2 = particleList[j];
                    var dx = p2.x - p1.x;
                    var dy = p2.y - p1.y;
                    var dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < (p1.radius + p2.radius) * 0.8) {
                        collided[i] = true;
                        collided[j] = true;
                        
                        // Calculate collision result
                        if (p1.type === "wormhole" || p2.type === "wormhole") {
                            // Wormholes don't merge
                            p1.collisionEnergy = 1.0;
                            p2.collisionEnergy = 1.0;
                            p1.collisionTimer = 0.5;
                            p2.collisionTimer = 0.5;
                        } else if (p1.isBlackHole || p2.isBlackHole) {
                            // Merge with black hole
                            var bh = p1.isBlackHole ? p1 : p2;
                            var other = p1.isBlackHole ? p2 : p1;
                            
                            bh.mass += other.mass * 0.9; // 10% mass converted to energy
                            bh.radius = Math.sqrt(bh.mass) / 50;
                            bh.eventHorizonRadius = (2 * bh.mass) / 1000;
                            bh.accretionDiskRadius = bh.eventHorizonRadius * 3;
                            
                            other.lifetime = 0;
                        } else {
                            // Normal collision - merge or bounce
                            if (Math.random() < 0.7 || p1.type !== p2.type) {
                                // Merge particles
                                var totalMass = p1.mass + p2.mass;
                                var newX = (p1.x * p1.mass + p2.x * p2.mass) / totalMass;
                                var newY = (p1.y * p1.mass + p2.y * p2.mass) / totalMass;
                                var newVx = (p1.vx * p1.mass + p2.vx * p2.mass) / totalMass;
                                var newVy = (p1.vy * p1.mass + p2.vy * p2.mass) / totalMass;
                                
                                // Determine new type
                                var newType;
                                if (p1.type === p2.type) {
                                    newType = p1.type;
                                } else {
                                    // Matter + antimatter = annihilation (create energy burst)
                                    newType = "matter";
                                    var energyParticle = new Particle(
                                        (p1.mass + p2.mass) * 0.1, // 10% of mass converted to energy
                                        (p1.x + p2.x) / 2,
                                        (p1.y + p2.y) / 2,
                                        (p1.vx + p2.vx) / 2 + (Math.random() - 0.5) * 10,
                                        (p1.vy + p2.vy) / 2 + (Math.random() - 0.5) * 10,
                                        "matter",
                                        "Energy Burst"
                                    );
                                    energyParticle.color = [255, 255, 0];
                                    energyParticle.color[3] = (255 << 16 | 255 << 8 | 0).toString(16);
                                    energyParticle.lifetime = 1.0;
                                    newParticles.push(energyParticle);
                                }
                                
                                var mergedParticle = new Particle(
                                    totalMass * 0.9, // 10% mass lost in collision
                                    newX,
                                    newY,
                                    newVx,
                                    newVy,
                                    newType,
                                    "Merged Particle"
                                );
                                
                                // Visual effect
                                mergedParticle.collisionEnergy = 1.0;
                                mergedParticle.collisionTimer = 0.5;
                                
                                newParticles.push(mergedParticle);
                            } else {
                                // Elastic collision
                                var dx = p2.x - p1.x;
                                var dy = p2.y - p1.y;
                                var dist = Math.sqrt(dx * dx + dy * dy);
                                
                                if (dist > 0) {
                                    var nx = dx / dist;
                                    var ny = dy / dist;
                                    
                                    // Relative velocity
                                    var vx = p2.vx - p1.vx;
                                    var vy = p2.vy - p1.vy;
                                    
                                    // Velocity along normal
                                    var vn = vx * nx + vy * ny;
                                    
                                    // Don't collide if moving away
                                    if (vn < 0) {
                                        // Impulse
                                        var impulse = -(1 + collisionRestitution) * vn / (1/p1.mass + 1/p2.mass);
                                        
                                        // Apply impulse
                                        p1.vx -= impulse * nx / p1.mass;
                                        p1.vy -= impulse * ny / p1.mass;
                                        p2.vx += impulse * nx / p2.mass;
                                        p2.vy += impulse * ny / p2.mass;
                                        
                                        // Visual effect
                                        p1.collisionEnergy = Math.min(1.0, Math.abs(vn) / 10);
                                        p2.collisionEnergy = Math.min(1.0, Math.abs(vn) / 10);
                                        p1.collisionTimer = 0.3;
                                        p2.collisionTimer = 0.3;
                                    }
                                }
                            }
                        }
                        break;
                    }
                }
            }
        }
    }
    
    // Filter out collided particles and add new ones
    var remainingParticles = [];
    for (var i = 0; i < particleList.length; i++) {
        if (!collided[i] && particleList[i].lifetime > 0) {
            remainingParticles.push(particleList[i]);
        }
    }
    particleList = remainingParticles.concat(newParticles);
    
    // Regenerate magnetospheres
    magnetosphereList = [];
    for (var i = 0; i < particleList.length; i++) {
        var p = particleList[i];
        if ((p.type === "matter" || p.type === "neutron") && p.mass > 10000) {
            magnetosphereList.push(new Magnetosphere(p, p.mass / 100, 
                p.type === "neutron" ? "rgba(0, 200, 255, 0.3)" : "rgba(0, 100, 255, 0.2)"));
        }
    }
    
    // Handle camera tracking
    if (trackedParticle && particleList.includes(trackedParticle)) {
        var targetX = width/2 - trackedParticle.x * zoomLevel;
        var targetY = height/2 - trackedParticle.y * zoomLevel;
        
        // Smooth transition
        panX += (targetX - panX) * 0.1;
        panY += (targetY - panY) * 0.1;
        
        if (autoZoomEnabled) {
            var targetZoom = 100 / trackedParticle.radius;
            zoomLevel += (targetZoom - zoomLevel) * 0.1;
        }
    }
}

// Drawing function
function draw() {
    // Clear canvas
    if (trailsEnabled) {
        context.fillStyle = "rgba(0, 0, 0, 0.05)";
        context.fillRect(0, 0, width, height);
    } else {
        context.clearRect(0, 0, width, height);
    }
    
    context.save();
    context.translate(panX, panY);
    context.scale(zoomLevel, zoomLevel);
    
    // Draw gravity field if enabled
    if (gravityFieldEnabled) {
        drawGravityField();
    }
    
    // Draw magnetospheres (if enabled)
    if (showMagnetospheres) {
        for (var i = 0; i < magnetosphereList.length; i++) {
            magnetosphereList[i].draw(context, zoomLevel);
        }
    }
    
    // Draw orbits (if enabled)
    if (showOrbits) {
        drawOrbits();
    }
    
    // Draw gravity wells (if enabled)
    if (showGravityWells) {
        drawGravityWells();
    }
    
    // Draw gravitational lensing (if enabled)
    if (showGravitationalLensing) {
        drawGravitationalLensing();
    }
    
    // Draw all particles
    for (var i = 0; i < particleList.length; i++) {
        var p = particleList[i];
        
        // Skip drawing if it's a black hole (we'll draw it later with special effects)
        if (p.isBlackHole) continue;
        
        // Draw particle
        drawParticle(p);
        
        // Draw particle name/mass if enabled
        if (showParticleNames && p.name) {
            context.fillStyle = "#ffffff";
            context.font = (10 / zoomLevel) + "px Arial";
            context.textAlign = "center";
            context.fillText(p.name, p.x, p.y - p.radius - 5 / zoomLevel);
        }
        
        if (showParticleMass) {
            context.fillStyle = "#ffffff";
            context.font = (8 / zoomLevel) + "px Arial";
            context.textAlign = "center";
            var massText = p.mass < 10000 ? p.mass.toFixed(0) : p.mass.toExponential(1);
            context.fillText("Mass: " + massText, p.x, p.y + p.radius + (showParticleNames ? 15 / zoomLevel : 5 / zoomLevel));
        }
    }
    
    // Draw black holes with special effects
    for (var i = 0; i < particleList.length; i++) {
        var p = particleList[i];
        if (p.isBlackHole) {
            drawBlackHole(p);
        }
    }
    
    // Draw wormholes
    for (var i = 0; i < wormholeList.length; i++) {
        var wormhole = wormholeList[i];
        if (particleList.includes(wormhole)) {
            drawWormhole(wormhole);
        }
    }
    
    // Draw the drag line for creating new particles
    if (startCoords[0] !== -1 && endCoords[0] !== -1) {
        var worldDragStartX = (startCoords[0] - panX) / zoomLevel;
        var worldDragStartY = (startCoords[1] - panY) / zoomLevel;
        var worldDragEndX = (endCoords[0] - panX) / zoomLevel;
        var worldDragEndY = (endCoords[1] - panY) / zoomLevel;
        
        context.beginPath();
        context.moveTo(worldDragStartX, worldDragStartY);
        context.lineTo(worldDragEndX, worldDragEndY);
        context.strokeStyle = "blue";
        context.lineWidth = 2 / zoomLevel;
        context.stroke();
    }
    
    context.restore();
    
    // Update particle count
    document.getElementById("particleCount").innerText = "Particles: " + particleList.length;
}

// Helper drawing functions
function drawParticle(p) {
    // Collision effect - glow
    if (p.collisionTimer > 0) {
        var glow = context.createRadialGradient(
            p.x, p.y, p.radius,
            p.x, p.y, p.radius * (1 + p.collisionEnergy * 2)
        );
        glow.addColorStop(0, `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, 1)`);
        glow.addColorStop(1, `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, 0)`);
        
        context.beginPath();
        context.arc(p.x, p.y, p.radius * (1 + p.collisionEnergy * 2), 0, 2 * Math.PI);
        context.fillStyle = glow;
        context.fill();
    }
    
    // Particle itself
    var gradient = context.createRadialGradient(
        p.x, p.y, p.radius * 0.75,
        p.x, p.y, p.radius
    );
    gradient.addColorStop(0, `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, 1)`);
    gradient.addColorStop(1, `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, 0)`);
    
    context.beginPath();
    context.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
    context.fillStyle = p.radius < 3 ? "#" + p.color[3] : gradient;
    context.fill();
    
    // Neutron star pulsar beams
    if (p.type === "neutron") {
        p.pulsePhase = (p.pulsePhase + h * 5) % (2 * Math.PI);
        var pulseIntensity = 0.5 + 0.5 * Math.sin(p.pulsePhase);
        
        for (var i = 0; i < 2; i++) {
            var angle = p.pulsePhase + i * Math.PI;
            context.beginPath();
            context.moveTo(p.x, p.y);
            context.lineTo(
                p.x + Math.cos(angle) * p.magnetosphereRadius * 2,
                p.y + Math.sin(angle) * p.magnetosphereRadius * 2
            );
            context.strokeStyle = `rgba(0, 200, 255, ${pulseIntensity * 0.7})`;
            context.lineWidth = 3 / zoomLevel;
            context.stroke();
        }
    }
}

function drawBlackHole(p) {
    // Accretion disk with more detail
    var innerRadius = p.eventHorizonRadius * 1.2;
    var outerRadius = p.accretionDiskRadius;
    
    // Create gradient for accretion disk
    var gradient = context.createRadialGradient(
        p.x, p.y, innerRadius,
        p.x, p.y, outerRadius
    );
    gradient.addColorStop(0, "rgba(255, 50, 0, 0.9)");
    gradient.addColorStop(0.5, "rgba(255, 150, 0, 0.7)");
    gradient.addColorStop(1, "rgba(255, 255, 0, 0.2)");
    
    context.beginPath();
    context.arc(p.x, p.y, outerRadius, 0, 2 * Math.PI);
    context.fillStyle = gradient;
    context.fill();
    
    // Event horizon with glow
    var glow = context.createRadialGradient(
        p.x, p.y, p.eventHorizonRadius * 0.8,
        p.x, p.y, p.eventHorizonRadius * 1.5
    );
    glow.addColorStop(0, "rgba(100, 100, 100, 0.8)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    
    context.beginPath();
    context.arc(p.x, p.y, p.eventHorizonRadius * 1.5, 0, 2 * Math.PI);
    context.fillStyle = glow;
    context.fill();
    
    // Event horizon
    context.beginPath();
    context.arc(p.x, p.y, p.eventHorizonRadius, 0, 2 * Math.PI);
    context.fillStyle = "rgba(0, 0, 0, 0.9)";
    context.fill();
    
    // Jets
    context.beginPath();
    context.moveTo(p.x, p.y - p.eventHorizonRadius * 4);
    context.lineTo(p.x, p.y - p.eventHorizonRadius * 10);
    context.strokeStyle = "rgba(255, 100, 0, 0.7)";
    context.lineWidth = 3 / zoomLevel;
    context.stroke();
    
    context.beginPath();
    context.moveTo(p.x, p.y + p.eventHorizonRadius * 4);
    context.lineTo(p.x, p.y + p.eventHorizonRadius * 10);
    context.stroke();
    
    // Name and mass
    if (showParticleNames && p.name) {
        context.fillStyle = "#ffffff";
        context.font = (10 / zoomLevel) + "px Arial";
        context.textAlign = "center";
        context.fillText(p.name, p.x, p.y - p.accretionDiskRadius - 10 / zoomLevel);
    }
    
    if (showParticleMass) {
        context.fillStyle = "#ffffff";
        context.font = (8 / zoomLevel) + "px Arial";
        context.textAlign = "center";
        var massText = p.mass.toExponential(1);
        context.fillText("Mass: " + massText, p.x, p.y + p.accretionDiskRadius + 10 / zoomLevel);
    }
}

function drawWormhole(w) {
    // Wormhole entrance
    var gradient = context.createRadialGradient(
        w.x, w.y, w.radius,
        w.x, w.y, w.wormholeRadius
    );
    gradient.addColorStop(0, "rgba(150, 0, 255, 0.9)");
    gradient.addColorStop(1, "rgba(50, 0, 150, 0.2)");
    
    context.beginPath();
    context.arc(w.x, w.y, w.wormholeRadius, 0, 2 * Math.PI);
    context.fillStyle = gradient;
    context.fill();
    
    // Connection line if linked
    if (w.linkedWormhole && particleList.includes(w.linkedWormhole)) {
        context.beginPath();
        context.moveTo(w.x, w.y);
        context.lineTo(w.linkedWormhole.x, w.linkedWormhole.y);
        context.strokeStyle = "rgba(150, 0, 255, 0.3)";
        context.lineWidth = 1 / zoomLevel;
        context.stroke();
    }
    
    // Name
    if (showParticleNames && w.name) {
        context.fillStyle = "#ffffff";
        context.font = (10 / zoomLevel) + "px Arial";
        context.textAlign = "center";
        context.fillText(w.name, w.x, w.y - w.wormholeRadius - 10 / zoomLevel);
    }
}

function drawGravityField() {
        var gridSize = 10;
        var lineWidth = 1 / zoomLevel;
        
        var worldViewLeft = Math.max(0, (0 - panX) / zoomLevel);
        var worldViewTop = Math.max(0, (0 - panY) / zoomLevel);
        var worldViewRight = Math.min(width, (width - panX) / zoomLevel);
        var worldViewBottom = Math.min(height, (height - panY) / zoomLevel);

        context.beginPath();
        context.strokeStyle = "rgba(100, 100, 255, 0.5)";
        context.lineWidth = lineWidth;
        
        for(var y = worldViewTop; y < worldViewBottom; y += gridSize){
            var points = [];
            for(var x = worldViewLeft; x <= worldViewRight; x += 5){
                var displacedX = x;
                var displacedY = y;
                
                for(var i = 0; i < particleList.length; i++){
                    var p = particleList[i];
                    var dx = p.x - x;
                    var dy = p.y - y;
                    var distSq = dx*dx + dy*dy;
                    
                    if(distSq < 10000 && distSq > 100){
                        var dist = Math.sqrt(distSq);
                        var force = p.mass / distSq * (p.type === "matter" ? 1 : -1);
                        var displacement = Math.min(20, force * 1000 / dist);
                        
                        displacedX += dx * displacement / dist;
                        displacedY += dy * displacement / dist;
                    }
                }
                
                points.push({x: displacedX, y: displacedY});
            }
            
            if(points.length > 1){
                context.moveTo(points[0].x, points[0].y);
                for(var j = 1; j < points.length; j++){
                    context.lineTo(points[j].x, points[j].y);
                }
            }
        }
        context.stroke();
        
        context.beginPath();
        context.strokeStyle = "rgba(100, 100, 255, 0.5)";
        context.lineWidth = lineWidth;
        
        for(var x = worldViewLeft; x < worldViewRight; x += gridSize){
            var points = [];
            for(var y = worldViewTop; y <= worldViewBottom; y += 5){
                var displacedX = x;
                var displacedY = y;
                
                for(var i = 0; i < particleList.length; i++){
                    var p = particleList[i];
                    var dx = p.x - x;
                    var dy = p.y - y;
                    var distSq = dx*dx + dy*dy;
                    
                    if(distSq < 10000 && distSq > 100){
                        var dist = Math.sqrt(distSq);
                        var force = p.mass / distSq * (p.type === "matter" ? 1 : -1);
                        var displacement = Math.min(20, force * 1000 / dist);
                        
                        displacedX += dx * displacement / dist;
                        displacedY += dy * displacement / dist;
                    }
                }
                
                points.push({x: displacedX, y: displacedY});
            }
            
            if(points.length > 1){
                context.moveTo(points[0].x, points[0].y);
                for(var j = 1; j < points.length; j++){
                    context.lineTo(points[j].x, points[j].y);
                }
            }
        }
        context.stroke();
        
        context.beginPath();
        context.fillStyle = "rgba(150, 150, 255, 0.7)";
        for(var y = worldViewTop; y < worldViewBottom; y += gridSize){
            for(var x = worldViewLeft; x < worldViewRight; x += gridSize){
                context.moveTo(x, y);
                context.arc(x, y, 1 / zoomLevel, 0, 2 * Math.PI);
            }
        }
        context.fill();
}

function drawOrbits() {
    context.lineWidth = 1 / zoomLevel;
    for (var i = 0; i < particleList.length; i++) {
        var p = particleList[i];
        if (p.path.length > 1) {
            context.beginPath();
            context.strokeStyle = `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, 0.5)`;
            context.moveTo(p.path[0].x, p.path[0].y);
            for (var j = 1; j < p.path.length; j++) {
                context.lineTo(p.path[j].x, p.path[j].y);
            }
            context.stroke();
        }
    }
}

function drawGravityWells() {
    for (var i = 0; i < particleList.length; i++) {
        var p = particleList[i];
        if (p.mass > 0) {
            var maxRadius = p.radius * 10 + Math.log(p.mass) * 5;
            var numCircles = 20;
            var colorBase = p.color;
            
            for (var j = 1; j <= numCircles; j++) {
                var currentRadius = maxRadius * (j / numCircles);
                var alpha = 0.3 * (1 - (j / numCircles));
                
                context.beginPath();
                context.arc(p.x, p.y, currentRadius, 0, 2 * Math.PI);
                context.strokeStyle = `rgba(${colorBase[0]}, ${colorBase[1]}, ${colorBase[2]}, ${alpha})`;
                context.lineWidth = 1 / zoomLevel;
                context.stroke();
            }
        }
    }
}

function drawGravitationalLensing() {
    // Create a temporary canvas for the lensing effect
    var lensingCanvas = document.createElement("canvas");
    lensingCanvas.width = width;
    lensingCanvas.height = height;
    var lensingContext = lensingCanvas.getContext("2d");
    
    // Draw the current state to the temp canvas
    lensingContext.save();
    lensingContext.translate(panX, panY);
    lensingContext.scale(zoomLevel, zoomLevel);
    
    // Draw all particles to the temp canvas
    for (var i = 0; i < particleList.length; i++) {
        var p = particleList[i];
        if (p.isBlackHole) {
            // Only black holes cause lensing in this simulation
            var distortionRadius = p.eventHorizonRadius * 10;
            
            // Create a radial gradient for the distortion
            var gradient = lensingContext.createRadialGradient(
                p.x, p.y, 0,
                p.x, p.y, distortionRadius
            );
            gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
            gradient.addColorStop(0.7, "rgba(0, 0, 0, 0.8)");
            gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
            
            lensingContext.beginPath();
            lensingContext.arc(p.x, p.y, distortionRadius, 0, 2 * Math.PI);
            lensingContext.fillStyle = gradient;
            lensingContext.fill();
        }
    }
    
    lensingContext.restore();
    
    // Apply the lensing effect as a displacement map
    context.globalCompositeOperation = "source-over";
    context.drawImage(lensingCanvas, 0, 0);
}


// New toggle function for gravitational lensing
function toggleGravitationalLensing() {
    showGravitationalLensing = !showGravitationalLensing;
    document.getElementById("toggleLensingBtn").innerHTML = 
        showGravitationalLensing ? "Hide Lensing" : "Show Lensing";
}
