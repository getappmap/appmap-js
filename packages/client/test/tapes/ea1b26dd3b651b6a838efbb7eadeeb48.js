var path = require("path");

/**
 * GET /api/appmaps
 *
 * authorization: Bearer a2dpbHBpbkBnbWFpbC5jb206NzU4Y2NmYTYtNjYwNS00N2Y0LTgxYWUtNTg2MmEyY2M0ZjY5
 * accept: application/json
 * host: localhost:3001
 * connection: close
 */

module.exports = function (req, res) {
  res.statusCode = 422;

  res.setHeader("date", "Wed, 22 Dec 2021 22:18:45 GMT");
  res.setHeader("connection", "close");
  res.setHeader("x-frame-options", "SAMEORIGIN");
  res.setHeader("x-xss-protection", "1; mode=block");
  res.setHeader("x-content-type-options", "nosniff");
  res.setHeader("x-download-options", "noopen");
  res.setHeader("x-permitted-cross-domain-policies", "none");
  res.setHeader("referrer-policy", "strict-origin-when-cross-origin");
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("vary", "Accept, Origin");
  res.setHeader("cache-control", "no-cache");
  res.setHeader("x-request-id", "4318212d-bc81-49c5-a95f-34f1e25843cd");
  res.setHeader("x-runtime", "0.028833");

  res.setHeader("x-yakbak-tape", path.basename(__filename, ".js"));

  res.write(new Buffer("eyJlcnJvciI6eyJjb2RlIjoiaW52YWxpZCIsInRhcmdldCI6InNlYXJjaCIsIm1lc3NhZ2UiOiJtYXBzZXRzIGFyZSByZXF1aXJlZCJ9fQ==", "base64"));
  res.end();

  return __filename;
};
