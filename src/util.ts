export const map = <T, Y>(
  array: T[],
  callback: (item: T, index: number) => Y,
): Y[] => {
  const l = array.length;
  const output = new Array<Y>(l);

  for (let i = 0; i < l; i++) {
    output[i] = callback(array[i], i);
  }

  return output;
};

export const filter = <T>(
  array: T[],
  callback: (item: T, index: number) => unknown,
): T[] => {
  const output: T[] = [];

  for (let i = 0, l = array.length; i < l; i++) {
    const item = array[i];

    if (callback(item, i)) {
      output.push(item);
    }
  }

  return output;
};

export const every = <T>(
  array: T[],
  callback: (item: T, index: number) => unknown,
): boolean => {
  for (let i = 0, l = array.length; i < l; i++) {
    if (!callback(array[i], i)) {
      return false;
    }
  }

  return true;
};

export const forEach = <T>(
  array: T[],
  callback: (item: T, index: number) => void,
): void => {
  for (let i = 0, l = array.length; i < l; i++) {
    callback(array[i], i);
  }
};

export const some = <T>(
  array: T[],
  callback: (item: T, index: number) => unknown,
): boolean => {
  for (let i = 0, l = array.length; i < l; i++) {
    if (callback(array[i], i)) {
      return true;
    }
  }

  return false;
};
