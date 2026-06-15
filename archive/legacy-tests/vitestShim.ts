import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
  test,
} from "@jest/globals";

export const vi = {
  fn: jest.fn.bind(jest),
  mock: jest.mock.bind(jest),
  spyOn: jest.spyOn.bind(jest),
  mocked: jest.mocked.bind(jest),
  clearAllMocks: jest.clearAllMocks.bind(jest),
  restoreAllMocks: jest.restoreAllMocks.bind(jest),
  resetAllMocks: jest.resetAllMocks.bind(jest),
  useFakeTimers: jest.useFakeTimers.bind(jest),
  useRealTimers: jest.useRealTimers.bind(jest),
  advanceTimersByTime: jest.advanceTimersByTime.bind(jest),
  setSystemTime: jest.setSystemTime.bind(jest),
};

export { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest, test };
