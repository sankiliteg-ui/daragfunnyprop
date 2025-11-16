let highestZ = 1;

class Paper {
  holdingPaper = false;
  mouseTouchX = 0;
  mouseTouchY = 0;
  mouseX = 0;
  mouseY = 0;
  prevMouseX = 0;
  prevMouseY = 0;
  velX = 0;
  velY = 0;
  rotation = Math.random() * 30 - 15;
  currentPaperX = 0;
  currentPaperY = 0;
  rotating = false;

  init(paper) {
    // prevent browser gestures while interacting with the paper
    paper.style.touchAction = 'none';
    paper.addEventListener('contextmenu', (e) => e.preventDefault());

    // ---------- MOUSE ----------
    document.addEventListener('mousemove', (e) => {
      if (!this.rotating) {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;

        this.velX = this.mouseX - this.prevMouseX;
        this.velY = this.mouseY - this.prevMouseY;
      }

      const dirX = e.clientX - this.mouseTouchX;
      const dirY = e.clientY - this.mouseTouchY;
      const dirLength = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
      const dirNormalizedX = dirX / dirLength;
      const dirNormalizedY = dirY / dirLength;

      const angle = Math.atan2(dirNormalizedY, dirNormalizedX);
      let degrees = 180 * angle / Math.PI;
      degrees = (360 + Math.round(degrees)) % 360;
      if (this.rotating && !this._usingTouchRotation) {
        this.rotation = degrees;
      }

      if (this.holdingPaper && !this._usingTouchRotation) {
        if (!this.rotating) {
          this.currentPaperX += this.velX;
          this.currentPaperY += this.velY;
        }
        this.prevMouseX = this.mouseX;
        this.prevMouseY = this.mouseY;

        paper.style.transform = `translateX(${this.currentPaperX}px) translateY(${this.currentPaperY}px) rotateZ(${this.rotation}deg)`;
      }
    });

    paper.addEventListener('mousedown', (e) => {
      if (this.holdingPaper) return;
      this.holdingPaper = true;

      paper.style.zIndex = highestZ;
      highestZ += 1;

      if (e.button === 0) {
        this.mouseTouchX = this.mouseX;
        this.mouseTouchY = this.mouseY;
        this.prevMouseX = this.mouseX;
        this.prevMouseY = this.mouseY;
        this._usingTouchRotation = false;
      }
      if (e.button === 2) {
        this.rotating = true;
        this._usingTouchRotation = false;
      }
    });
    window.addEventListener('mouseup', () => {
      this.holdingPaper = false;
      this.rotating = false;
      this._usingTouchRotation = false;
    });

    // ---------- TOUCH ----------
    // Helper: angle between two touch points (deg)
    const angleBetweenTouches = (t1, t2) => {
      const dx = t2.clientX - t1.clientX;
      const dy = t2.clientY - t1.clientY;
      return (Math.atan2(dy, dx) * 180) / Math.PI;
    };

    // touchstart
    paper.addEventListener('touchstart', (e) => {
      // prevent default so page doesn't scroll/zoom while interacting
      e.preventDefault();

      paper.style.zIndex = highestZ;
      highestZ += 1;

      if (e.touches.length === 1) {
        // single-finger drag start
        const t = e.touches[0];
        this.holdingPaper = true;
        this._usingTouchRotation = false;

        this.mouseTouchX = t.clientX;
        this.mouseTouchY = t.clientY;
        this.prevMouseX = t.clientX;
        this.prevMouseY = t.clientY;
        this.mouseX = t.clientX;
        this.mouseY = t.clientY;
      } else if (e.touches.length >= 2) {
        // two-finger rotate start
        this.holdingPaper = true;
        this.rotating = true;
        this._usingTouchRotation = true;

        // set initial rotation based on the two touches
        const a = angleBetweenTouches(e.touches[0], e.touches[1]);
        // normalize to 0-360
        this.rotation = (360 + Math.round(a)) % 360;
      }
    }, { passive: false });

    // touchmove
    paper.addEventListener('touchmove', (e) => {
      e.preventDefault();

      if (!this.holdingPaper) return;

      if (e.touches.length >= 2) {
        // two-finger rotation (ignore movement)
        this._usingTouchRotation = true;
        this.rotating = true;
        const a = angleBetweenTouches(e.touches[0], e.touches[1]);
        this.rotation = (360 + Math.round(a)) % 360;
      } else if (e.touches.length === 1) {
        // single-finger drag
        const t = e.touches[0];
        this.mouseX = t.clientX;
        this.mouseY = t.clientY;

        this.velX = this.mouseX - this.prevMouseX;
        this.velY = this.mouseY - this.prevMouseY;

        if (!this.rotating) {
          this.currentPaperX += this.velX;
          this.currentPaperY += this.velY;
        }

        this.prevMouseX = this.mouseX;
        this.prevMouseY = this.mouseY;
      }

      paper.style.transform = `translateX(${this.currentPaperX}px) translateY(${this.currentPaperY}px) rotateZ(${this.rotation}deg)`;
    }, { passive: false });

    // touchend / touchcancel
    const onTouchEnd = (e) => {
      // if remaining touches >=2 we keep rotating; if 1, switch to drag; if 0, stop everything.
      if (e.touches && e.touches.length >= 2) {
        // still rotating with remaining touches
        const a = angleBetweenTouches(e.touches[0], e.touches[1]);
        this.rotation = (360 + Math.round(a)) % 360;
        this.rotating = true;
        this._usingTouchRotation = true;
      } else if (e.touches && e.touches.length === 1) {
        // switch to single finger drag
        const t = e.touches[0];
        this.rotating = false;
        this._usingTouchRotation = false;

        this.mouseX = t.clientX;
        this.mouseY = t.clientY;
        this.prevMouseX = t.clientX;
        this.prevMouseY = t.clientY;
      } else {
        // no touches left
        this.holdingPaper = false;
        this.rotating = false;
        this._usingTouchRotation = false;
      }
    };

    paper.addEventListener('touchend', onTouchEnd);
    paper.addEventListener('touchcancel', onTouchEnd);
  }
}

// initialize
const papers = Array.from(document.querySelectorAll('.paper'));

papers.forEach(paper => {
  const p = new Paper();
  p.init(paper);
});
