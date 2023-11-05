phina.globalize();

var G = 1.5;   // 重力
var Ex = 0.5; // 反発係数
var Ey = 0.2;
var M = 1;   // 動摩擦係数
var Eps = 0.01;
var SCREEN_HEIGHT = 960;
var SCREEN_WIDTH = 600;
var ID_COUNTER = 1;
var VyMAX = 50;

var EATER_ID = 99;
var fruitType = [
  { fruit_id: 0, name: 'cherry',  radius: 16, next: 1, score: 1 },
  { fruit_id: 1, name: 'strawberry', radius: 32, next: 2, score: 3 },
  { fruit_id: 2, name: 'grape',  radius: 48, next: 3, score: 6 },
  { fruit_id: 3, name: 'orange',  radius: 64, next: 4, score: 10 },
  { fruit_id: 4, name: 'plum',  radius: 80, next: 5, score: 15 },
  { fruit_id: 5, name: 'apple',  radius: 96, next: 6, score: 21 },
  { fruit_id: 6, name: 'pear',  radius: 112, next: 7, score: 28 },
  { fruit_id: 7, name: 'peach',  radius: 128, next: 8, score: 36 },
  { fruit_id: 8, name: 'pineapple',  radius: 144, next: 9, score: 45 },
  { fruit_id: 9, name: 'melon',  radius: 160, next: 10, score: 55 },
  { fruit_id: 10, name: 'watermelon',  radius: 180, next: null, score: 66 },
  { fruit_id: 99, name: 'eater', radius: 60, next: null, score: 0 },
];
var assets = { image: {} };
fruitType.map((f) => assets.image[f.name] = `./images/${f.name}.png`);

phina.define('Fruit', {
  superClass: 'CircleShape',

  init: function(options) {
    const { name, x, y, radius, next, fruit_id, score } = options;
    const superOptions = { x, y, radius, fill: '#f5deb3', strokeWidth: 0};
    this.superInit(superOptions);

    if(!this.y) { this.top = 0; }
    this.vx = 0;
    this.vy = 0;
    this.rotation = 0;
    this.fruit_id = fruit_id;
    this.next = next;
    this.id = ID_COUNTER++;
    this.score = score;
    Sprite(name).addChildTo(this);
  },

  updateV: function(ax, ay) {
    this.vx += ax;
    this.vy += ay;
    this.vy = Math.min(this.vy, VyMAX);
    if(this.vx > 0 && this.bottom >= SCREEN_HEIGHT){
      this.vx = Math.sign(this.vx) * (Math.max(0, Math.abs(this.vx) - M));
      if(this.vx < 1) { this.vx = 0; }
    }
  },

  v: function(){
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  },

  move: function() {
  	this.x += this.vx;
  	this.y += this.vy;
    this.rotation += this.vx;
  	if(this.bottom > SCREEN_HEIGHT){
      this.bottom = SCREEN_HEIGHT;
      this.vy = this.vy * -1 * Ey;
  	}
  	if(this.left < 0){
  	  this.left = 0;
      this.vx = 0;
  	}
  	if(this.right > SCREEN_WIDTH) {
  	  this.right = SCREEN_WIDTH;
      this.vx = 0;
  	}
  },

  checkHit: function(other, scene){
    if(!Collision.testCircleCircle(this, other)){ return; }
    const fruits = scene.fruits;
    if(this.fruit_id === EATER_ID || other.fruit_id === EATER_ID){
      scene.score += Math.max(this.score, other.score) * 3;
      const new_fruits = scene.fruits.filter((f) => f.id != this.id && f.id != other.id);
      other.remove();
      this.remove();
      scene.fruits = new_fruits;
      return;
    }
    if(this.fruit_id === other.fruit_id && this.next){
      scene.score += this.score;
      const x = this.x;
      const y = this.y;
      const new_fruit = Fruit({...(fruitType[this.next])}.$safe({x, y}));
      const new_fruits = scene.fruits.filter((f) => f.id != this.id && f.id != other.id);
      new_fruits.push(new_fruit)
      new_fruit.addChildTo(scene);
      other.remove();
      this.remove();
      scene.fruits = new_fruits;
      return;
    }
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const r1 = this.radius;
    const r2 = other.radius;
    const ddy = Math.sqrt((r1 + r2) * (r1 + r2) - dx * dx) - Math.abs(dy);
    if(this.bottom !== other.bottom){
      if(other.y > this.y){
        this.y -= ddy;
      }else{
        other.y -= ddy;
      }
    }
    const changeVThis = fruits.length < 3 || !fruits.some((i) => {
      if(i.id == this.id || i.id == other.id) return false;
      return Collision.testCircleCircle(this, i) && this.left > 0 && this.right < SCREEN_WIDTH;
    });
    const changeVOther = fruits.length < 3 || !fruits.some((i) => {
      if(i.id == this.id || i.id == other.id) return false;
      return Collision.testCircleCircle(other, i) && other.left > 0 && other.right < SCREEN_WIDTH;
    });
    if(changeVThis){
      const tvx = this.v() * dx / (r1 + r2);
      const tvy = this.v() * dy / (r1 + r2);
      this.vx = tvx * Ex;
      this.vy = tvy * Ey;
      if(this.v() < Eps){
        this.vx = 0;
        this.vy = 0;
      }
    }else{
      this.vx = 0;
      this.vy = 0;
    }
    if(changeVOther){
      const ovx = other.v() * dx / (r1 + r2);
      const ovy = other.v() * dy / (r1 + r2);
      other.vx = -1 * ovx * Ex;
      other.vy = -1 * ovy * Ey;
      if(other.v() < Eps){
        other.vx = 0;
        other.vy = 0;
      }
    }else{
      other.vx = 0;
      other.vy = 0;
    }
  }
});


