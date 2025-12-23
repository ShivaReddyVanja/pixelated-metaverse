// This file is needed to bypass ESM issues with jose library during tests
// We mock @shared/jwt to avoid loading jose altogether
export { };
