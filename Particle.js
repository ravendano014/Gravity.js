function Particle(t,s,h,i,o,a,n){
    this.mass = t;
    this.x = s;
    this.y = h;
    this.vx = i;
    this.vy = o;
    this.ax = 0;
    this.ay = 0;
    this.type = a || "matter";
    this.name = n || "";
    this.color = [];
    this.age = 0;
    this.lifetime = Infinity;
    
    // Black hole properties
    this.isBlackHole = (this.type === "blackhole");
    if (this.isBlackHole) {
        this.color = [0, 0, 0];
        this.radius = Math.sqrt(t) / 20;
        this.eventHorizonRadius = (2 * t) / 1000;
        this.accretionDiskRadius = this.eventHorizonRadius * 3;
        this.gravityInfluenceRadius = this.eventHorizonRadius * 50; // Radio de influencia grande
        this.name = "Black Hole (" + Math.round(t/1e4) + "M☉)";
    } 
    // Neutron star properties
    else if (this.type === "neutron") {
        this.color = [255, 255, 255];
        this.radius = Math.sqrt(t) / 100;
        this.magnetosphereRadius = this.radius * 15;
        this.gravityInfluenceRadius = this.radius * 100; // Radio de influencia grande
        this.eventHorizonRadius = 0; // No tiene horizonte de eventos
        this.accretionDiskRadius = this.radius * 10; // Disco de acreción más pequeño
        this.name = "Neutron Star";
        this.pulsePhase = 0;
    }
    // Dark matter properties
    else if (this.type === "dark") {
        this.color = [100, 0, 150];
        this.radius = Math.sqrt(t) / 30;
        this.name = "Dark Matter";
    }
    // Normal matter/antimatter
    else {
        this.type === "matter" 
            ? (this.color = [255, Math.round(256/(1+Math.pow(t/1e5,1))), Math.round(256/(1+Math.pow(t/1e4,1)))])
            : (this.color = [Math.round(256/(1+Math.pow(t/1e4,1))), Math.round(256/(1+Math.pow(t/1e5,1))), 255]);
        this.radius = Math.log(Math.E + t/1e3);
    }
    
    this.color[3] = (this.color[0] << 16 | this.color[1] << 8 | this.color[2]).toString(16);
    this.path = [];
    this.pathLength = 10000;
    
    // For collision effects
    this.collisionEnergy = 0;
    this.collisionTimer = 0;
}
