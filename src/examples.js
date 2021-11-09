const ThrottledQueue = require('./index');

const delay = ms => {
  return new Promise(resolve =>
    setTimeout(() => {
      resolve();
    }, ms)
  );
};

(async () => {
  const queue = new ThrottledQueue({
    interval: 1000,
    concurrency: 5,
    autostart: true
  });

  const start = Date.now();

  for (let i = 0; i < 4; i += 1) {
    queue.push(
      async () =>
        new Promise(resolve =>
          setTimeout(() => {
            console.log(Date.now() - start);
            resolve();
          }, 10)
        )
    );
  }

  await delay(200);

  queue.push(
    async () =>
      new Promise(resolve =>
        setTimeout(() => {
          console.log(Date.now() - start);
          resolve();
        }, 10)
      )
  );

  for (let i = 0; i < 5; i += 1) {
    queue.push(
      async () =>
        new Promise(resolve =>
          setTimeout(() => {
            console.log(Date.now() - start);
            resolve();
          }, 10)
        )
    );
  }
})();
