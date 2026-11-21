export class Input {
  constructor() {
    this.jumpQueued = false;
    this.jumpHeld = false;
    this.jumpHeldSource = null;
    this.restartQueued = false;
    this.pauseQueued = false;
    this.jumpReleased = false;
    this._prevGamepadJump = false;
    this._prevGamepadStart = false;
    this._keysDown = new Set();
    this._touchJump = null;

    window.addEventListener("keydown", (e) => this._onKey(e, true), { passive: false });
    window.addEventListener("keyup", (e) => this._onKey(e, false));
    window.addEventListener("gamepadconnected", (e) => {
      console.info("Manette détectée :", e.gamepad.id);
    });
  }

  setTouchJumpSource(source) {
    this._touchJump = source;
  }

  _onKey(e, down) {
    const code = e.code;
    if (["Space", "ArrowUp", "KeyW", "KeyZ"].includes(code)) {
      e.preventDefault();
      this._setHeld(down, "key");
    } else if (down && (code === "KeyR" || code === "Backspace")) {
      e.preventDefault();
      this.restartQueued = true;
    } else if (down && (code === "Escape" || code === "KeyP")) {
      this.pauseQueued = true;
    } else if (down && code === "KeyF") {
      this._fullscreenQueued = true;
    }
    if (!down) this._keysDown.delete(code);
    else this._keysDown.add(code);
  }

  _setHeld(down, source) {
    if (down) {
      if (!this.jumpHeld) this.jumpQueued = true;
      this.jumpHeld = true;
      this.jumpHeldSource = source;
    } else if (this.jumpHeldSource === source || this.jumpHeldSource === null) {
      this.jumpHeld = false;
      this.jumpHeldSource = null;
      this.jumpReleased = true;
    }
  }

  pressJump(source) {
    if (!this.jumpHeld) this.jumpQueued = true;
    this.jumpHeld = true;
    this.jumpHeldSource = source;
  }

  releaseJump(source) {
    if (this.jumpHeldSource === source || source === "any") {
      this.jumpHeld = false;
      this.jumpHeldSource = null;
      this.jumpReleased = true;
    }
  }

  poll() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const pad of pads) {
      if (!pad || !pad.connected) continue;
      const jump = pad.buttons[0] && pad.buttons[0].pressed;
      const start = pad.buttons[9] && pad.buttons[9].pressed;
      if (jump && !this._prevGamepadJump) this.pressJump("pad");
      if (!jump && this._prevGamepadJump) this.releaseJump("pad");
      this._prevGamepadJump = !!jump;
      if (start && !this._prevGamepadStart) this.pauseQueued = true;
      this._prevGamepadStart = !!start;
      break;
    }
    if (this._touchJump && this._touchJump.down) {
      if (!this.jumpHeld) this.pressJump("touch");
    } else if (this.jumpHeldSource === "touch") {
      this.releaseJump("touch");
    }
  }

  consumeJump() {
    const j = this.jumpQueued;
    this.jumpQueued = false;
    return j;
  }

  consumeRestart() {
    const r = this.restartQueued;
    this.restartQueued = false;
    return r;
  }

  consumePause() {
    const p = this.pauseQueued;
    this.pauseQueued = false;
    return p;
  }

  consumeFullscreen() {
    const f = this._fullscreenQueued;
    this._fullscreenQueued = false;
    return f;
  }

  consumeJumpRelease() {
    const r = this.jumpReleased;
    this.jumpReleased = false;
    return r;
  }

  reset() {
    this.jumpQueued = false;
    this.jumpReleased = false;
    this.restartQueued = false;
    this.pauseQueued = false;
  }
}
