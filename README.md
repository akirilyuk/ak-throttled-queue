# ak-throttled-queue

Throttled queue for node.js. Async functions only. No guarantee for sync functions.

## Example

```js
// autostart false

const ThrottledQueue = require('ak-throttled-queue');

const queue = new ThrottledQueue({
  interval: 1000,
  concurrency: 5,
  autostart: false
});

// note if autostart is false, you cannot await the fn execution if you are in the same scope since this will block
// this below wont work!

const result = await queue.push(async () => {
  return new Promise(resolve =>
    setTimeout(() => {
      resolve('resolved');
    }, 1000)
  );
});

queue.start();

// this will work

const resultPromise = queue.push(async () => {
  return new Promise(resolve =>
    setTimeout(() => {
      resolve('resolved');
    }, 1000)
  );
});

queue.start();

const result = await resultPromise;

// autostart true (default)

const queue = new ThrottledQueue({
  interval: 1000,
  concurrency: 5
});
// this will work

const result = await queue.push(async () => {
  return new Promise(resolve =>
    setTimeout(() => {
      resolve('resolved');
    }, 1000)
  );
});

// queue end with drain = true

const endPromise = queue.end();

// this will throw an error, because queue is in ending state
queue.push(async () => {});

await endPromise;

// this will work, since queue is clean and finished draining
queue.push(async () => {});

// queue end with drain = false (all queued functions will be rejected with an error
const queue = new ThrottledQueue({
  interval: 1000,
  concurrency: 5,
  autostart: false
});
const queueFnPromise = queue.push(async () => {});

await queue.end({ drain: false });

try {
  await queueFnPromise;
} catch (error) {
  console.log(error);
  // > Error: queue stopped, aborting!
}
```

# Commiting

The project uses commitlint so please follow the commit message guidelines there:

[commitlint](https://github.com/conventional-changelog/commitlint)

```bash
yarn commit # runs a commit promt with semver conform commit messages
```

# Workflow

## Adding new features/fixes

Create a PR with your code to the develop branch. Please take care that your PR title follows the [semantic message format](https://github.com/semantic-release/semantic-release#commit-message-format)

Once your PR is reviewed and approved, merge it via a SQUASH MERGE commit. Please take care that the title of your squash merge commit is
a valid semantic message format

## Releases

To trigger a new release simply create and merge a PR to the main branch.

CHANGED
