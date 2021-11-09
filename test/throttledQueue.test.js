const ThrottledQueue = require('../src');

describe('integration test ThrottledQueue', () => {
  it('should execute max 5 on start if no time passed and autostart is false, also do not execute double if start called twice', () => {
    jest.useFakeTimers();
    const queue = new ThrottledQueue({
      interval: 1000,
      concurrency: 5,
      autostart: false
    });

    const promiseFn = [];

    for (let i = 0; i < 100; i += 1) {
      const fn = jest.fn();
      promiseFn.push(fn);
      queue.push(fn);
    }

    queue.start();
    queue.start();

    const called = promiseFn.splice(0, 5);
    called.forEach(fn => expect(fn).toHaveBeenCalled());
    promiseFn.forEach(fn => expect(fn).not.toHaveBeenCalled());
  });
  it('should execute max 10 after one interval passed and autostart is true', () => {
    jest.useFakeTimers();
    const queue = new ThrottledQueue({
      interval: 1000,
      concurrency: 5
    });

    const promiseFn = [];

    for (let i = 0; i < 100; i += 1) {
      const fn = jest.fn();
      promiseFn.push(fn);
      queue.push(fn);
    }
    jest.advanceTimersByTime(1000);

    const called = promiseFn.splice(0, 10);
    called.forEach(fn => expect(fn).toHaveBeenCalled());
    promiseFn.forEach(fn => expect(fn).not.toHaveBeenCalled());
  });
  it('should execute max 10 on start if 1  time interval passed and autostart is false', () => {
    jest.useFakeTimers();
    const queue = new ThrottledQueue({
      interval: 1000,
      concurrency: 5,
      autostart: false
    });

    const promiseFn = [];

    for (let i = 0; i < 100; i += 1) {
      const fn = jest.fn();
      promiseFn.push(fn);
      queue.push(fn);
    }

    queue.start();
    jest.advanceTimersByTime(1000);

    const called = promiseFn.splice(0, 10);
    called.forEach(fn => expect(fn).toHaveBeenCalled());
    promiseFn.forEach(fn => expect(fn).not.toHaveBeenCalled());
  });
  it('should execute the max number of concurrent functions during start and autostart = false', () => {
    jest.useFakeTimers();
    const queue = new ThrottledQueue({
      interval: 1000,
      concurrency: 50,
      autostart: false
    });

    const promiseFn = [];

    for (let i = 0; i < 100; i += 1) {
      const fn = jest.fn();
      promiseFn.push(fn);
      queue.push(fn);
    }

    queue.start();
    promiseFn.splice(0, 50).forEach(fn => expect(fn).toHaveBeenCalled());
    promiseFn.forEach(fn => expect(fn).not.toHaveBeenCalled());
    jest.advanceTimersByTime(1000);
    promiseFn.splice(0, 50).forEach(fn => expect(fn).toHaveBeenCalled());
    promiseFn.forEach(fn => expect(fn).not.toHaveBeenCalled());
    expect(queue.queue).toBeEmpty();
  });
  it('should execute max concurrent  on start if 1  time interval passed and autostart is true', () => {
    jest.useFakeTimers();
    const queue = new ThrottledQueue({
      interval: 1000,
      concurrency: 25
    });

    const promiseFn = [];

    for (let i = 0; i < 75; i += 1) {
      const fn = jest.fn();
      promiseFn.push(fn);
      queue.push(fn);
    }
    promiseFn.splice(0, 25).forEach(fn => expect(fn).toHaveBeenCalled());
    promiseFn.forEach(fn => expect(fn).not.toHaveBeenCalled());
    jest.advanceTimersByTime(1000);
    promiseFn.splice(0, 25).forEach(fn => expect(fn).toHaveBeenCalled());
    promiseFn.forEach(fn => expect(fn).not.toHaveBeenCalled());
    jest.advanceTimersByTime(1000);
    promiseFn.splice(0, 25).forEach(fn => expect(fn).toHaveBeenCalled());
    promiseFn.forEach(fn => expect(fn).not.toHaveBeenCalled());
    jest.advanceTimersByTime(1000);
    promiseFn.splice(0, 25).forEach(fn => expect(fn).toHaveBeenCalled());
    promiseFn.forEach(fn => expect(fn).not.toHaveBeenCalled());

    expect(queue.queue).toBeEmpty();
  });
  it('should execute all functions on adding if concurrency not reached', () => {
    const queue = new ThrottledQueue({
      interval: 1000,
      concurrency: 500
    });

    const promiseFn = [];

    for (let i = 0; i < 100; i += 1) {
      const fn = jest.fn();
      promiseFn.push(fn);
      queue.push(fn);
    }

    const called = promiseFn.splice(0, 100);
    called.forEach(fn => expect(fn).toHaveBeenCalled());
    promiseFn.forEach(fn => expect(fn).not.toHaveBeenCalled());
  });
  it('should not execute all functions if concurrency reached while adding', () => {
    const queue = new ThrottledQueue({
      interval: 1000,
      concurrency: 50
    });

    const promiseFn = [];

    for (let i = 0; i < 100; i += 1) {
      const fn = jest.fn();
      promiseFn.push(fn);
      queue.push(fn);
    }
    const called = promiseFn.splice(0, 50);
    called.forEach(fn => expect(fn).toHaveBeenCalled());
    promiseFn.forEach(fn => expect(fn).not.toHaveBeenCalled());
  });
  it(
    'should drain all open queue functions per default, rejecting new additions during the draining time,' +
      '\nand properly propagating function errors',
    async () => {
      jest.useFakeTimers();
      const queue = new ThrottledQueue({
        interval: 1000,
        concurrency: 50
      });

      const promiseFn = [];
      const promiseResults = [];

      for (let i = 0; i < 101; i += 1) {
        const fn = jest.fn(async () => {
          return null;
        });
        promiseFn.push(fn);
        promiseResults.push(
          (async () => {
            try {
              await queue.push(fn);
              return 'resolved';
            } catch (error) {
              return error;
            }
          })()
        );
      }
      const error = new Error('whoopsie');
      promiseFn[100].mockImplementationOnce(async () => {
        throw error;
      });
      const endPromise = queue.end();
      let pushError;
      try {
        await queue.push(async () => {});
      } catch (err) {
        pushError = err;
      }
      jest.advanceTimersByTime(2000);
      await endPromise;
      expect(pushError.message).toEqual('Queue stopping, adding fn failed');
      const result = await Promise.all(promiseResults);
      promiseFn.splice(0, 101).forEach(fn => expect(fn).toHaveBeenCalled());
      // check if all function calls have been resolved
      result.splice(0, 100).forEach(elem => expect(elem).toEqual('resolved'));
      // check if an error from the queued function is properly propagated and does not break the throttled queue
      expect(result[0]).toEqual(error);
    }
  );
  it('should reject all open queue functions if delayed false on end', async () => {
    const queue = new ThrottledQueue({
      interval: 1000,
      concurrency: 50
    });

    const promiseResults = [];

    for (let i = 0; i < 100; i += 1) {
      const fn = jest.fn(async () => {
        return null;
      });
      promiseResults.push(
        (async () => {
          try {
            await queue.push(fn);
            return 'resolved';
          } catch (error) {
            return error;
          }
        })()
      );
    }
    await queue.end({ drain: false });
    const result = await Promise.all(promiseResults);
    result.splice(0, 50).forEach(elem => expect(elem).toEqual('resolved'));
    result.splice(0, 50).forEach(elem => {
      expect(elem).toBeInstanceOf(Error);
      expect(elem.message).toEqual('queue stopped, aborting!');
    });
  });
});
