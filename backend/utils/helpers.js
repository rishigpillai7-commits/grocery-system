const { AppError } = require('../middleware/errorHandler');

// Copy only whitelisted keys from the request body (protects against mass-assignment).
const pick = (obj = {}, keys = []) =>
  keys.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) acc[key] = obj[key];
    return acc;
  }, {});

// Parse and validate a numeric route/query id.
const parseId = (value, label = 'id') => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) throw new AppError(400, `Invalid ${label}`);
  return n;
};

const toNumber = (value) => Number(value);

module.exports = { pick, parseId, toNumber };
