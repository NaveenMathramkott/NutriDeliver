export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};
