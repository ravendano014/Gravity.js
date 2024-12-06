//Simulates and draws Particles
//TODO: improve integration code. Why not add accelerations to both particles being compared?
var showTrails = false; // Inicialmente desactivado
var tinyParticleRadius = Math.log(Math.E + 100 / 1e3); // Tamaño para masa 100
var trailPositions = [];

function init() {
    var t = document.getElementById("canvas"),
        e = document.getElementById("controlbox");
    (t.width = window.innerWidth - 30),
        (t.height = window.innerHeight - 20),
        (width = t.width),
        (height = t.height),
        (context = t.getContext("2d")),
        window.addEventListener("mousedown", mouseDownListener, !1),
        (e.onmouseover = function () {
            onControlBox = !0;
        }),
        (e.onmouseout = function () {
            onControlBox = !1;
        });
}
function main() {
    (starttime = Date.now()), integrate(), draw(), (frametime = Date.now() - starttime);
}
function mouseDownListener(t) {
    onControlBox ||
        ((shiftDown = t.shiftKey),
        (startCoords[0] = t.clientX),
        (startCoords[1] = t.clientY),
        (endCoords[0] = t.clientX),
        (endCoords[1] = t.clientY),
        window.addEventListener("mousemove", mouseMoveListener, !1),
        window.addEventListener("mouseup", mouseUpListener, !1));
}
function mouseMoveListener(t) {
    (endCoords[0] = t.clientX), (endCoords[1] = t.clientY);
}
function mouseUpListener(event) {
    // Remover los listeners de movimiento y liberación del mouse
    window.removeEventListener("mousemove", mouseMoveListener);
    window.removeEventListener("mouseup", mouseUpListener);

    // Crear partículas con diferentes masas según el botón del mouse
    if (!event.shiftKey && !shiftDown) {
        var mass = event.button === 2 ? -newMass : newMass; // Masa negativa para clic derecho
        var particle = new Particle(
            mass,
            startCoords[0],
            startCoords[1],
            endCoords[0] - startCoords[0],
            endCoords[1] - startCoords[1]
        );
        particleList.push(particle);
    }

    // Movimiento del sistema con Shift
    if (event.shiftKey && shiftDown) {
        particleShift = [
            endCoords[0] - startCoords[0],
            endCoords[1] - startCoords[1],
        ];
    }

    // Reiniciar coordenadas
    startCoords = [-1, -1];
    endCoords = [-1, -1];
}

