 // 🌌 粒子星云动画背景
  const canvas = document.getElementById("bgCanvas");
  const ctx = canvas.getContext("2d");
  let w, h;
  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  const particles = Array.from({ length: 120 }).map(() => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    r: Math.random() * 1.8 + 0.5,
    color: `hsla(${Math.random() * 60 + 200}, 100%, 70%, 0.8)`
  }));

  function draw() {
    ctx.fillStyle = "rgba(240,248,255,0.15)";
    ctx.fillRect(0, 0, w, h);
    for (let p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();