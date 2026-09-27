import React, { useRef, useEffect, useState } from 'react';

export default function GameArena({ tier, globalLevel, isDemo, onGameComplete, onExit }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // Game HUD states
  const [score, setScore] = useState(0);
  const [crowdSize, setCrowdSize] = useState(1);
  const [health, setHealth] = useState(100);
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [weaponName, setWeaponName] = useState('Pistol');
  
  // Target Kills states
  const [enemiesKilled, setEnemiesKilled] = useState(0);
  const [targetKills, setTargetKills] = useState(30);

  // Titan Boss states
  const [bossActive, setBossActive] = useState(false);
  const [bossHP, setBossHP] = useState(150);
  const [bossMaxHP, setBossMaxHP] = useState(150);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Dynamic canvas resolution mapping
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let animationFrameId;
    let isGameOver = false;

    // --- MATHEMATICAL PERSPECTIVE PROJECTION SYSTEM (DRONE HEIGHT ANGLE) ---
    function project3D(x, y, z) {
      const t = (z - 100) / 500;
      
      // Drone camera: higher horizon (18% from top instead of 42% for top-down perspective)
      const horizonY = canvas.height * 0.18;
      
      // Flatter vertical distribution for steeper view angle
      const Y = horizonY + (canvas.height - horizonY) * Math.pow(1 - t, 1.45);
      
      // Scale decreases less aggressively to keep far objects larger
      const scale = 1.9 * Math.pow(1 - t, 1.25) + 0.32;
      
      const centerX = canvas.width / 2;
      const X = centerX + (x * 0.72) * scale;
      
      // Objects look flatter from above, so vertical height is slightly compressed
      const adjustedY = Y - (y * 0.7) * scale;
      
      return { X, Y: adjustedY, scale };
    }

    // Clouds
    const clouds = [
      { x: 120, y: 50, speed: 0.1, size: 40 },
      { x: 480, y: 30, speed: 0.15, size: 55 },
      { x: 780, y: 60, speed: 0.07, size: 35 },
    ];

    // Player Hero
    const hero = {
      x: 0,
      targetX: 0,
      y: 0,
      z: 130,
      targetZ: 130,
      radius: 9,
      weaponLevel: 1,
      health: 100
    };

    // Calculate level requirements
    const currentTargetKills = tier.isOffline ? (30 + globalLevel * 10) : (40 + globalLevel * 10);

    let cloneSoldiers = [];
    let playerBullets = [];
    let enemyMobs = []; 
    let mathGates = [];
    let obstacles = [];
    let particles = [];
    let scenery = [];
    
    // Helper Gate Pair spawned at the start (z = 320) so the player starts balanced (shifted for wider track)
    if (!isDemo) {
      mathGates.push({
        x: -110,
        width: 170,
        z: 320,
        option: { type: 'CLONE', label: '+6', value: 6, isMultiply: false, isPositive: true }
      });
      mathGates.push({
        x: 110,
        width: 170,
        z: 320,
        option: { type: 'WEAPON', label: '+1 GUN', value: 1, isPositive: true }
      });
    }

    // Titan Boss local variables
    let bossActiveLocal = false;
    let bossHPLocal = 150 + globalLevel * 30;
    let bossMaxHPLocal = 150 + globalLevel * 30;
    let bossX = 0;
    let bossZ = 600;
    let bossVz = -0.35;

    // Stats tracking
    let localScore = 0;
    let localHealth = 100;
    let localTimeRemaining = 60;
    let localWeaponLevel = 1;
    let enemiesKilledCount = 0;
    let maxCrowdSizeCount = 1;
    let lastTimeTick = 0;

    // Firing speeds
    let lastFired = 0;
    const fireIntervals = [240, 300, 160, 80];

    // Spawners timers
    let enemySpawnTimer = 0;
    let gateSpawnTimer = 0;
    let obstacleSpawnTimer = 0;
    let scenerySpawnTimer = 0;
    
    // Difficulty settings
    const enemySpawnSpeed = Math.max(45, 90 - globalLevel * 4);
    const enemyHealthMax = 1 + Math.floor(globalLevel / 4);
    const enemyMovementSpeed = 1.0 + (globalLevel * 0.04);

    let screenShakeIntensity = 0;
    let crowdReducedFlashTimer = 0;

    // Keyboard controls
    const keys = {};
    const handleKeyDown = (e) => {
      keys[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e) => {
      keys[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Swipe/Drag controls
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let heroStartX = 0;
    let heroStartZ = 0;

    const handlePointerDown = (e) => {
      if (isDemo) return;
      isDragging = true;
      dragStartX = e.clientX || (e.touches && e.touches[0].clientX);
      dragStartY = e.clientY || (e.touches && e.touches[0].clientY);
      heroStartX = hero.x;
      heroStartZ = hero.z;
    };

    const handlePointerMove = (e) => {
      if (isDemo) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);

      if (isDragging) {
        const deltaX = clientX - dragStartX;
        const deltaY = clientY - dragStartY;
        hero.targetX = heroStartX + (deltaX / canvas.width) * 450;
        hero.targetZ = heroStartZ - (deltaY / canvas.height) * 180;
      } else {
        const rect = canvas.getBoundingClientRect();
        const relativeX = (clientX - rect.left) / rect.width;
        const relativeY = (clientY - rect.top) / rect.height;
        hero.targetX = (relativeX - 0.5) * 320;
        hero.targetZ = 110 + (1 - relativeY) * 75;
      }
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    window.addEventListener('touchstart', handlePointerDown);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);

    // GATE OPTIONS SPAWNING (Supports time extensions +5s)
    function spawnGate3D() {
      // Clear obstacle spawning to create a gap!
      obstacleSpawnTimer = -150;

      const op1 = generateGateOption();
      const op2 = generateGateOption();

      mathGates.push({
        x: -110,
        width: 170,
        z: 600,
        option: op1
      });

      mathGates.push({
        x: 110,
        width: 170,
        z: 600,
        option: op2
      });
    }

    function generateGateOption() {
      const rand = Math.random();
      if (rand < 0.15) {
        // Random Time Gates (Clock icon +5s)
        return { type: 'TIME', label: '+5s', value: 5, isPositive: true };
      } else if (rand < 0.35) {
        return { type: 'WEAPON', label: '+1 GUN', value: 1, isPositive: true };
      } else if (rand < 0.65) {
        const multiply = Math.random() > 0.5;
        const val = Math.floor(Math.random() * 4) + 2;
        return {
          type: 'CLONE',
          label: multiply ? `x${val}` : `+${val * 3}`,
          value: multiply ? val : val * 3,
          isMultiply: multiply,
          isPositive: true
        };
      } else {
        const divide = Math.random() > 0.5;
        const val = Math.floor(Math.random() * 2) + 2;
        return {
          type: 'CLONE',
          label: divide ? `÷${val}` : `-${val * 4}`,
          value: divide ? val : val * 4,
          isDivide: divide,
          isPositive: false
        };
      }
    }

    // OBSTACLES (Wider concrete walls, positioned in lanes)
    function spawnObstacle3D() {
      // Clear gate spawning to create a gap!
      gateSpawnTimer = -150;

      const lane = Math.floor(Math.random() * 3);
      let xPos = 0;
      if (lane === 0) xPos = -146.6;
      if (lane === 2) xPos = 146.6;

      obstacles.push({
        x: xPos,
        width: 140,
        height: 25,
        depth: 25,
        z: 600,
        speed: 1.1 + (globalLevel * 0.04)
      });
    }

    // SCENERY (Vibrant mix of Trees, Houses, and Buildings, spawned closer to the wider road)
    function spawnScenery3D() {
      const leftRand = Math.random();
      const rightRand = Math.random();

      // Increased spawn probability (rand > 0.15) to make scenery dense
      if (leftRand > 0.15) {
        const type = Math.random() < 0.3 ? 'TREE' : Math.random() < 0.65 ? 'HOUSE' : 'BUILDING';
        scenery.push({
          x: -230 - (Math.random() * 5), // tightly packed right beside the road edge
          y: 0,
          z: 600,
          type: type,
          speed: 1.25
        });
      }
      if (rightRand > 0.15) {
        const type = Math.random() < 0.3 ? 'TREE' : Math.random() < 0.65 ? 'HOUSE' : 'BUILDING';
        scenery.push({
          x: 230 + (Math.random() * 5), // tightly packed right beside the road edge
          y: 0,
          z: 600,
          type: type,
          speed: 1.25
        });
      }
    }

    // PARTICLES
    function spawnExplosion3D(x, y, z, color, count = 8) {
      for (let i = 0; i < count; i++) {
        particles.push({
          x, y, z,
          vx: (Math.random() - 0.5) * 5,
          vy: Math.random() * 4 + 2,
          vz: (Math.random() - 0.5) * 5,
          color,
          alpha: 1,
          decay: Math.random() * 0.04 + 0.03
        });
      }
    }

    // DRAW SOLDIER (Blue safety helmet, tactical vest, runs forward)
    function drawSoldier(ctx, x, y, z, timestamp, animOffset, isHero = false) {
      const proj = project3D(x, y, z);
      if (proj.scale <= 0.1) return;

      ctx.save();
      
      const headRadius = (isHero ? 9 : 7.5) * proj.scale;
      const torsoHeight = (isHero ? 13 : 11) * proj.scale;
      const lineWidth = (isHero ? 4.5 : 3.5) * proj.scale;
      
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Shadow
      const shadowProj = project3D(x, 0, z);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(shadowProj.X, shadowProj.Y, headRadius * 1.8, headRadius * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Run swing
      const runSpeed = 0.024;
      const swing = Math.sin(timestamp * runSpeed + animOffset) * 0.75;

      const headX = proj.X;
      const headY = proj.Y - torsoHeight - headRadius - (lineWidth / 2);
      const neckY = proj.Y - torsoHeight;
      const pelvisY = proj.Y - (torsoHeight * 0.25);

      // Back of Head
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
      ctx.fill();

      // Helmet
      ctx.fillStyle = '#0055ff';
      ctx.beginPath();
      ctx.arc(headX, headY - 2 * proj.scale, headRadius * 1.05, 0, Math.PI * 2);
      ctx.fill();

      // Accent stripe
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2 * proj.scale;
      ctx.beginPath();
      ctx.arc(headX, headY - 2 * proj.scale, headRadius * 0.75, Math.PI * 0.8, Math.PI * 0.2);
      ctx.stroke();
      ctx.lineWidth = lineWidth;

      // Vest
      ctx.strokeStyle = '#334155';
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.roundRect(headX - 6 * proj.scale, neckY, 12 * proj.scale, torsoHeight * 0.8, 3 * proj.scale);
      ctx.fill();
      ctx.stroke();

      // Spine
      ctx.strokeStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(headX, neckY);
      ctx.lineTo(headX, pelvisY);
      ctx.stroke();

      // Legs running forward/back
      ctx.strokeStyle = '#1d4ed8';
      const leftFootProj = project3D(x - 4, 0, z + Math.sin(swing) * 12);
      const rightFootProj = project3D(x + 4, 0, z - Math.sin(swing) * 12);

      ctx.beginPath();
      ctx.moveTo(headX - 3 * proj.scale, pelvisY);
      ctx.lineTo(leftFootProj.X, leftFootProj.Y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(headX + 3 * proj.scale, pelvisY);
      ctx.lineTo(rightFootProj.X, rightFootProj.Y);
      ctx.stroke();

      // Boots
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(leftFootProj.X, leftFootProj.Y, 2.5 * leftFootProj.scale, 0, Math.PI * 2);
      ctx.arc(rightFootProj.X, rightFootProj.Y, 2.5 * rightFootProj.scale, 0, Math.PI * 2);
      ctx.fill();

      // Weapons
      const muzzleX = headX + 16 * proj.scale;
      const muzzleY = neckY + 4 * proj.scale;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4 * proj.scale;
      ctx.beginPath();
      ctx.moveTo(headX - 2 * proj.scale, neckY + 5 * proj.scale);
      ctx.lineTo(muzzleX, muzzleY);
      ctx.stroke();

      ctx.lineWidth = 3 * proj.scale;
      ctx.beginPath();
      ctx.moveTo(headX + 6 * proj.scale, neckY + 5 * proj.scale);
      ctx.lineTo(headX + 5 * proj.scale, neckY + 11 * proj.scale);
      ctx.stroke();

      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3.5 * proj.scale;
      ctx.beginPath();
      ctx.moveTo(headX - 4 * proj.scale, neckY + 2 * proj.scale);
      ctx.lineTo(headX + 3 * proj.scale, neckY + 6 * proj.scale);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(headX, neckY + 2 * proj.scale);
      ctx.lineTo(headX + 10 * proj.scale, neckY + 4 * proj.scale);
      ctx.stroke();

      ctx.restore();
    }

    // DRAW TITAN BOSS (Giant spiked metal plate zombie)
    function drawBoss(ctx, x, y, z, timestamp, health, maxHealth) {
      const proj = project3D(x, y, z);
      if (proj.scale <= 0.1) return;

      ctx.save();
      
      const headRadius = 22 * proj.scale;
      const torsoHeight = 35 * proj.scale;
      const lineWidth = 10 * proj.scale;
      
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';

      // Giant Shadow
      const shadowProj = project3D(x, 0, z);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(shadowProj.X, shadowProj.Y, headRadius * 2.2, headRadius * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();

      const swing = Math.sin(timestamp * 0.008) * 0.4;
      const headX = proj.X;
      const headY = proj.Y - torsoHeight - headRadius - (lineWidth / 2);
      const neckY = proj.Y - torsoHeight;
      const pelvisY = proj.Y - (torsoHeight * 0.25);

      // Head
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
      ctx.fill();

      // Glowing eyes
      ctx.fillStyle = '#ff0000';
      ctx.beginPath();
      ctx.arc(headX - 7 * proj.scale, headY - 3 * proj.scale, 4 * proj.scale, 0, Math.PI * 2);
      ctx.arc(headX + 7 * proj.scale, headY - 3 * proj.scale, 4 * proj.scale, 0, Math.PI * 2);
      ctx.fill();

      // Muscular spiked chestplate
      ctx.fillStyle = '#b91c1c';
      ctx.strokeStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.roundRect(headX - 16 * proj.scale, neckY, 32 * proj.scale, torsoHeight * 0.8, 6 * proj.scale);
      ctx.fill();
      ctx.stroke();

      // Shoulders spikes
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(headX - 16 * proj.scale, neckY);
      ctx.lineTo(headX - 22 * proj.scale, neckY - 10 * proj.scale);
      ctx.lineTo(headX - 10 * proj.scale, neckY);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(headX + 16 * proj.scale, neckY);
      ctx.lineTo(headX + 22 * proj.scale, neckY - 10 * proj.scale);
      ctx.lineTo(headX + 10 * proj.scale, neckY);
      ctx.closePath();
      ctx.fill();

      // Arms
      ctx.strokeStyle = '#166534';
      ctx.lineWidth = 9 * proj.scale;
      
      ctx.beginPath();
      ctx.moveTo(headX - 12 * proj.scale, neckY + 8 * proj.scale);
      ctx.lineTo(headX - 35 * proj.scale, neckY - 5 * proj.scale);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(headX + 12 * proj.scale, neckY + 8 * proj.scale);
      ctx.lineTo(headX + 35 * proj.scale, neckY - 5 * proj.scale);
      ctx.stroke();

      // Legs walking forward
      ctx.strokeStyle = '#111827';
      const leftFootProj = project3D(x - 9, 0, z + Math.sin(swing) * 15);
      const rightFootProj = project3D(x + 9, 0, z - Math.sin(swing) * 15);

      ctx.beginPath();
      ctx.moveTo(headX - 8 * proj.scale, pelvisY);
      ctx.lineTo(leftFootProj.X, leftFootProj.Y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(headX + 8 * proj.scale, pelvisY);
      ctx.lineTo(rightFootProj.X, rightFootProj.Y);
      ctx.stroke();

      ctx.restore();
    }

    // DRAW GREEN ZOMBIE
    function drawZombie(ctx, x, y, z, timestamp, animOffset) {
      const proj = project3D(x, y, z);
      if (proj.scale <= 0.1) return;

      ctx.save();
      
      const headRadius = 7.5 * proj.scale;
      const torsoHeight = 11 * proj.scale;
      const lineWidth = 3.5 * proj.scale;
      
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';

      // Shadow
      const shadowProj = project3D(x, 0, z);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.beginPath();
      ctx.ellipse(shadowProj.X, shadowProj.Y, headRadius * 1.8, headRadius * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Swing
      const walkSpeed = 0.015;
      const swing = Math.sin(timestamp * walkSpeed + animOffset) * 0.5;

      const headX = proj.X;
      const headY = proj.Y - torsoHeight - headRadius - (lineWidth / 2);
      const neckY = proj.Y - torsoHeight;
      const pelvisY = proj.Y - (torsoHeight * 0.25);

      // Green Skin
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(headX, headY, headRadius, 0, Math.PI * 2);
      ctx.fill();

      // Red eyes
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(headX - 2.5 * proj.scale, headY - 1 * proj.scale, 1.5 * proj.scale, 0, Math.PI * 2);
      ctx.arc(headX + 2.5 * proj.scale, headY - 1 * proj.scale, 1.5 * proj.scale, 0, Math.PI * 2);
      ctx.fill();

      // Purple shirt
      ctx.fillStyle = '#7c3aed';
      ctx.beginPath();
      ctx.roundRect(headX - 6 * proj.scale, neckY, 12 * proj.scale, torsoHeight * 0.8, 2 * proj.scale);
      ctx.fill();

      // Arms outstretched forward
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3 * proj.scale;
      ctx.beginPath();
      ctx.moveTo(headX - 5 * proj.scale, neckY + 3 * proj.scale);
      ctx.lineTo(headX + 13 * proj.scale, neckY + 2 * proj.scale + Math.sin(timestamp * 0.01) * 2 * proj.scale);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(headX + 5 * proj.scale, neckY + 3 * proj.scale);
      ctx.lineTo(headX + 13 * proj.scale, neckY + 4 * proj.scale - Math.sin(timestamp * 0.01) * 2 * proj.scale);
      ctx.stroke();

      // Legs walking forward in depth
      ctx.strokeStyle = '#78350f';
      const leftFootProj = project3D(x - 3, 0, z + Math.sin(swing) * 10);
      const rightFootProj = project3D(x + 3, 0, z - Math.sin(swing) * 10);

      ctx.beginPath();
      ctx.moveTo(headX - 2.5 * proj.scale, pelvisY);
      ctx.lineTo(leftFootProj.X, leftFootProj.Y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(headX + 2.5 * proj.scale, pelvisY);
      ctx.lineTo(rightFootProj.X, rightFootProj.Y);
      ctx.stroke();

      ctx.restore();
    }

    // DRAW SCENERY (Trees)
    function drawTree(ctx, x, y, z) {
      const proj = project3D(x, y, z);
      if (proj.scale <= 0.1) return;

      ctx.save();
      
      const shadowProj = project3D(x, 0, z);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(shadowProj.X, shadowProj.Y, 30 * proj.scale, 8 * proj.scale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Trunk
      ctx.fillStyle = '#78350f';
      ctx.fillRect(proj.X - 5 * proj.scale, proj.Y - 45 * proj.scale, 10 * proj.scale, 45 * proj.scale);

      // Leaves
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(proj.X, proj.Y - 45 * proj.scale, 28 * proj.scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(proj.X, proj.Y - 65 * proj.scale, 22 * proj.scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(proj.X, proj.Y - 80 * proj.scale, 15 * proj.scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // DRAW SCENERY (House)
    function drawHouse(ctx, x, y, z) {
      const proj = project3D(x, y, z);
      if (proj.scale <= 0.1) return;

      ctx.save();
      
      // Shadow
      const shadowProj = project3D(x, 0, z);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(shadowProj.X, shadowProj.Y, 35 * proj.scale, 8 * proj.scale, 0, 0, Math.PI * 2);
      ctx.fill();

      // House Body (Light Grey)
      ctx.fillStyle = '#cbd5e1';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2 * proj.scale;
      ctx.beginPath();
      ctx.roundRect(proj.X - 25 * proj.scale, proj.Y - 35 * proj.scale, 50 * proj.scale, 35 * proj.scale, 4 * proj.scale);
      ctx.fill();
      ctx.stroke();

      // Roof (Red Triangle)
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(proj.X - 28 * proj.scale, proj.Y - 35 * proj.scale);
      ctx.lineTo(proj.X, proj.Y - 58 * proj.scale);
      ctx.lineTo(proj.X + 28 * proj.scale, proj.Y - 35 * proj.scale);
      ctx.closePath();
      ctx.fill();

      // Door (Brown)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(proj.X - 6 * proj.scale, proj.Y - 18 * proj.scale, 12 * proj.scale, 18 * proj.scale);

      // Windows (Yellow glowing)
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(proj.X - 18 * proj.scale, proj.Y - 26 * proj.scale, 8 * proj.scale, 8 * proj.scale);
      ctx.fillRect(proj.X + 10 * proj.scale, proj.Y - 26 * proj.scale, 8 * proj.scale, 8 * proj.scale);

      ctx.restore();
    }

    // DRAW SCENERY (Building / Skyscraper)
    function drawBuilding(ctx, x, y, z) {
      const proj = project3D(x, y, z);
      if (proj.scale <= 0.1) return;

      ctx.save();

      // Shadow
      const shadowProj = project3D(x, 0, z);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(shadowProj.X, shadowProj.Y, 30 * proj.scale, 8 * proj.scale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Building Body (Steel Blue)
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2 * proj.scale;
      ctx.beginPath();
      ctx.roundRect(proj.X - 20 * proj.scale, proj.Y - 90 * proj.scale, 40 * proj.scale, 90 * proj.scale, 3 * proj.scale);
      ctx.fill();
      ctx.stroke();

      // Antenna on top
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5 * proj.scale;
      ctx.beginPath();
      ctx.moveTo(proj.X, proj.Y - 90 * proj.scale);
      ctx.lineTo(proj.X, proj.Y - 110 * proj.scale);
      ctx.stroke();

      // Red flashing light on antenna
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(proj.X, proj.Y - 110 * proj.scale, 3 * proj.scale, 0, Math.PI * 2);
      ctx.fill();

      // Grid of yellow window lights
      ctx.fillStyle = '#fef08a';
      const rows = 5;
      const cols = 2;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Off logic to make it look realistic (some lights are off)
          const seed = (Math.floor(x) + r * 7 + c * 3 + Math.floor(z)) % 5;
          if (seed !== 0) {
            const wx = proj.X - 12 * proj.scale + c * 16 * proj.scale;
            const wy = proj.Y - 80 * proj.scale + r * 14 * proj.scale;
            ctx.fillRect(wx, wy, 6 * proj.scale, 6 * proj.scale);
          }
        }
      }

      ctx.restore();
    }

    // DRAW OBSTACLE BARRIER
    function drawObstacle(ctx, x, z, width, height, depth) {
      const leftX = x - width / 2;
      const rightX = x + width / 2;

      const lb = project3D(leftX, 0, z);
      const rb = project3D(rightX, 0, z);
      const lt = project3D(leftX, height, z);
      const rt = project3D(rightX, height, z);

      if (lb.scale <= 0.1) return;

      ctx.save();
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(lb.X, lb.Y);
      ctx.lineTo(lt.X, lt.Y);
      ctx.lineTo(rt.X, rt.Y);
      ctx.lineTo(rb.X, rb.Y);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 5 * lb.scale;
      ctx.beginPath();
      for (let sx = leftX + 10; sx < rightX; sx += 20) {
        const sBottom = project3D(sx, 0, z);
        const sTop = project3D(sx - 10, height, z);
        ctx.moveTo(sBottom.X, sBottom.Y);
        ctx.lineTo(sTop.X, sTop.Y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // DRAW GATES
    function drawGate(ctx, x, z, width, option) {
      const leftX = x - width / 2;
      const rightX = x + width / 2;

      const lb = project3D(leftX, 0, z);
      const rb = project3D(rightX, 0, z);
      const lt = project3D(leftX, 48, z);
      const rt = project3D(rightX, 48, z);

      if (lb.scale <= 0.1) return;

      ctx.save();

      // Border and Glass colors
      let color = 'rgba(0, 102, 255, 0.25)'; // Blue default
      let borderColor = '#00f0ff';

      if (option.type === 'TIME') {
        color = 'rgba(34, 197, 94, 0.25)'; // Green glass for time
        borderColor = '#22c55e';
      } else if (option.type === 'WEAPON') {
        color = 'rgba(157, 0, 255, 0.25)'; // Purple for weapons
        borderColor = '#9d00ff';
      } else if (!option.isPositive) {
        color = 'rgba(239, 68, 68, 0.25)'; // Red for negatives
        borderColor = '#ef4444';
      }

      ctx.fillStyle = color;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 4 * lb.scale;

      ctx.beginPath();
      ctx.moveTo(lb.X, lb.Y);
      ctx.lineTo(lt.X, lt.Y);
      ctx.lineTo(rt.X, rt.Y);
      ctx.lineTo(rb.X, rb.Y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Pillars
      ctx.fillStyle = '#334155';
      ctx.fillRect(lb.X - 3.5 * lb.scale, lt.Y, 7 * lb.scale, lb.Y - lt.Y);
      ctx.fillRect(rb.X - 3.5 * rb.scale, rt.Y, 7 * rb.scale, rb.Y - rt.Y);

      // Icon formatting
      const centerProj = project3D(x, 24, z);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.floor(20 * centerProj.scale)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let labelText = option.label;
      if (option.type === 'TIME') {
        labelText = `⏰ ${option.label}`;
      } else if (!option.isPositive) {
        labelText = `💀 ${option.label}`;
      }
      ctx.fillText(labelText, centerProj.X, centerProj.Y);

      ctx.restore();
    }

    // DRAW BADGES
    function drawPillBadge(ctx, x, y, count, bgColor) {
      ctx.save();
      ctx.fillStyle = bgColor;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      
      const textStr = String(count);
      ctx.font = 'bold 11px sans-serif';
      const textWidth = ctx.measureText(textStr).width;
      
      const padX = 8;
      const padY = 4;
      const w = Math.max(22, textWidth + padX * 2);
      const h = 18;
      
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - h / 2, w, h, 9);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(textStr, x, y);
      ctx.restore();
    }

    // MAIN LOOP
    const gameLoop = (timestamp) => {
      if (isGameOver) return;

      // Sync React HUD
      setScore(localScore);
      setCrowdSize(cloneSoldiers.length + 1);
      setHealth(localHealth);
      setTimeRemaining(localTimeRemaining);
      setEnemiesKilled(enemiesKilledCount);
      setTargetKills(currentTargetKills);
      setBossActive(bossActiveLocal);
      setBossHP(bossHPLocal);
      setBossMaxHP(bossMaxHPLocal);
      
      const weaponNames = ['Pistol', 'Shotgun', 'Dual SMGs', 'Minigun'];
      setWeaponName(weaponNames[localWeaponLevel - 1] || 'Heavy Minigun');

      // --- Timer ticks ---
      if (!isDemo) {
        if (lastTimeTick === 0) lastTimeTick = timestamp;
        if (timestamp - lastTimeTick >= 1000) {
          lastTimeTick = timestamp;
          localTimeRemaining--;
          
          // TRIGGER GIANT TITAN BOSS INCOMING AT 15 SECONDS
          if (localTimeRemaining === 15 && !bossActiveLocal) {
            bossActiveLocal = true;
            bossHPLocal = 150 + globalLevel * 30;
            bossMaxHPLocal = bossHPLocal;
            bossX = 0;
            bossZ = 600;
          }

          if (localTimeRemaining <= 0) {
            isGameOver = true;
            // Win condition: Killed target number of enemies and boss is dead
            const victory = (enemiesKilledCount >= currentTargetKills && !bossActiveLocal);
            handleFinish(victory);
          }
        }
      }

      // Handle Keyboard controls
      if (!isDemo) {
        const moveSpeedX = 4.5;
        const moveSpeedZ = 2.5;

        if (keys['a'] || keys['arrowleft']) {
          hero.targetX = Math.max(-180, hero.targetX - moveSpeedX);
        }
        if (keys['d'] || keys['arrowright']) {
          hero.targetX = Math.min(180, hero.targetX + moveSpeedX);
        }
        if (keys['w'] || keys['arrowup']) {
          hero.targetZ = Math.min(180, hero.targetZ + moveSpeedZ);
        }
        if (keys['s'] || keys['arrowdown']) {
          hero.targetZ = Math.max(110, hero.targetZ - moveSpeedZ);
        }
      }

      // Shake updates
      if (screenShakeIntensity > 0) {
        screenShakeIntensity *= 0.88;
      }

      // --- 1. RENDER BACKGROUND SKY ---
      ctx.save();
      if (screenShakeIntensity > 0.5) {
        const shakeX = (Math.random() - 0.5) * screenShakeIntensity;
        const shakeY = (Math.random() - 0.5) * screenShakeIntensity;
        ctx.translate(shakeX, shakeY);
      }

      const horizonYVal = canvas.height * 0.42;
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonYVal);
      skyGrad.addColorStop(0, '#090d16');
      skyGrad.addColorStop(0.5, '#18243c');
      skyGrad.addColorStop(1, '#3b82f6');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, horizonYVal);

      // Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      clouds.forEach((cloud) => {
        cloud.x += cloud.speed;
        if (cloud.x - cloud.size > canvas.width) cloud.x = -cloud.size;
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 0.5, cloud.y - cloud.size * 0.2, cloud.size * 0.8, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 1.1, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
      });

      // --- 2. RENDER RUNNER TRACK GROUND ---
      ctx.fillStyle = '#cf9f72';
      ctx.fillRect(0, horizonYVal, canvas.width, canvas.height - horizonYVal);

      const trackNL = project3D(-220, 0, 100);
      const trackNR = project3D(220, 0, 100);
      const trackFL = project3D(-220, 0, 600);
      const trackFR = project3D(220, 0, 600);

      ctx.fillStyle = '#4b5563';
      ctx.beginPath();
      ctx.moveTo(trackNL.X, trackNL.Y);
      ctx.lineTo(trackFL.X, trackFL.Y);
      ctx.lineTo(trackFR.X, trackFR.Y);
      ctx.lineTo(trackNR.X, trackNR.Y);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(trackNL.X, trackNL.Y);
      ctx.lineTo(trackFL.X, trackFL.Y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(trackNR.X, trackNR.Y);
      ctx.lineTo(trackFR.X, trackFR.Y);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.setLineDash([20, 25]);
      ctx.lineWidth = 3.0;

      const laneLeftN = project3D(-73.3, 0, 100);
      const laneLeftF = project3D(-73.3, 0, 600);
      ctx.beginPath();
      ctx.moveTo(laneLeftN.X, laneLeftN.Y);
      ctx.lineTo(laneLeftF.X, laneLeftF.Y);
      ctx.stroke();

      const laneRightN = project3D(73.3, 0, 100);
      const laneRightF = project3D(73.3, 0, 600);
      ctx.beginPath();
      ctx.moveTo(laneRightN.X, laneRightN.Y);
      ctx.lineTo(laneRightF.X, laneRightF.Y);
      ctx.stroke();

      ctx.setLineDash([]);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, horizonYVal);
      ctx.lineTo(canvas.width, horizonYVal);
      ctx.stroke();

      // --- 3. AUTO SPAWNING CYCLE (FREQUENCY INCREASED FOR STREET BLOCKS) ---
      scenerySpawnTimer++;
      if (scenerySpawnTimer >= 12) {
        scenerySpawnTimer = 0;
        spawnScenery3D();
      }

      if (!isDemo) {
        // Spawning Zombie Mobs (unless Boss is active to focus battle)
        if (!bossActiveLocal) {
          enemySpawnTimer++;
          if (enemySpawnTimer >= enemySpawnSpeed) {
            enemySpawnTimer = 0;
            const mobSize = Math.floor(Math.random() * 11) + 15 + (globalLevel * 2);
            
            const zombiesList = [];
            for (let i = 0; i < mobSize; i++) {
              zombiesList.push({
                rx: (Math.random() - 0.5) * 55,
                rz: (Math.random() - 0.5) * 45,
                health: enemyHealthMax,
                animOffset: Math.random() * 10
              });
            }

            enemyMobs.push({
              id: Math.random(),
              x: (Math.random() - 0.5) * 120,
              z: 600,
              vz: -enemyMovementSpeed,
              zombies: zombiesList
            });
          }
        }

        // Gates
        gateSpawnTimer++;
        if (gateSpawnTimer >= 180) {
          gateSpawnTimer = 0;
          spawnGate3D();
        }

        // Obstacles
        obstacleSpawnTimer++;
        if (obstacleSpawnTimer >= 220) {
          obstacleSpawnTimer = 0;
          spawnObstacle3D();
        }
      }

      // --- 4. PLAYER & CLONES UPDATE ---
      if (isDemo) {
        let closestTarget = null;
        let minDistanceZ = Infinity;

        mathGates.forEach((gate) => {
          const dZ = gate.z - hero.z;
          if (dZ > 0 && dZ < minDistanceZ) {
            minDistanceZ = dZ;
            closestTarget = gate.x;
          }
        });

        if (closestTarget === null) {
          enemyMobs.forEach((mob) => {
            const dZ = mob.z - hero.z;
            if (dZ > 0 && dZ < minDistanceZ) {
              minDistanceZ = dZ;
              closestTarget = mob.x;
            }
          });
        }

        if (closestTarget !== null) {
          hero.targetX += (closestTarget - hero.targetX) * 0.15;
        } else {
          hero.targetX += (0 - hero.targetX) * 0.05;
        }
        hero.targetZ = 130;
      }

      // CROWD LIMITATION: Capping crowd at 60. If exceeded, automatically divide in half with alert
      if (cloneSoldiers.length > 60) {
        const discardCount = Math.floor(cloneSoldiers.length / 2);
        cloneSoldiers.splice(0, discardCount);
        spawnExplosion3D(hero.x, 15, hero.z, '#ef4444', 15);
        screenShakeIntensity = 10;
        crowdReducedFlashTimer = 75;
      }

      // Move Hero
      hero.x += (hero.targetX - hero.x) * 0.25;
      hero.z += (hero.targetZ - hero.z) * 0.15;

      const roadLimit = 200;
      if (hero.x < -roadLimit) hero.x = -roadLimit;
      if (hero.x > roadLimit) hero.x = roadLimit;
      if (hero.z < 110) hero.z = 110;
      if (hero.z > 195) hero.z = 195;

      // Update positions of clones running behind hero
      cloneSoldiers.forEach((clone, index) => {
        const angleOffset = (index * 0.95);
        const distance = 16 + (Math.floor(index / 5) * 6);
        
        const targetX = hero.x + Math.sin(angleOffset) * distance;
        const targetZ = hero.z - Math.cos(angleOffset) * distance - 8;

        clone.x += (targetX - clone.x) * 0.15;
        clone.z += (targetZ - clone.z) * 0.15;

        // Force soldiers to stay strictly within road bounds
        const cloneLimit = roadLimit - 15;
        if (clone.x < -cloneLimit) clone.x = -cloneLimit;
        if (clone.x > cloneLimit) clone.x = cloneLimit;
      });

      // --- ALL CROWD SOLDIERS SHOOT BULLETS (OPTIMIZED FOR LARGE CROWDS) ---
      if (!isDemo && timestamp - lastFired > fireIntervals[localWeaponLevel - 1]) {
        const fireY = 4;
        const fireZ = hero.z + 10;
        
        // 1. Hero always fires
        if (localWeaponLevel === 1) {
          playerBullets.push({ x: hero.x + 8, y: fireY, z: fireZ, vx: 0, vz: 8, damage: 1 });
        } else if (localWeaponLevel === 2) {
          playerBullets.push({ x: hero.x + 8, y: fireY, z: fireZ, vx: -1.2, vz: 7.5, damage: 1 });
          playerBullets.push({ x: hero.x + 8, y: fireY, z: fireZ, vx: 0, vz: 8, damage: 1 });
          playerBullets.push({ x: hero.x + 8, y: fireY, z: fireZ, vx: 1.2, vz: 7.5, damage: 1 });
        } else if (localWeaponLevel === 3) {
          playerBullets.push({ x: hero.x + 3, y: fireY, z: fireZ, vx: 0, vz: 9, damage: 1.5 });
          playerBullets.push({ x: hero.x + 13, y: fireY, z: fireZ, vx: 0, vz: 9, damage: 1.5 });
        } else {
          const spray = (Math.random() - 0.5) * 0.6;
          playerBullets.push({ x: hero.x + 8, y: fireY, z: fireZ, vx: spray, vz: 10, damage: 2 });
        }

        // 2. Clones fire capped bullets to prevent O(N^2) collision checks
        const totalClones = cloneSoldiers.length;
        if (totalClones > 0) {
          const maxCloneBullets = 10;
          const bulletsToSpawn = Math.min(totalClones, maxCloneBullets);
          const damageMultiplier = totalClones / bulletsToSpawn;

          for (let i = 0; i < bulletsToSpawn; i++) {
            const sampleIdx = Math.floor(i * (totalClones / bulletsToSpawn));
            const c = cloneSoldiers[sampleIdx];
            if (c) {
              playerBullets.push({
                x: c.x,
                y: fireY,
                z: c.z + 10,
                vx: 0,
                vz: 8,
                damage: damageMultiplier
              });
            }
          }
        }

        lastFired = timestamp;
      }

      // --- 5. RENDER & UPDATE BULLETS ---
      playerBullets.forEach((b, bIdx) => {
        b.z += b.vz;
        b.x += b.vx;

        const bProj = project3D(b.x, b.y, b.z);
        if (bProj.scale > 0.1) {
          ctx.fillStyle = '#ffd700';
          ctx.shadowBlur = 6 * bProj.scale;
          ctx.shadowColor = '#ffd700';
          ctx.beginPath();
          ctx.arc(bProj.X, bProj.Y, 2.5 * bProj.scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Bullet hit checks against Boss Titan
        if (bossActiveLocal) {
          const zDiffBoss = Math.abs(b.z - bossZ);
          if (zDiffBoss < 25) {
            const xDiffBoss = Math.abs(b.x - bossX);
            if (xDiffBoss < 35) {
              // Boss hit!
              spawnExplosion3D(b.x, b.y, b.z, '#ffd700', 3);
              playerBullets.splice(bIdx, 1);
              
              // Damage depends on weapon tier level and bullet damage
              bossHPLocal -= (b.damage || 1) * localWeaponLevel;
              if (bossHPLocal <= 0) {
                // Giant Zombie Titan Defeated! Instant victory!
                spawnExplosion3D(bossX, 30, bossZ, '#22c55e', 25);
                bossActiveLocal = false;
                localScore += 250;
                isGameOver = true;
                handleFinish(true);
              }
            }
          }
        }

        // Bullet hit checks against ALL zombie mobs
        enemyMobs.forEach((mob) => {
          // OPTIMIZATION: Skip distant mobs instantly!
          if (Math.abs(b.z - mob.z) > 55) return;

          mob.zombies.forEach((enemy, eIdx) => {
            const absX = mob.x + enemy.rx;
            const absZ = mob.z + enemy.rz;
            const zDiff = Math.abs(b.z - absZ);
            
            if (zDiff < 14) {
              const xDiff = Math.abs(b.x - absX);
              if (xDiff < 16) {
                spawnExplosion3D(b.x, b.y, b.z, '#ffd700', 3);
                enemy.health -= (b.damage || 1);
                playerBullets.splice(bIdx, 1);

                if (enemy.health <= 0) {
                  spawnExplosion3D(absX, 15, absZ, '#ff0055', 6);
                  mob.zombies.splice(eIdx, 1);
                  localScore += 15;
                  enemiesKilledCount++;
                }
              }
            }
          });
        });

        // Delete far bullets
        if (b.z > 600) {
          playerBullets.splice(bIdx, 1);
        }
      });

      // --- 6. RENDER & UPDATE GATES (Time extensions) ---
      mathGates.forEach((gate, gIdx) => {
        gate.z -= 1.8 + (globalLevel * 0.05);

        drawGate(ctx, gate.x, gate.z, gate.width, gate.option);

        // Collision Check
        const zDiff = Math.abs(hero.z - gate.z);
        if (zDiff < 6) {
          const leftBound = gate.x - gate.width / 2;
          const rightBound = gate.x + gate.width / 2;
          
          if (hero.x >= leftBound && hero.x <= rightBound) {
            mathGates.splice(gIdx, 1);
            
            let colorGlow = gate.option.isPositive ? gate.option.borderColor : '#ef4444';
            spawnExplosion3D(hero.x, 20, gate.z, colorGlow, 8);

            if (gate.option.type === 'TIME') {
              // Add +5 seconds to timer
              localTimeRemaining = Math.min(99, localTimeRemaining + gate.option.value);
            } else if (gate.option.type === 'WEAPON') {
              localWeaponLevel = Math.min(4, localWeaponLevel + 1);
            } else {
              // Positive Clones
              if (gate.option.isPositive) {
                const currentCount = cloneSoldiers.length + 1;
                const addCount = gate.option.isMultiply 
                  ? (currentCount * gate.option.value) - currentCount
                  : gate.option.value;

                for (let c = 0; c < addCount; c++) {
                  cloneSoldiers.push({
                    x: hero.x + (Math.random() - 0.5) * 45,
                    y: 0,
                    z: hero.z - 10 - (Math.random() * 20),
                    animOffset: Math.random() * 10
                  });
                }
              } 
              // Negative Clones
              else {
                const currentCount = cloneSoldiers.length;
                let removeCount = 0;
                
                if (gate.option.isDivide) {
                  removeCount = Math.floor(currentCount - (currentCount / gate.option.value));
                } else {
                  removeCount = gate.option.value;
                }

                if (removeCount > 0) {
                  if (cloneSoldiers.length >= removeCount) {
                    cloneSoldiers.splice(0, removeCount);
                  } else {
                    const remainder = removeCount - cloneSoldiers.length;
                    cloneSoldiers = [];
                    localHealth = Math.max(0, localHealth - remainder * 8);
                    screenShakeIntensity = 10;
                  }
                }
              }
            }
          }
        }

        // Delete gates
        if (gate.z < 95) {
          mathGates.splice(gIdx, 1);
        }
      });

      // --- 7. RENDER & UPDATE OBSTACLES ---
      obstacles.forEach((obs, oIdx) => {
        obs.z -= obs.speed;

        drawObstacle(ctx, obs.x, obs.z, obs.width, obs.height, obs.depth);

        // Clones crash on concrete
        cloneSoldiers.forEach((clone, cIdx) => {
          // OPTIMIZATION: Skip distant obstacles instantly!
          if (Math.abs(clone.z - obs.z) > 40) return;

          const zDiffClone = Math.abs(clone.z - obs.z);
          if (zDiffClone < obs.depth / 2 + 4) {
            const leftBound = obs.x - obs.width / 2 - 6;
            const rightBound = obs.x + obs.width / 2 + 6;
            if (clone.x >= leftBound && clone.x <= rightBound) {
              spawnExplosion3D(clone.x, 10, clone.z, '#64748b', 4);
              cloneSoldiers.splice(cIdx, 1);
            }
          }
        });

        // Hero crashes
        const zDiffHero = Math.abs(hero.z - obs.z);
        if (zDiffHero < obs.depth / 2 + 5) {
          const leftBound = obs.x - obs.width / 2 - 8;
          const rightBound = obs.x + obs.width / 2 + 8;
          
          if (hero.x >= leftBound && hero.x <= rightBound) {
            obstacles.splice(oIdx, 1);
            spawnExplosion3D(hero.x, 10, hero.z, '#eab308', 12);
            
            if (cloneSoldiers.length > 0) {
              const discard = Math.min(cloneSoldiers.length, 4);
              cloneSoldiers.splice(0, discard);
            } else if (!isDemo) {
              localHealth = Math.max(0, localHealth - 25);
              screenShakeIntensity = 12;
            }
          }
        }

        // Delete obstacles
        if (obs.z < 95) {
          obstacles.splice(oIdx, 1);
        }
      });

      // --- 8. UPDATE SCENERY ---
      scenery.forEach((item, index) => {
        item.z -= item.speed + (globalLevel * 0.05);
        if (item.z < 95) {
          scenery.splice(index, 1);
        }
      });

      // --- 9. UPDATE TITAN BOSS MOVEMENT & CLASHES ---
      if (bossActiveLocal) {
        bossZ += bossVz;

        // Clash boss with clones 1-by-1
        const bossZDiff = Math.abs(hero.z - bossZ);
        if (bossZDiff < 24) {
          cloneSoldiers.forEach((clone, cIdx) => {
            const clashX = Math.abs(clone.x - bossX);
            if (clashX < 28) {
              // Destroy clone, deal 5 damage to boss
              spawnExplosion3D(clone.x, 15, clone.z, '#00bcff', 4);
              cloneSoldiers.splice(cIdx, 1);
              bossHPLocal -= 5;
            }
          });

          // Core clash against Hero
          const clashXHero = Math.abs(hero.x - bossX);
          if (clashXHero < 30) {
            screenShakeIntensity = 6;
            if (!isDemo) {
              localHealth = Math.max(0, localHealth - 0.7); // deal rapid heavy damage
            }
          }
        }

        // Boss reaches camera
        if (bossZ < 95) {
          bossActiveLocal = false;
          if (!isDemo) {
            localHealth = Math.max(0, localHealth - 50); // massive escape damage
          }
        }
      }

      // --- 10. UPDATE & CLASH ZOMBIE MOBS ---
      enemyMobs.forEach((mob, mIdx) => {
        mob.z += mob.vz;

        if (mob.zombies.length === 0) {
          enemyMobs.splice(mIdx, 1);
          return;
        }

        // Zombie mob clash
        const mobZDiff = Math.abs(hero.z - mob.z);
        if (mobZDiff < 20) {
          
          cloneSoldiers.forEach((clone, cIdx) => {
            // OPTIMIZATION: Skip distant mobs instantly!
            if (Math.abs(clone.z - mob.z) > 40) return;

            mob.zombies.forEach((zombie, zIdx) => {
              const absZombieX = mob.x + zombie.rx;
              const absZombieZ = mob.z + zombie.rz;
              
              const clashX = Math.abs(clone.x - absZombieX);
              const clashZ = Math.abs(clone.z - absZombieZ);
              
              if (clashZ < 12 && clashX < 14) {
                spawnExplosion3D(clone.x, 15, clone.z, '#00bcff', 4);
                spawnExplosion3D(absZombieX, 15, absZombieZ, '#ff0055', 4);
                
                cloneSoldiers.splice(cIdx, 1);
                mob.zombies.splice(zIdx, 1);
              }
            });
          });

          // Clash remaining with Hero
          mob.zombies.forEach((zombie, zIdx) => {
            const absZombieX = mob.x + zombie.rx;
            const absZombieZ = mob.z + zombie.rz;
            
            const clashX = Math.abs(hero.x - absZombieX);
            const clashZ = Math.abs(hero.z - absZombieZ);
            
            if (clashZ < 12 && clashX < 15) {
              spawnExplosion3D(absZombieX, 15, absZombieZ, '#ff0055', 6);
              mob.zombies.splice(zIdx, 1);
              
              if (cloneSoldiers.length > 0) {
                cloneSoldiers.pop();
              } else if (!isDemo) {
                localHealth = Math.max(0, localHealth - 15);
                screenShakeIntensity = 10;
              }
            }
          });
        }

        if (mob.z < 95) {
          const escapeCount = mob.zombies.length;
          enemyMobs.splice(mIdx, 1);
          if (!isDemo) {
            localHealth = Math.max(0, localHealth - escapeCount * 4);
          }
        }
      });

      if (localHealth <= 0 && !isDemo) {
        isGameOver = true;
        handleFinish(false);
      }

      // --- 11. UNIFIED Z-DEPTH PAINTER SORTING ---
      const renderables = [];

      // Hero
      renderables.push({
        type: 'HERO',
        x: hero.x,
        y: hero.y,
        z: hero.z,
        animOffset: 0
      });

      // Clones
      cloneSoldiers.forEach((clone) => {
        renderables.push({
          type: 'CLONE',
          x: clone.x,
          y: 0,
          z: clone.z,
          animOffset: clone.animOffset
        });
      });

      // Titan Boss
      if (bossActiveLocal) {
        renderables.push({
          type: 'BOSS',
          x: bossX,
          y: 0,
          z: bossZ,
          animOffset: 0,
          health: bossHPLocal,
          maxHealth: bossMaxHPLocal
        });
      }

      // Zombies inside Mobs
      enemyMobs.forEach((mob) => {
        mob.zombies.forEach((z) => {
          renderables.push({
            type: 'ZOMBIE',
            x: mob.x + z.rx,
            y: 0,
            z: mob.z + z.rz,
            animOffset: z.animOffset
          });
        });
      });

      // Obstacles
      obstacles.forEach((obs) => {
        renderables.push({
          type: 'OBSTACLE',
          x: obs.x,
          y: 0,
          z: obs.z,
          width: obs.width,
          height: obs.height,
          depth: obs.depth
        });
      });

      // Math Gates
      mathGates.forEach((gate) => {
        renderables.push({
          type: 'GATE',
          x: gate.x,
          y: 0,
          z: gate.z,
          width: gate.width,
          option: gate.option
        });
      });

      // Scenery Buildings/Houses/Trees
      scenery.forEach((item) => {
        renderables.push({
          type: 'SCENERY',
          sceneryType: item.type, // 'TREE' | 'HOUSE' | 'BUILDING'
          x: item.x,
          y: 0,
          z: item.z
        });
      });

      renderables.sort((a, b) => b.z - a.z);

      // Draw depth sorted items
      renderables.forEach((item) => {
        if (item.type === 'HERO') {
          drawSoldier(ctx, item.x, item.y, item.z, timestamp, item.animOffset, true);
        } else if (item.type === 'CLONE') {
          drawSoldier(ctx, item.x, item.y, item.z, timestamp, item.animOffset, false);
        } else if (item.type === 'BOSS') {
          drawBoss(ctx, item.x, item.y, item.z, timestamp, item.health, item.maxHealth);
        } else if (item.type === 'ZOMBIE') {
          drawZombie(ctx, item.x, item.y, item.z, timestamp, item.animOffset);
        } else if (item.type === 'OBSTACLE') {
          drawObstacle(ctx, item.x, item.z, item.width, item.height, item.depth);
        } else if (item.type === 'GATE') {
          drawGate(ctx, item.x, item.z, item.width, item.option);
        } else if (item.type === 'SCENERY') {
          if (item.sceneryType === 'HOUSE') {
            drawHouse(ctx, item.x, item.y, item.z);
          } else if (item.sceneryType === 'BUILDING') {
            drawBuilding(ctx, item.x, item.y, item.z);
          } else {
            drawTree(ctx, item.x, item.y, item.z);
          }
        }
      });

      // --- 12. CROWD SIZE INDICATORS ---
      const playerBadgeProj = project3D(hero.x, 36, hero.z);
      if (playerBadgeProj.scale > 0.1) {
        drawPillBadge(ctx, playerBadgeProj.X, playerBadgeProj.Y, cloneSoldiers.length + 1, '#2563eb');
      }

      enemyMobs.forEach((mob) => {
        const mobBadgeProj = project3D(mob.x, 32, mob.z);
        if (mobBadgeProj.scale > 0.1) {
          drawPillBadge(ctx, mobBadgeProj.X, mobBadgeProj.Y, mob.zombies.length, '#ef4444');
        }
      });

      // Particles
      particles.forEach((p, pIdx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.vy -= 0.15;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(pIdx, 1);
        } else {
          const pProj = project3D(p.x, p.y, p.z);
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 6 * pProj.scale;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.arc(pProj.X, pProj.Y, 3.5 * pProj.scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      ctx.restore();

      // Draw Crowd capacity reduction warning alert
      if (crowdReducedFlashTimer > 0) {
        crowdReducedFlashTimer--;
        ctx.save();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ef4444';
        ctx.fillText('⚠️ CROWD CAPACITY LIMIT: REDUCED BY 50%! ⚠️', canvas.width / 2, canvas.height * 0.35);
        ctx.restore();
      }

      const currentCrowdSize = cloneSoldiers.length + 1;
      if (currentCrowdSize > maxCrowdSizeCount) {
        maxCrowdSizeCount = currentCrowdSize;
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    const handleFinish = (won) => {
      cancelAnimationFrame(animationFrameId);
      
      const stats = {
        score: localScore,
        enemiesKilled: enemiesKilledCount,
        maxCrowdSize: maxCrowdSizeCount,
        wavesCleared: won ? globalLevel : globalLevel - 1
      };
      
      setTimeout(() => {
        onGameComplete(won, stats);
      }, 1500);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);

      window.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [tier, globalLevel, isDemo, onGameComplete]);

  return (
    <div ref={containerRef} className="game-arena-wrapper">
      
      {/* Background Canvas */}
      <canvas ref={canvasRef} className="game-canvas"></canvas>

      {/* TITAN BOSS HEALTH HUD */}
      {bossActive && (
        <div className="boss-health-hud">
          <span style={{ fontSize: '10px', fontWeight: '900', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1px' }}>⚠️ BOSS INCOMING ⚠️</span>
          <div className="health-bar-bg" style={{ backgroundColor: '#450a0a' }}>
            <div 
              className="health-bar-fill"
              style={{ width: `${(bossHP / bossMaxHP) * 100}%`, backgroundColor: '#ef4444' }}
            ></div>
          </div>
          <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'monospace' }}>{bossHP} / {bossMaxHP} HP</span>
        </div>
      )}

      {/* HUD Overlay */}
      {!isDemo ? (
        <div className="hud-overlay">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <button 
              onClick={onExit}
              className="btn-hud-quit"
            >
              ✖ Quit
            </button>

            {/* Time HUD */}
            <div className="hud-card" style={{ alignItems: 'center' }}>
              <span style={{ fontSize: '8px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time Remaining</span>
              <span className={timeRemaining <= 10 ? 'pulse-animation' : ''} style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'monospace', color: timeRemaining <= 10 ? '#ef4444' : '#ffffff' }}>
                {timeRemaining}s
              </span>
            </div>

            {/* Weapon Badge */}
            <div className="hud-card" style={{ alignItems: 'flex-end' }}>
              <span style={{ fontSize: '8px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Guns Equip</span>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#c084fc', textTransform: 'uppercase' }}>{weaponName}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
            {/* Left: Health and Kills Objective HUD */}
            <div className="health-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                <span>Health</span>
                <span style={{ color: health <= 30 ? '#f87171' : '#4ade80' }}>{health}%</span>
              </div>
              
              <div className="health-bar-bg">
                <div 
                  className="health-bar-fill"
                  style={{ 
                    width: `${health}%`,
                    backgroundColor: health <= 30 ? '#ef4444' : health <= 60 ? '#f59e0b' : '#10b981'
                  }}
                ></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                <span>Score: <b style={{ fontFamily: 'monospace', color: '#ffffff' }}>{score}</b></span>
                <span>Clones: <b style={{ fontFamily: 'monospace', color: '#22d3ee' }}>{crowdSize}</b></span>
              </div>

              {/* Zombies Slayed vs Target Kills Target Goal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: '800', color: '#fbbf24', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px', marginTop: '4px' }}>
                <span>Zombies Slain:</span>
                <span style={{ fontFamily: 'monospace' }}>{enemiesKilled} / {targetKills}</span>
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '8px 12px', fontSize: '9px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', maxWidth: '240px', textAlign: 'right' }}>
              Pass gates to multiply and extend time. Defeat the Titan Boss before 0s!
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