phina.define("MainScene", {
  superClass: 'DisplayScene',

  init: function() {
    this.superInit();
    this.fruits = [];
    this.backgroundColor = '#f5deb3';
    this.setNextFruit();
    this.end = false;
    this.score = 0;
    this.scoreLabel = Label({ text: '0' });
    this.scoreLabel.addChildTo(this);
    this.scoreLabel.setPosition(SCREEN_WIDTH - 100, 30);
  },

  setNextFruit: function() {
    let id = Random.randint(0, 4);
    if(Random.randint(1, 20) == 1) id = fruitType.length - 1;
    this.nextFruit = Fruit({...(fruitType[id])}.$safe({top: 0}));
    this.nextFruit.addChildTo(this);
  },

  addFruit: function(x) {
    this.nextFruit.x = x;
    this.fruits.push(this.nextFruit);
    this.nextFruit = null;
  },

  isEnd: function() {
    return this.fruits.some((f) => f.top < 0);
  },

  setEnd: function() {
    this.end = true;
    const label = Label({
      text: `Finish!!\nscore: ${this.score}`,
      backgroundColor: 'white',
    });
    label.addChildTo(this);
    label.setPosition(this.gridX.center(), this.gridY.center());
  },
  
  update: function(app) {
    if(this.end) return;
    if(this.isEnd()) this.setEnd();
    this.scoreLabel.text = this.score;
    let p = app.pointer;
    if(this.nextFruit) {
      this.nextFruit.x = p.x;
      if(p.getPointingEnd()){ 
        this.addFruit(p.x);
        setTimeout(()=>{ this.setNextFruit() }, 1000);
      }
    }
  	this.fruits.forEach((f, i) => {
      f.updateV(0, G);
  	  f.move();
  	  this.fruits.slice(i).forEach((f2) => {
  	  	if(f.id !== f2.id){ f.checkHit(f2, this); }
  	  });
  	});
  },
});

phina.main(function() {
  var app = GameApp({
    startLabel: 'main',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    assets: assets,
  });

  //app.enableStats();

  app.run();
});
