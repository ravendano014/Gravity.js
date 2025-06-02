// Global variables for the simulation
var h=.005,context,particleList=[],frametime,starttime,width,height,startCoords=[-1,-1],endCoords=[-1,-1],newMass=1e3,onControlBox=!1,shiftDown=!1,particleShift=[0,0],trailsEnabled=!1,currentParticleType="matter",gravityFieldEnabled=!1,showParticleNames=!1;

// Initializes the canvas and event listeners
function init(){var t=document.getElementById("canvas"),e=document.getElementById("controlbox");t.width=window.innerWidth-30,t.height=window.innerHeight-20,width=t.width,height=t.height,context=t.getContext("2d"),window.addEventListener("mousedown",mouseDownListener,!1),e.onmouseover=function(){onControlBox=!0},e.onmouseout=function(){onControlBox=!1}}

// Main simulation loop
function main(){starttime=Date.now(),integrate(),draw(),frametime=Date.now()-starttime}

// Mouse down event listener
function mouseDownListener(t){onControlBox||(shiftDown=t.shiftKey,startCoords[0]=t.clientX,startCoords[1]=t.clientY,endCoords[0]=t.clientX,endCoords[1]=t.clientY,window.addEventListener("mousemove",mouseMoveListener,!1),window.addEventListener("mouseup",mouseUpListener,!1))}

// Mouse move event listener
function mouseMoveListener(t){endCoords[0]=t.clientX,endCoords[1]=t.clientY}

// Mouse up event listener
function mouseUpListener(t){window.removeEventListener("mousemove",mouseMoveListener),window.removeEventListener("mouseup",mouseUpListener),!t.shiftKey&&!shiftDown&&particleList.push(new Particle(newMass,startCoords[0],startCoords[1],endCoords[0]-startCoords[0],endCoords[1]-startCoords[1],currentParticleType,"")),t.shiftKey&&shiftDown&&(particleShift=[endCoords[0]-startCoords[0],endCoords[1]-startCoords[1]]),startCoords=[-1,-1],endCoords=[-1,-1]}

// Sets the mass for new particles
function setNewMass(t){newMass=t}

// Toggles particle trails
function toggleTrails(){trailsEnabled=!trailsEnabled}

// Toggles particle type (matter/antimatter)
function toggleParticleType(){currentParticleType=currentParticleType=="matter"?"antimatter":"matter",document.getElementById("particleTypeBtn").innerHTML=currentParticleType=="matter"?"Matter":"Antimatter"}

// NEW: Toggles gravitational field visualization
function toggleGravityField(){gravityFieldEnabled=!gravityFieldEnabled}

// NEW: Toggles particle name display
function toggleParticleNames(){showParticleNames=!showParticleNames}

// Integrates particle physics (calculates forces and updates positions/velocities)
function integrate(){
    // Calculate accelerations
    for(var t=0;t<particleList.length;t++){
        var e=particleList[t];e.ax=0,e.ay=0;
        for(var o=0;o<particleList.length;o++){
            if(t!==o){
                var r=particleList[o],i=r.x-e.x,s=r.y-e.y,a=Math.sqrt(i*i+s*s);
                if(a>1e-5){
                    var n=e.type==r.type?1:-1;
                    e.ax+=n*r.mass*i/(a*a*a),e.ay+=n*r.mass*s/(a*a*a)
                }
            }
        }
    }

    // Update velocities and positions
    for(var c=[],l=0;l<particleList.length;l++){
        var d=particleList[l];
        d.vx+=d.ax*h,d.vy+=d.ay*h,d.x+=d.vx*h+particleShift[0],d.y+=d.vy*h+particleShift[1]
    }

    // Handle collisions (merging particles)
    for(var p=new Array(particleList.length).fill(!1),u=0;u<particleList.length;u++){
        if(!p[u]){
            var m=particleList[u];
            for(var f=u+1;f<particleList.length;f++){
                if(!p[f]){
                    var g=particleList[f],v=g.x-m.x,y=g.y-m.y,b=Math.sqrt(v*v+y*y);
                    if(b<m.radius/1.5+g.radius/1.5){
                        p[u]=!0,p[f]=!0;
                        var w=m.mass+g.mass,x=(m.x*m.mass+g.x*g.mass)/w,P=(m.y*m.mass+g.y*g.mass)/w,C=(m.vx*m.mass+g.vx*g.mass)/w,A=(m.vy*m.mass+g.vy*g.mass)/w;
                        c.push(new Particle(w,x,P,C,A,m.type==g.type?m.type:"matter","")); // Pass empty name for merged
                        break
                    }
                }
            }
        }
    }

    // Filter out collided particles and add new ones
    for(var S=[],k=0;k<particleList.length;k++)!p[k]&&particleList[k].x>=-50&&particleList[k].y>=-50&&particleList[k].x<=width+50&&particleList[k].y<=height+50&&S.push(particleList[k]);
    particleList=S.concat(c),particleShift=[0,0]
}

