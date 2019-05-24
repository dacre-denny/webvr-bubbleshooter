export type Action = () => void;

export class ActionQueue {
  actions: Action[] = [];
  timer: number = null;

  private iterate() {
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      const action = this.actions.shift();

      if (action) {
        action();
      }

      if (this.actions.length > 0) {
        this.iterate();
      } else {
        this.timer = null;
      }
    }, 50);
  }

  public add(callback: Action) {
    this.actions.push(callback);

    if (this.timer === null) {
      this.iterate();
    }
  }

  public isBusy() {
    return !!this.timer;
  }
}

export class ActionRandom {
  timer: number = null;
  action: Action = null;

  private iterate() {
    this.cancel();

    this.timer = setTimeout(() => {
      if (this.action) {
        this.action();
      }
      this.iterate();
    }, 3000 * (Math.random() * 0.5 + 0.5));
  }

  public callback(callback: Action) {
    this.action = callback;
    this.iterate();
  }

  public cancel() {
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
  }
}
