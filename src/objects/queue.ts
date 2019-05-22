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
