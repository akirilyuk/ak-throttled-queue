/* eslint-disable no-underscore-dangle */
module.exports = class ThrottledQueue {
  /**
   * Creates a new ThrottledQueue instance
   * @param interval {number} time in ms the fns should be executed
   * @param concurrency {number} max number of simultaneous executions
   * @param autostart {boolean} if true, queue will starts processing on a new push, default true
   */
  constructor({ interval, concurrency, autostart = true }) {
    this.interval = interval;
    this.concurrency = concurrency;

    this.lastCalled = Date.now();
    this.timeout = null;
    this.queue = [];
    this.executedConcurrently = 0;
    this.autostart = autostart;
    this.tail = null;
    this.stopping = false;
  }

  /**
   * Internal function, which takes the next {this.concurrency} fns and executes them.
   * Will stop if no queue elements are left.
   * @private
   */
  _dequeue() {
    const fnsToExecute = this.queue.splice(0, this.concurrency);
    fnsToExecute.forEach(queueFn => queueFn());
    this.executedConcurrently = 0;
    this.lastCalled = Date.now();
    if (this.queue.length) {
      this.timeout = this._createTimeout();
    } else {
      this.timeout = null;
    }
  }

  /**
   * Internal method, creates the next timeout for the queue processing
   * @returns {number} new timeout which will execute _dequeue after this.interval
   * @private
   */
  _createTimeout() {
    // eslint-disable-next-line
            return setTimeout(this._dequeue.bind(this), this.interval);
  }

  /**
   * Push an async action to the queue, returns a Promise, which will resolve if fn is executed
   * @param fn {AsyncFunction} async function to be executed in the queue.
   * @returns {Promise<unknown>} returns Promise which will resolve once the fn is executed
   */
  async push(fn) {
    if (this.stopping) {
      return Promise.reject(new Error('Queue stopping, adding fn failed'));
    }
    let resolver;
    let rejector;
    const promise = new Promise((resolve, reject) => {
      resolver = resolve;
      rejector = reject;
    });
    const queueFn = async () => {
      this.executedConcurrently += 1;
      try {
        resolver(await fn());
      } catch (err) {
        rejector(err);
      }
    };
    queueFn.rejector = rejector;
    if (
      this.autostart &&
      this.queue.length === 0 &&
      this.executedConcurrently < this.concurrency &&
      Date.now() - this.lastCalled < this.interval
    ) {
      queueFn();
    } else {
      this.queue.push(queueFn);
    }
    if (this.autostart && !this.timeout) {
      this.timeout = this._createTimeout();
    }
    this.tail = promise;
    return promise;
  }

  /**
   * Starts the queue
   */
  start() {
    if (!this.autostart) {
      this.autostart = true;
      this._dequeue();
    }
  }

  /**
   * Stops the queue, keeping the queued elements.
   * @return {null}
   */
  stop() {
    this.autostart = false;
    clearTimeout(this.timeout);
  }

  /**
   * This ends the queue, deleting the internal queue list and creating a new one
   * @param drain {boolean} if true, the queue is drained, and rejecting new functions adding during this time,
   * else will reject all queue functions
   */
  async end({ drain = true } = {}) {
    if (drain) {
      // reject new events while draining the queue
      this.stopping = true;
      try {
        await this.tail;
        // eslint-disable-next-line no-empty
      } catch (err) {
        // ignore error
      }
      this.stop();
      this.stopping = false;
    } else {
      this.queue.forEach(queueFn =>
        queueFn.rejector(new Error('queue stopped, aborting!'))
      );
    }
    delete this.queue;
    this.queue = [];
  }
};
