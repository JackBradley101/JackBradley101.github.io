(function () {
  'use strict';

  var BOID_COUNT = 30;
  var MAX_SPEED = 4.5;
  var MIN_SPEED = 2.5;
  var PERCEPTION = 80;
  var SEPARATION_DIST = 30;
  var OBSTACLE_PADDING = 60;
  var LILY_PADDING = 50;
  var TRAIL_LEN = 45;

  var KELVIN_HALF_ANGLE = Math.asin(1 / 3);
  var KELVIN_TAN = Math.tan(KELVIN_HALF_ANGLE);

  var DUCK_LEN = 35;
  var DUCK_WID = 14;

  var W_SEP = 1.8;
  var W_ALI = 1.0;
  var W_COH = 0.8;
  var W_OBS = 2.5;

  var NOISE_SCALE = 14;

  var canvas = document.getElementById('boids-canvas');
  var ctx = canvas.getContext('2d');
  var obstacleEl = document.getElementById('boids-obstacle');

  var W, H, dpr;
  var obstacleRect = { x: 0, y: 0, w: 0, h: 0 };
  var boids = [];
  var frameCount = 0;

  // ==================== BREAD ====================

  var bread = null; // { x, y, spawnFrame, fed: Set of boid indices }
  var BREAD_ATTRACT = 6.0;
  var BREAD_ARRIVE_R = 25;
  var BREAD_TIMEOUT = 600; // frames (~10s at 60fps)

  canvas.addEventListener('click', function (e) {
    var rect = canvas.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;

    // Don't place bread on obstacle or lily pads
    var r = obstacleRect;
    if (r.w > 0 && mx > r.x && mx < r.x + r.w && my > r.y && my < r.y + r.h) return;
    for (var i = 0; i < lilies.length; i++) {
      var l = lilies[i];
      var dx = mx - l.x, dy = my - l.y;
      if (dx * dx + dy * dy < (l.r + 5) * (l.r + 5)) return;
    }

    bread = { x: mx, y: my, spawnFrame: frameCount, fed: {} };
  });

  function drawBread() {
    if (!bread) return;
    var age = frameCount - bread.spawnFrame;
    var fadeProg = Math.min(age / BREAD_TIMEOUT, 1);

    // Count how many ducks have been fed and if any are still lingering
    var fedCount = 0;
    for (var k in bread.fed) fedCount++;
    var anyLingering = false;
    for (var bi = 0; bi < boids.length; bi++) {
      if (boids[bi].lingerTimer > 0) { anyLingering = true; break; }
    }
    // Bread disappears when timed out AND no ducks are still eating
    if ((fedCount >= boids.length || age >= BREAD_TIMEOUT) && !anyLingering) {
      bread = null;
      return;
    }

    // Bread crumb pieces (5-7 small tan chunks)
    var crumbAlpha = 1 - fadeProg * 0.5;
    for (var c = 0; c < 6; c++) {
      var seed = c * 37 + 11;
      var cx = bread.x + (prand(seed) - 0.5) * 12;
      var cy = bread.y + (prand(seed + 7) - 0.5) * 10;
      var cr = 1.5 + prand(seed + 3) * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(210,180,120,' + (crumbAlpha * 0.85).toFixed(2) + ')';
      ctx.fill();
    }

    // Expanding ripple rings from impact
    for (var ring = 0; ring < 3; ring++) {
      var rippleAge = age - ring * 12;
      if (rippleAge < 0) continue;
      var rippleProg = Math.min(rippleAge / 90, 1);
      var rippleR = 8 + rippleProg * 40;
      var rippleAlpha = 0.3 * (1 - rippleProg) * crumbAlpha;
      if (rippleAlpha < 0.01) continue;
      ctx.beginPath();
      ctx.arc(bread.x, bread.y, rippleR, 0, Math.PI * 2);
      ctx.globalAlpha = rippleAlpha;
      ctx.strokeStyle = '#A8DCD8';
      ctx.lineWidth = 1.2 - rippleProg * 0.6;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  var noiseCanvas = document.createElement('canvas');
  var noiseCtx = noiseCanvas.getContext('2d');
  var noiseData = null;
  var noiseW = 0, noiseH = 0;

  function prand(s) {
    var x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    updateObstacleRect();
    noiseW = Math.ceil(W / NOISE_SCALE);
    noiseH = Math.ceil(H / NOISE_SCALE);
    noiseCanvas.width = noiseW;
    noiseCanvas.height = noiseH;
    noiseData = noiseCtx.createImageData(noiseW, noiseH);
  }

  function updateObstacleRect() {
    if (!obstacleEl) return;
    var cr = obstacleEl.getBoundingClientRect();
    var cc = canvas.getBoundingClientRect();
    obstacleRect = {
      x: cr.left - cc.left,
      y: cr.top - cc.top,
      w: cr.width,
      h: cr.height
    };
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resize();
      initLilies();
      for (var i = 0; i < boids.length; i++) {
        teleportIfInside(boids[i]);
      }
    }, 100);
  });

  // ==================== WATER ====================

  function drawWater() {
    if (!noiseData) return;
    var d = noiseData.data;
    var t = frameCount * 0.006;

    for (var y = 0; y < noiseH; y++) {
      for (var x = 0; x < noiseW; x++) {
        var wx = x * NOISE_SCALE;
        var wy = y * NOISE_SCALE;
        var v = 0;
        v += Math.sin(wx * 0.018 + wy * 0.012 + t) * 0.30;
        v += Math.sin(wx * 0.031 - wy * 0.022 + t * 0.7 + 1.7) * 0.25;
        v += Math.sin(wx * 0.009 + wy * 0.038 + t * 0.5 + 3.1) * 0.25;
        v += Math.sin((wx - wy) * 0.024 + t * 1.1 + 0.5) * 0.15;
        v = v * 0.45 + 0.04;
        var idx = (y * noiseW + x) * 4;
        if (v >= 0) {
          d[idx]     = 126 + v * 28;
          d[idx + 1] = 200 + v * 12;
          d[idx + 2] = 200 + v * 12;
        } else {
          d[idx]     = 126 + v * 19;
          d[idx + 1] = 200 + v * 19;
          d[idx + 2] = 200 + v * 27;
        }
        d[idx + 3] = 255;
      }
    }
    noiseCtx.putImageData(noiseData, 0, 0);
    ctx.drawImage(noiseCanvas, 0, 0, noiseW, noiseH, 0, 0, W, H);
  }

  // ==================== BOID ====================

  var DUCK_BODY_R = DUCK_LEN * 0.38;

  function Boid(x, y) {
    this.x = x;
    this.y = y;
    var angle = Math.random() * Math.PI * 2;
    var speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.trail = [];
    this.bobPhase = Math.random() * Math.PI * 2;
    this.bobSpeed = 0.035 + Math.random() * 0.035;
    this.scale = 0.85 + Math.random() * 0.3;
    this.headBob = Math.random() * Math.PI * 2;
    // Bread personality: how eager this duck is, and reaction delay
    this.breadInterest = 0.5 + Math.random() * 0.5;
    this.breadDelay = Math.floor(Math.random() * 60); // 0-1s before noticing
    this.lingerTimer = 0; // frames to mill around after eating
  }

  function teleportIfInside(b) {
    var r = obstacleRect;
    var pad = 10;
    if (b.x > r.x - pad && b.x < r.x + r.w + pad &&
        b.y > r.y - pad && b.y < r.y + r.h + pad) {
      if (Math.random() < 0.5) {
        b.x = Math.random() < 0.5 ? r.x - OBSTACLE_PADDING : r.x + r.w + OBSTACLE_PADDING;
        b.y = r.y + Math.random() * r.h;
      } else {
        b.y = Math.random() < 0.5 ? r.y - OBSTACLE_PADDING : r.y + r.h + OBSTACLE_PADDING;
        b.x = r.x + Math.random() * r.w;
      }
    }
  }

  var SPAWN_BATCH = 5;
  var SPAWN_INTERVAL = 8; // frames between batches

  function spawnBatch() {
    var toAdd = Math.min(SPAWN_BATCH, BOID_COUNT - boids.length);
    for (var i = 0; i < toAdd; i++) {
      // Spawn from edges so they swim in naturally
      var edge = Math.floor(Math.random() * 4);
      var x, y;
      if (edge === 0) { x = -10; y = Math.random() * H; }
      else if (edge === 1) { x = W + 10; y = Math.random() * H; }
      else if (edge === 2) { x = Math.random() * W; y = -10; }
      else { x = Math.random() * W; y = H + 10; }
      var b = new Boid(x, y);
      // Aim inward
      var ang = Math.atan2(H / 2 - b.y, W / 2 - b.x) + (Math.random() - 0.5) * 1.2;
      var spd = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
      b.vx = Math.cos(ang) * spd;
      b.vy = Math.sin(ang) * spd;
      boids.push(b);
    }
  }

  function initBoids() {
    boids = [];
    spawnBatch(); // first 5 immediately
  }

  // ==================== FORCES ====================

  function update() {
    var n = boids.length;
    for (var i = 0; i < n; i++) {
      var b = boids[i];
      var sepX = 0, sepY = 0;
      var aliX = 0, aliY = 0;
      var cohX = 0, cohY = 0;
      var neighbors = 0;

      for (var j = 0; j < n; j++) {
        if (i === j) continue;
        var o = boids[j];
        var dx = o.x - b.x;
        var dy = o.y - b.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < PERCEPTION && dist > 0) {
          neighbors++;
          aliX += o.vx;
          aliY += o.vy;
          cohX += o.x;
          cohY += o.y;
          if (dist < SEPARATION_DIST) {
            // Stronger separation at close range — ramps up hard when bodies nearly touch
            var bodyDist = DUCK_BODY_R * (b.scale + o.scale);
            var sepForce = dist < bodyDist
              ? 3.0 / (dist / bodyDist) // very strong push when overlapping
              : 1.0;
            sepX -= (dx / dist) * sepForce;
            sepY -= (dy / dist) * sepForce;
          }
        }
      }

      var ax = 0, ay = 0;
      if (neighbors > 0) {
        ax += sepX * W_SEP;
        ay += sepY * W_SEP;
        aliX /= neighbors;
        aliY /= neighbors;
        ax += (aliX - b.vx) * W_ALI;
        ay += (aliY - b.vy) * W_ALI;
        cohX = cohX / neighbors - b.x;
        cohY = cohY / neighbors - b.y;
        ax += cohX * 0.01 * W_COH;
        ay += cohY * 0.01 * W_COH;
      }

      var r = obstacleRect;
      var padR = { x: r.x - OBSTACLE_PADDING, y: r.y - OBSTACLE_PADDING,
                   w: r.w + OBSTACLE_PADDING * 2, h: r.h + OBSTACLE_PADDING * 2 };
      if (b.x > padR.x && b.x < padR.x + padR.w &&
          b.y > padR.y && b.y < padR.y + padR.h) {
        var cx = r.x + r.w / 2;
        var cy = r.y + r.h / 2;
        var odx = b.x - cx;
        var ody = b.y - cy;
        var odist = Math.sqrt(odx * odx + ody * ody);
        if (odist > 0) {
          var strength = W_OBS * (1 - odist / (Math.max(r.w, r.h) / 2 + OBSTACLE_PADDING));
          if (strength > 0) {
            ax += (odx / odist) * strength * 3;
            ay += (ody / odist) * strength * 3;
          }
        }
      }

      for (var li = 0; li < lilies.length; li++) {
        var lily = lilies[li];
        var ldx = b.x - lily.x;
        var ldy = b.y - lily.y;
        var ld2 = ldx * ldx + ldy * ldy;
        var avoidR = lily.r + LILY_PADDING;
        if (ld2 < avoidR * avoidR && ld2 > 0.01) {
          var ldist = Math.sqrt(ld2);
          var touchR = lily.r + DUCK_BODY_R * b.scale;
          var lstrength = ldist < touchR
            ? 12.0 / (ldist / touchR) // very strong when nearly touching
            : 8.0 * (1 - ldist / avoidR);
          ax += (ldx / ldist) * lstrength;
          ay += (ldy / ldist) * lstrength;
        }
      }

      // Bread behavior — natural duck pond dynamics
      var wantMinSpeed = MIN_SPEED;
      if (bread) {
        var bdx = bread.x - b.x;
        var bdy = bread.y - b.y;
        var bdist = Math.sqrt(bdx * bdx + bdy * bdy);

        if (b.lingerTimer > 0) {
          // Lingering after eating — mill around slowly near bread
          b.lingerTimer--;
          wantMinSpeed = 0.6;
          // Gentle circling around bread spot
          var circleAngle = Math.atan2(bdy, bdx) + Math.PI / 2;
          ax += Math.cos(circleAngle) * 1.5;
          ay += Math.sin(circleAngle) * 1.5;
          // Weak pull to stay near bread
          if (bdist > 60) {
            ax += (bdx / bdist) * 1.0;
            ay += (bdy / bdist) * 1.0;
          }
        } else if (!bread.fed[i]) {
          var breadAge = frameCount - bread.spawnFrame;
          if (bdist < BREAD_ARRIVE_R) {
            // Arrived — mark as fed, start lingering
            bread.fed[i] = true;
            b.lingerTimer = 60 + Math.floor(Math.random() * 120); // 1-3 seconds
          } else if (breadAge > b.breadDelay) {
            // Duck has noticed the bread — swim toward it
            var pull = BREAD_ATTRACT * b.breadInterest;
            ax += (bdx / bdist) * pull;
            ay += (bdy / bdist) * pull;
            // Slow down as approaching (don't slam into the bread)
            if (bdist < 50) {
              wantMinSpeed = 0.8;
              var approachDamp = bdist / 50;
              b.vx *= 0.92 + approachDamp * 0.08;
              b.vy *= 0.92 + approachDamp * 0.08;
            }
          }
        }
      } else {
        // No bread — clear any linger state
        if (b.lingerTimer > 0) b.lingerTimer = 0;
      }

      b.vx += ax * 0.1;
      b.vy += ay * 0.1;

      var speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (speed > MAX_SPEED) {
        b.vx = (b.vx / speed) * MAX_SPEED;
        b.vy = (b.vy / speed) * MAX_SPEED;
      } else if (speed < wantMinSpeed) {
        b.vx = (b.vx / (speed || 0.01)) * wantMinSpeed;
        b.vy = (b.vy / (speed || 0.01)) * wantMinSpeed;
      }

      b.x += b.vx;
      b.y += b.vy;

      if (frameCount % 2 === 0) {
        var sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        b.trail.push({ x: b.x, y: b.y, angle: Math.atan2(b.vy, b.vx), speed: sp });
        if (b.trail.length > TRAIL_LEN) b.trail.shift();
      }

      if (b.x < -20) { b.x = W + 20; b.trail = []; }
      if (b.x > W + 20) { b.x = -20; b.trail = []; }
      if (b.y < -20) { b.y = H + 20; b.trail = []; }
      if (b.y > H + 20) { b.y = -20; b.trail = []; }
    }
  }

  // ==================== LILY PADS ====================

  var lilies = [];
  var LILY_EDGE_PAD = 50;
  var MOBILE_AREA = 180000;

  function initLilies() {
    lilies = [];
    var lilyCount = Math.round(12 * Math.sqrt(W * H / MOBILE_AREA));
    lilyCount = Math.max(8, Math.min(30, lilyCount));
    var LILY_SEP = 10;

    for (var i = 0; i < lilyCount; i++) {
      for (var attempt = 0; attempt < 80; attempt++) {
        var x = LILY_EDGE_PAD + Math.random() * Math.max(1, W - LILY_EDGE_PAD * 2);
        var y = LILY_EDGE_PAD + Math.random() * Math.max(1, H - LILY_EDGE_PAD * 2);
        var r = 8 + Math.random() * 14;

        var or = obstacleRect;
        var obsPad = 25;
        if (or.w > 0 && or.h > 0 &&
            x > or.x - r - obsPad && x < or.x + or.w + r + obsPad &&
            y > or.y - r - obsPad && y < or.y + or.h + r + obsPad) {
          continue;
        }

        var ok = true;
        for (var j = 0; j < lilies.length; j++) {
          var o = lilies[j];
          var dx = x - o.x;
          var dy = y - o.y;
          if (Math.sqrt(dx * dx + dy * dy) < r + o.r + LILY_SEP) {
            ok = false;
            break;
          }
        }
        if (!ok) continue;

        lilies.push({
          x: x, y: y, r: r,
          rot: Math.random() * Math.PI * 2,
          shade: Math.random() < 0.5 ? '#3a8a4a' : '#2d7a3e',
          hasFlower: Math.random() < 0.25,
          wakeStrength: 0,
          wakeAngle: 0,
        });
        break;
      }
    }
  }

  // Pre-compute which lilies are being hit by any duck's wake
  function updateLilyWake() {
    for (var li = 0; li < lilies.length; li++) {
      lilies[li].wakeStrength = 0;
    }

    var detectR2Cache = [];
    for (var li = 0; li < lilies.length; li++) {
      var dr = lilies[li].r + 25;
      detectR2Cache[li] = dr * dr;
    }

    for (var bi = 0; bi < boids.length; bi++) {
      var trail = boids[bi].trail;
      var tlen = trail.length;
      if (tlen < 3) continue;

      // Check every 3rd trail point for speed
      for (var ti = tlen - 1; ti >= 0; ti -= 3) {
        var t = trail[ti];
        var trailFade = (ti + 1) / tlen;

        for (var li = 0; li < lilies.length; li++) {
          var l = lilies[li];
          var dx = t.x - l.x;
          var dy = t.y - l.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < detectR2Cache[li] && trailFade > l.wakeStrength) {
            l.wakeStrength = trailFade;
            l.wakeAngle = Math.atan2(dy, dx);
          }
        }
      }
    }
  }

  function drawLilies() {
    for (var i = 0; i < lilies.length; i++) {
      var l = lilies[i];

      // Shadow
      ctx.beginPath();
      ctx.arc(l.x + 1, l.y + 1, l.r + 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(40,90,85,0.12)';
      ctx.fill();

      ctx.save();
      ctx.translate(l.x, l.y);

      // Wake interaction: animated ripple rings expanding from pad
      if (l.wakeStrength > 0.1) {
        var ws = l.wakeStrength;

        // 3 expanding concentric ripple rings (looping animation)
        for (var ring = 0; ring < 3; ring++) {
          var phase = ((frameCount * 0.06 + i * 2.1 + ring * 2.8) % 1);
          var ringR = l.r + 3 + phase * 20;
          var ringAlpha = ws * 0.22 * (1 - phase);
          if (ringAlpha < 0.01) continue;

          ctx.beginPath();
          ctx.arc(0, 0, ringR, 0, Math.PI * 2);
          ctx.globalAlpha = ringAlpha;
          ctx.strokeStyle = '#A8DCD8';
          ctx.lineWidth = 1.0 - phase * 0.5;
          ctx.stroke();
        }

        // Bright disturbance glow on the wake-facing edge
        ctx.beginPath();
        ctx.arc(0, 0, l.r + 2, l.wakeAngle - l.rot - 1.0, l.wakeAngle - l.rot + 1.0);
        ctx.globalAlpha = ws * 0.3;
        ctx.strokeStyle = '#B8E8E4';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Small choppy marks at the contact edge
        for (var m = 0; m < 5; m++) {
          var seed = i * 17 + m * 7 + Math.floor(frameCount / 5) * 11;
          var ma = l.wakeAngle - l.rot + (prand(seed) - 0.5) * 1.8;
          var mr = l.r + 1 + prand(seed + 31) * 4;
          var mx = Math.cos(ma) * mr;
          var my = Math.sin(ma) * mr;
          var mdir = ma + Math.PI / 2 + (prand(seed + 71) - 0.5);
          var mlen = 1 + prand(seed + 13) * 2;

          ctx.beginPath();
          ctx.moveTo(mx - Math.cos(mdir) * mlen, my - Math.sin(mdir) * mlen);
          ctx.lineTo(mx + Math.cos(mdir) * mlen, my + Math.sin(mdir) * mlen);
          ctx.globalAlpha = ws * 0.25;
          ctx.strokeStyle = '#5EA8A3';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // Pad body
      ctx.rotate(l.rot);
      ctx.beginPath();
      ctx.arc(0, 0, l.r, 0.15, Math.PI * 2 - 0.15);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fillStyle = l.shade;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(0, 0, l.r, 0.15, Math.PI * 2 - 0.15);
      ctx.strokeStyle = 'rgba(80,160,90,0.3)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      ctx.strokeStyle = 'rgba(30,80,40,0.4)';
      ctx.lineWidth = 0.5;
      for (var v = 0; v < 5; v++) {
        var va = (v / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(va) * l.r * 0.8, Math.sin(va) * l.r * 0.8);
        ctx.stroke();
      }

      if (l.hasFlower) {
        var fr = l.r * 0.3;
        ctx.fillStyle = '#f0e0f0';
        for (var p = 0; p < 5; p++) {
          var pa = (p / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(Math.cos(pa) * fr, Math.sin(pa) * fr, fr * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#e8d44d';
        ctx.beginPath();
        ctx.arc(0, 0, fr * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  // ==================== MALLARD DUCK ====================

  function drawDuck(b) {
    var angle = Math.atan2(b.vy, b.vx);
    var sc = b.scale;
    var bobT = frameCount * b.bobSpeed + b.bobPhase;
    var sway = Math.sin(bobT) * 1.0;
    var swayX = -Math.sin(angle) * sway;
    var swayY = Math.cos(angle) * sway;
    var headBob = Math.sin(bobT * 1.3 + b.headBob) * 1.2;
    var dx = b.x + swayX;
    var dy = b.y + swayY;

    ctx.save();
    ctx.translate(dx, dy);
    ctx.rotate(angle + Math.PI / 2);
    ctx.scale(sc, sc);

    // Shadow
    ctx.beginPath();
    ctx.ellipse(0, 2, DUCK_WID / 2 + 3, DUCK_LEN / 2 + 1, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(30,75,70,0.13)';
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.moveTo(0, -DUCK_LEN / 2 + 4);
    ctx.bezierCurveTo(DUCK_WID / 2, -DUCK_LEN * 0.12, DUCK_WID / 2, DUCK_LEN * 0.28, 0, DUCK_LEN / 2);
    ctx.bezierCurveTo(-DUCK_WID / 2, DUCK_LEN * 0.28, -DUCK_WID / 2, -DUCK_LEN * 0.12, 0, -DUCK_LEN / 2 + 4);
    ctx.closePath();
    ctx.fillStyle = '#4A3728';
    ctx.fill();

    // Wing edges
    ctx.beginPath();
    ctx.ellipse(DUCK_WID / 2 - 1.5, 3, 1.8, DUCK_LEN * 0.28, 0.15, 0, Math.PI * 2);
    ctx.fillStyle = '#5A4530';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-DUCK_WID / 2 + 1.5, 3, 1.8, DUCK_LEN * 0.28, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Tail
    ctx.beginPath();
    ctx.moveTo(-2, DUCK_LEN / 2 - 4);
    ctx.lineTo(0, DUCK_LEN / 2 + 3);
    ctx.lineTo(2, DUCK_LEN / 2 - 4);
    ctx.closePath();
    ctx.fillStyle = '#3D2B1F';
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.ellipse(0, -DUCK_LEN / 2 + 9 + headBob * 0.3, 5.5, 6.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#1B4D3E';
    ctx.fill();

    // Neck ring
    ctx.beginPath();
    ctx.ellipse(0, -DUCK_LEN / 2 + 14 + headBob * 0.15, 5.8, 1.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#E0E0D8';
    ctx.fill();

    // Bill
    ctx.beginPath();
    ctx.ellipse(0, -DUCK_LEN / 2 + 2 + headBob * 0.4, 3.2, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#C8A030';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -DUCK_LEN / 2 - 1.5 + headBob * 0.4, 2.2, 1.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#A08028';
    ctx.fill();

    ctx.restore();
  }

  // ==================== WAKE ====================

  function buildWakePoints(b) {
    var trail = b.trail;
    if (trail.length < 3) return null;
    var wakePoints = [];
    var cumDist = 0;
    for (var i = trail.length - 1; i >= 0; i--) {
      var t = trail[i];
      if (i < trail.length - 1) {
        var prev = trail[i + 1];
        var ddx = t.x - prev.x;
        var ddy = t.y - prev.y;
        cumDist += Math.sqrt(ddx * ddx + ddy * ddy);
      }
      var hx = 0, hy = 0;
      if (i > 0 && i < trail.length - 1) {
        hx = trail[i + 1].x - trail[i - 1].x;
        hy = trail[i + 1].y - trail[i - 1].y;
      } else if (i > 0) {
        hx = t.x - trail[i - 1].x;
        hy = t.y - trail[i - 1].y;
      } else if (i < trail.length - 1) {
        hx = trail[i + 1].x - t.x;
        hy = trail[i + 1].y - t.y;
      }
      var hlen = Math.sqrt(hx * hx + hy * hy);
      if (hlen > 0) { hx /= hlen; hy /= hlen; }
      wakePoints.push({
        x: t.x, y: t.y, dist: cumDist,
        perpX: -hy, perpY: hx,
        perpOffset: cumDist * KELVIN_TAN,
        hx: hx, hy: hy
      });
    }
    if (wakePoints.length < 2) return null;
    var maxDist = wakePoints[wakePoints.length - 1].dist;
    if (maxDist < 1) return null;
    return { pts: wakePoints, maxDist: maxDist };
  }

  function drawWake(b) {
    var data = buildWakePoints(b);
    if (!data) return;
    var pts = data.pts;
    var maxDist = data.maxDist;
    var sc = b.scale;
    var bobOsc = Math.sin(frameCount * b.bobSpeed + b.bobPhase);

    // --- Layer 1: Fading spread inside the V ---
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var k = 1; k < pts.length; k++) {
      var wp = pts[k];
      ctx.lineTo(wp.x + wp.perpX * wp.perpOffset, wp.y + wp.perpY * wp.perpOffset);
    }
    for (var k = pts.length - 1; k >= 0; k--) {
      var wp = pts[k];
      ctx.lineTo(wp.x - wp.perpX * wp.perpOffset, wp.y - wp.perpY * wp.perpOffset);
    }
    ctx.closePath();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#90D0CC';
    ctx.fill();
    ctx.globalAlpha = 1;

    // --- Layer 2: V-arm ridges (5 batches per side, single pass) ---
    var BATCH_COUNT = 5;
    var batchSize = Math.max(1, Math.floor(pts.length / BATCH_COUNT));
    for (var side = -1; side <= 1; side += 2) {
      for (var seg = 0; seg < BATCH_COUNT; seg++) {
        var startK = seg * batchSize;
        var endK = Math.min((seg + 1) * batchSize + 1, pts.length);
        if (startK >= pts.length) break;
        var midK = Math.min(Math.floor((startK + endK) / 2), pts.length - 1);
        var fade = 1 - pts[midK].dist / maxDist;
        if (fade < 0.03) continue;

        ctx.beginPath();
        for (var k = startK; k < endK; k++) {
          var wp = pts[k];
          var px = wp.x + wp.perpX * wp.perpOffset * side;
          var py = wp.y + wp.perpY * wp.perpOffset * side;
          if (k === startK) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        // Combined glow + ridge in one pass with medium width
        ctx.globalAlpha = 0.18 * fade;
        ctx.strokeStyle = '#A8DCD8';
        ctx.lineWidth = 1.5 + (1 - fade) * 1.5;
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // --- Layer 3: Feathered ripples (sparser for perf) ---
    var rippleSpacing = 12;
    for (var side = -1; side <= 1; side += 2) {
      var nextRipple = rippleSpacing;
      for (var k = 1; k < pts.length; k++) {
        var wp = pts[k];
        if (wp.dist < nextRipple) continue;
        var fade = 1 - wp.dist / maxDist;
        if (fade < 0.05) { nextRipple += rippleSpacing; continue; }
        var armX = wp.x + wp.perpX * wp.perpOffset * side;
        var armY = wp.y + wp.perpY * wp.perpOffset * side;
        var outX = wp.perpX * side;
        var outY = wp.perpY * side;
        var rippleLen = 2 + fade * 4;
        var endX = armX + outX * rippleLen;
        var endY = armY + outY * rippleLen;
        var cpx = (armX + endX) / 2 - wp.hx * rippleLen * 0.7;
        var cpy = (armY + endY) / 2 - wp.hy * rippleLen * 0.7;

        ctx.beginPath();
        ctx.moveTo(armX, armY);
        ctx.quadraticCurveTo(cpx, cpy, endX, endY);
        ctx.globalAlpha = 0.10 * fade;
        ctx.strokeStyle = '#B0DAD6';
        ctx.lineWidth = 0.6;
        ctx.stroke();
        nextRipple += rippleSpacing;
      }
    }
    ctx.globalAlpha = 1;

    // --- Layer 4: Turbulent zone ---
    var turbLen = DUCK_LEN * sc * 2.5;
    ctx.beginPath();
    var turbStarted = false;
    for (var k = 0; k < pts.length; k++) {
      var wp = pts[k];
      if (wp.dist > turbLen) break;
      var localFade = 1 - wp.dist / turbLen;
      var osc = bobOsc * 0.9 * localFade;
      var ox = wp.x + wp.perpX * osc;
      var oy = wp.y + wp.perpY * osc;
      if (!turbStarted) { ctx.moveTo(ox, oy); turbStarted = true; }
      else ctx.lineTo(ox, oy);
    }
    if (turbStarted) {
      ctx.globalAlpha = 0.20;
      ctx.strokeStyle = '#5EA8A3';
      ctx.lineWidth = DUCK_WID * sc * 0.75;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.lineCap = 'butt';
    }
    ctx.globalAlpha = 1;

    // --- Layer 5: Stern disturbance ---
    var heading = Math.atan2(b.vy, b.vx);
    var speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(heading);
    var sternR = DUCK_WID * sc * 0.5;
    var sternX = -DUCK_LEN * sc / 2 + 1;
    ctx.beginPath();
    ctx.arc(sternX, 0, sternR, Math.PI - 1.2, Math.PI + 1.2);
    ctx.globalAlpha = 0.18 + speed / MAX_SPEED * 0.12;
    ctx.strokeStyle = '#A0D4D0';
    ctx.lineWidth = 1.0 + speed / MAX_SPEED * 0.5;
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // ==================== ANIMATION LOOP ====================

  function frame() {
    frameCount++;
    // Stagger duck spawning — add a batch every few frames until full
    if (boids.length < BOID_COUNT && frameCount % SPAWN_INTERVAL === 0) {
      spawnBatch();
    }
    drawWater();
    updateLilyWake();
    drawLilies();
    drawBread();
    update();

    // Single clip region for ALL wakes — lily pads block ripples
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    for (var li = 0; li < lilies.length; li++) {
      var l = lilies[li];
      ctx.moveTo(l.x + l.r + 4, l.y);
      ctx.arc(l.x, l.y, l.r + 4, 0, Math.PI * 2);
    }
    ctx.clip('evenodd');

    for (var i = 0; i < boids.length; i++) {
      drawWake(boids[i]);
    }
    ctx.restore();

    for (var i = 0; i < boids.length; i++) {
      drawDuck(boids[i]);
    }
    requestAnimationFrame(frame);
  }

  // ==================== INIT ====================

  resize();
  initLilies();
  initBoids();
  requestAnimationFrame(frame);

})();
