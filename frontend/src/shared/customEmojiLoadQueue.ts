type CustomEmojiLoadTask<T> = () => Promise<T>;

let customEmojiLoadTail: Promise<void> = Promise.resolve();

export const enqueueCustomEmojiLoadTask = <T>(
  task: CustomEmojiLoadTask<T>,
): Promise<T> => {
  const result = customEmojiLoadTail.then(task, task);
  customEmojiLoadTail = result.then(
    () => undefined,
    () => undefined,
  );

  return result;
};

export const waitForNextPaint = (): Promise<void> =>
  new Promise((resolve) => {
    if (typeof requestAnimationFrame !== "function") {
      setTimeout(resolve, 0);
      return;
    }

    let settled = false;
    const timeoutId = setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      resolve();
    }, 120);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(timeoutId);
        resolve();
      });
    });
  });