function setNewMass(t) {
    console.log(t), (newMass = t);
}
function integrate() {
    for (var t = new Array(), e = 0; e < particleList.length; e++) {
        for (var o = particleList[e], r = 0, i = 0, s = 0; s < particleList.length; s++)
            if (((otherParticle = particleList[s]), o != otherParticle && !o.collided && !otherParticle.collided)) {
                var a = otherParticle.x - o.x,
                    n = otherParticle.y - o.y,
                    c = Math.sqrt(a * a + n * n);
                if (c < o.radius / 1.5 + otherParticle.radius / 1.5) {
                    (o.collided = !0), (otherParticle.collided = !0);
                    var l = o.mass + otherParticle.mass,
                        d = new Particle(
                            l,
                            (o.x * o.mass + otherParticle.x * otherParticle.mass) / l,
                            (o.y * o.mass + otherParticle.y * otherParticle.mass) / l,
                            (o.vx * o.mass + otherParticle.vx * otherParticle.mass) / l,
                            (o.vy * o.mass + otherParticle.vy * otherParticle.mass) / l
                        );
                    t.push(d);
                }
                var p = otherParticle.mass / (c * c);
                // var p = otherParticle.mass * o.mass / (c * c); // Usar el signo de la masa para la fuerza
                (r += (p * a) / c), (i += (p * n) / c);
            }
        (o.ax = r), (o.ay = i);
    }
    for (var m = 0; m < particleList.length; m++)
        (particleList[m].vx += particleList[m].ax * h),
            (particleList[m].vy += particleList[m].ay * h),
            (particleList[m].x += particleList[m].vx * h + particleShift[0]),
            (particleList[m].y += particleList[m].vy * h + particleShift[1]),
            (particleList[m].collided || particleList[m].x < -50 || particleList[m].y < -50 || particleList[m].x > width + 50 || particleList[m].y > height + 50) && (particleList.splice(m, 1), m--);
    Array.prototype.push.apply(particleList, t), (particleShift = [0, 0]);
}
function draw() {
    // Limpiar el lienzo si los trails están desactivados
    if (!showTrails) {
        context.clearRect(0, 0, width, height);
        trailPositions = []; // Reinicia las trayectorias si están desactivadas
    }

    // Dibujar las partículas
    for (var t = 0; t < particleList.length; t++) {
        var e = particleList[t];

        context.beginPath();
        context.arc(e.x, e.y, e.radius, 0, 2 * Math.PI); // Partícula dinámica
        context.closePath();

        // Agregar la posición actual a las trayectorias
        if (showTrails) {
            trailPositions.push({ x: e.x, y: e.y , radius: e.radius});
            context.beginPath();
            context.arc(e.x, e.y, e.radius, 0, 2 * Math.PI); // Partícula dinámica
            context.closePath();
            context.fillStyle = "rgba(0, 0, 0, 0.4)"; // Color translúcido para el trail
            context.fill();
        }

        // Estilo dinámico para la partícula
        var o = e.color;
        if (e.radius < 3) {
            context.fillStyle = "#" + o[3];
        } else {
            var r = context.createRadialGradient(e.x, e.y, 0.75 * e.radius, e.x, e.y, e.radius);
            r.addColorStop(0, "rgba(" + o[0] + "," + o[1] + "," + o[2] + ",1.0)");
            r.addColorStop(1, "rgba(" + o[0] + "," + o[1] + "," + o[2] + ",0)");
            context.fillStyle = r;
        }
        context.fill();
    }

    // Dibujar las trayectorias
    if (showTrails) {
        for (var i = 0; i < trailPositions.length; i++) {
            var trail = trailPositions[i];

            context.beginPath();
            context.arc(trail.x, trail.y, tinyParticleRadius / 2, 0, 2 * Math.PI);
            context.closePath();
            context.fillStyle = "rgba(255, 255, 255, 0.1)"; // Color translúcido para el trail
            context.fill();
        }
    }

    // Limitar la cantidad de posiciones en las trayectorias
    if (trailPositions.length > 1000) {
        trailPositions.splice(0, trailPositions.length - 1000);
    }
}

var h = 0.005,
    context,
    particleList = new Array(),
    context,
    frametime,
    starttime,
    width,
    height,
    startCoords = [-1, -1],
    endCoords = [-1, -1],
    newMass = 1e3,
    onControlBox = !1,
    shiftDown = !1,
    particleShift = [0, 0];

function toggleTrails() {
    showTrails = !showTrails; // Alterna entre verdadero y falso
}

function saveSimulation() {
    const simulationState = {
        particles: particleList.map(particle => ({
            mass: particle.mass,
            x: particle.x,
            y: particle.y,
            vx: particle.vx,
            vy: particle.vy,
            ax: particle.ax,
            ay: particle.ay,
            radius: particle.radius,
            color: particle.color
        })),
        trailsEnabled: showTrails
    };

    // Convertir a JSON y descargar como archivo
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(simulationState));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "simulation_state.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function loadSimulation(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const simulationState = JSON.parse(e.target.result);

            // Restaurar partículas
            particleList = simulationState.particles.map(particleData => {
                const particle = new Particle(
                    particleData.mass,
                    particleData.x,
                    particleData.y,
                    particleData.vx,
                    particleData.vy
                );
                particle.ax = particleData.ax;
                particle.ay = particleData.ay;
                particle.radius = particleData.radius;
                particle.color = particleData.color;
                return particle;
            });

            // Restaurar configuración de trails
            showTrails = simulationState.trailsEnabled;

            alert("Simulation loaded successfully!");
        };
        reader.readAsText(file);
    }
}

