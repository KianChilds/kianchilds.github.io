
let settings = {
  defaultDT: 0.125,
  dampenBounce: 1,
}

let state = {
  colliders:[],
  mode:"SIM",
}

let collisionDetectors= {
      "CIRCLE":function(collider,ball){
        const dist =collider.pos.copy().sub(ball.pos).mag();
        return dist > collider.r-ball.r && dist < collider.r+ball.r
      }
    }

/*
Valid Modes
HOME - The home screen
SIM - running the simulation
*/
const modes = {
  "SIM":{
    "render":function(state){
      for(let col of state.colliders){
        renderCollider(col)
      }
      for(let ball of state.balls){
        renderBall(ball)
      }
    },
    
    
  }
}

function genCircleCollider(pos,r){
  return {"pos":pos,"r":r,"type":"CIRCLE"}
}

function genBalls(center, dir, spacing, rep, vel, r){
  let balls = []
  for(let i=0;i<rep;i++){
    let nBall = genBall(center.copy().add(dir.copy().mult(spacing*i)),vel,r)
    nBall.col = 255*i/rep
    balls.push(nBall)
  }
  return balls 
}

function genBall(pos, vel, r){
  return {
    // y-(x-y)
    "pos":pos,
    "r":r,
    "vel":vel,
    "collisionFn":function(obj,ball){
      switch(obj.type){
        case "CIRCLE":
          const fromCirCenter = obj.pos.copy().sub(ball.pos)
          const fromCirCenterDir = fromCirCenter.heading()
          const surfNormalDir = fromCirCenter.mult(-1).heading()
          const mag = ball.vel.mag()*settings.dampenBounce
          const ballDir = ball.vel.heading()
          ball.vel = p5.Vector.fromAngle(surfNormalDir*2-ballDir+PI,mag*settings.dampenBounce)
          ball.pos = p5.Vector.fromAngle(fromCirCenterDir+PI,obj.r-ball.r-0.01).add(obj.pos)
          
        break;
      }
    }
  }
}

function renderBall(cir){
  stroke(cir.col,cir.col,cir.col,50)
  ellipse(cir.pos.x,cir.pos.y,cir.r*2)
}

function renderCollider(col){
  stroke(0)
  switch(col.type){
    case "CIRCLE":
      ellipse(col.pos.x,col.pos.y,col.r*2)
      break;
  }
}

function setup() {
  let cnv = createCanvas(400, 400, document.getElementById("disp"));  
  state.balls = genBalls(
    createVector(width/2,height/2), // Center
    p5.Vector.fromAngle(PI/2), //direction
    4, // Spacing
    23, // Number of balls
    createVector(2,0),// vel
    10) // r
  
  state.colliders.push(genCircleCollider(createVector(width/2,height/2),100))
  noFill()
  background(51)
}

function draw() {
  background(51,60);
  modes[state.mode].render(state)
  dynamicStep(0.3);
}

function dynamicStep(targDt){
  while(targDt > 0){
    // Calculate the maximum safe step
    // either the next collision, the base simrate, or reaching the targetDt
    let dt = min(calcNextCollision, settings.defaultDT, targDt)
    simStep(dt,state.balls,state.colliders)
  
    // Call the next step with the time remaining
    dynamicStep(targDt-dt); 
    targDt -= dt;
  }
}


function getAccelartion(){
  return createVector(0,0)
}

function calcNextCollision(){
  return settings.defaultDt;
}

/**
* detects if the giving object is colliding with the other,
* given the collider calculator in the object
*/
function isColliding(obj, colliders){
  for(let collider of colliders){
    if(collisionDetectors[collider.type] != null){
      if(collisionDetectors[collider.type](collider, obj)) return collider;
    }else{
      raiseError("Missing Collision detector")
    }
  }
  return false;
}

function simStep(dt, balls, colliders){
  for(let ball of balls){
    ball.pos = ball.pos.add(ball.vel.copy().mult(dt));
    ball.vel.add(getAccelartion().mult(dt))

    let collisionObj = isColliding(ball,colliders)
    if(collisionObj){
      ball.collisionFn(collisionObj,ball)
    }
  }
}