// Draws all elements on the canvas
function draw(){
    // Clear the canvas or draw trails depending on trailsEnabled
    trailsEnabled?(context.fillStyle="rgba(0,0,0,0.05)",context.fillRect(0,0,width,height)):context.clearRect(0,0,width,height);

    // Draw the drag line for creating new particles (if active)
    context.beginPath();
    context.moveTo(startCoords[0],startCoords[1]);
    context.lineTo(endCoords[0],endCoords[1]);
    context.strokeStyle="blue";
    context.lineWidth=2; // Use lineWidth instead of strokeWidth
    context.stroke();

    // Logic to draw the gravitational field (if enabled)
    if(gravityFieldEnabled){
        var gridSize=40; // Size of the grid (distance between sampling points)
        var arrowLength=15; // Length of the field arrows
        var maxFieldStrength=0; // To normalize color intensity

        // First pass: Calculate the maximum field strength to normalize visualization
        for(var y=0;y<height;y+=gridSize){
            for(var x=0;x<width;x+=gridSize){
                var totalAx=0;
                var totalAy=0;

                for(var i=0;i<particleList.length;i++){
                    var particle=particleList[i];
                    var dx=particle.x-x;
                    var dy=particle.y-y;
                    var distanceSq=dx*dx+dy*dy;

                    if(distanceSq<100){continue} // Minimum distance to avoid extreme values

                    var distance=Math.sqrt(distanceSq);
                    var forceMagnitude=particle.mass/distanceSq;
                    var sign=particle.type==="matter"?1:-1;

                    totalAx+=sign*forceMagnitude*dx/distance;
                    totalAy+=sign*forceMagnitude*dy/distance;
                }
                var fieldStrength=Math.sqrt(totalAx*totalAx+totalAy*totalAy);
                if(fieldStrength>maxFieldStrength){maxFieldStrength=fieldStrength}
            }
        }

        // Second pass: Draw the field lines/arrows
        for(var y=0;y<height;y+=gridSize){
            for(var x=0;x<width;x+=gridSize){
                var totalAx=0;
                var totalAy=0;

                for(var i=0;i<particleList.length;i++){
                    var particle=particleList[i];
                    var dx=particle.x-x;
                    var dy=particle.y-y;
                    var distanceSq=dx*dx+dy*dy;

                    if(distanceSq<100){continue}

                    var distance=Math.sqrt(distanceSq);
                    var forceMagnitude=particle.mass/distanceSq;
                    var sign=particle.type==="matter"?1:-1;

                    totalAx+=sign*forceMagnitude*dx/distance;
                    totalAy+=sign*forceMagnitude*dy/distance;
                }

                var fieldStrength=Math.sqrt(totalAx*totalAx+totalAy*totalAy);

                if(fieldStrength>0){
                    var normalizedStrength=maxFieldStrength>0?fieldStrength/maxFieldStrength:0;
                    var colorValue=Math.floor(normalizedStrength*255);

                    if(particleList.length>0&&particleList[0].type==="matter"){
                        context.strokeStyle="rgb("+(255-colorValue)+", "+(255-colorValue/2)+", 255)";
                    }else{
                        context.strokeStyle="rgb(255, "+(255-colorValue)+", "+(255-colorValue)+")";
                    }

                    context.lineWidth=1;

                    var angle=Math.atan2(totalAy,totalAx);
                    var startX=x;
                    var startY=y;
                    var endX=x+arrowLength*normalizedStrength*Math.cos(angle);
                    var endY=y+arrowLength*normalizedStrength*Math.sin(angle);

                    context.beginPath();
                    context.moveTo(startX,startY);
                    context.lineTo(endX,endY);
                    context.stroke();

                    context.save();
                    context.translate(endX,endY);
                    context.rotate(angle);
                    context.beginPath();
                    context.moveTo(0,0);
                    context.lineTo(-5,-3);
                    context.lineTo(-5,3);
                    context.closePath();
                    context.fillStyle=context.strokeStyle;
                    context.fill();
                    context.restore();
                }
            }
        }
    }

    // Draw all particles
    for(var t=0;t<particleList.length;t++){
        var e=particleList[t],o=context.createRadialGradient(e.x,e.y,.75*e.radius,e.x,e.y,e.radius);
        o.addColorStop(0,"rgba("+e.color[0]+","+e.color[1]+","+e.color[2]+",1.0)");
        o.addColorStop(1,"rgba("+e.color[0]+","+e.color[1]+","+e.color[2]+",0)");

        context.beginPath();
        context.arc(e.x,e.y,e.radius,0,2*Math.PI);
        context.closePath();
        context.fillStyle=e.radius<3?"#"+e.color[3]:o;
        context.fill();

        // NEW: Draw particle name if enabled and name exists
        if(showParticleNames&&e.name){
            context.fillStyle="#ffffff"; // Text color
            context.font="10px Arial"; // Text font and size
            context.textAlign="center"; // Text alignment
            context.fillText(e.name,e.x,e.y-e.radius-5); // Text position (above the particle)
        }
    }
}


