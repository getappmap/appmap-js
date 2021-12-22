var path = require("path");

/**
 * GET /api/kgilpin@gmail.com/sample_app_6th_ed/finding_status
 *
 * authorization: Bearer a2dpbHBpbkBnbWFpbC5jb206NzU4Y2NmYTYtNjYwNS00N2Y0LTgxYWUtNTg2MmEyY2M0ZjY5
 * accept: application/json
 * host: localhost:3001
 * connection: close
 */

module.exports = function (req, res) {
  res.statusCode = 200;

  res.setHeader("date", "Wed, 22 Dec 2021 22:23:32 GMT");
  res.setHeader("connection", "close");
  res.setHeader("x-frame-options", "SAMEORIGIN");
  res.setHeader("x-xss-protection", "1; mode=block");
  res.setHeader("x-content-type-options", "nosniff");
  res.setHeader("x-download-options", "noopen");
  res.setHeader("x-permitted-cross-domain-policies", "none");
  res.setHeader("referrer-policy", "strict-origin-when-cross-origin");
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("vary", "Accept, Origin");
  res.setHeader("etag", "W/\"451c3da19f5880f45b2321051b08c38e\"");
  res.setHeader("cache-control", "max-age=0, private, must-revalidate");
  res.setHeader("x-request-id", "0e463024-636d-4f3a-8f5c-f7dc1cd3779a");
  res.setHeader("x-runtime", "0.030516");

  res.setHeader("x-yakbak-tape", path.basename(__filename, ".js"));

  res.write(new Buffer("W3siYXBwX2lkIjozNSwiaWRlbnRpdHlfaGFzaCI6ImNkMTcwMTljMTA1ZmNiZTU0NDQ2ZTY4YzYxODU2MjVkZWU4YzU2NWQ5OGUxYjg0NDQ2OTNlMmUxNGIzNjk2MDkiLCJzdGF0dXMiOiJkZWZlcnJlZCJ9LHsiYXBwX2lkIjozNSwiaWRlbnRpdHlfaGFzaCI6IjkyZjcyZGJhYzBlZjEzNDgxMDRmMzY2OWNmOTcxNzRjNzA0YjJiZmExZGI5ODA1NDU1OTEyN2Q1NmY4YzY4MWEiLCJzdGF0dXMiOiJkZWZlcnJlZCJ9LHsiYXBwX2lkIjozNSwiaWRlbnRpdHlfaGFzaCI6IjBlOWU0MGIwMWE1ZTZmNzQzZjhhNGI2NDdiMjRlODYxMjI0ZTg3YzU1NWFjZjZhNzg4OTMwMjNkMjIyZDJmNDEiLCJzdGF0dXMiOiJuZXcifSx7ImFwcF9pZCI6MzUsImlkZW50aXR5X2hhc2giOiIzZDM3OTE3MDk0YzY1M2E3MDdkN2EwNDkzODFlOTQ2NzA5NzQ0MWQ2YjMwMzc2ODZhMzFmYWZjNWQ3MDQyZGQ2Iiwic3RhdHVzIjoiZGVmZXJyZWQifSx7ImFwcF9pZCI6MzUsImlkZW50aXR5X2hhc2giOiI1NTYzNGQyYjFkNDNhNDk3YzNjOWY4NjEwYWQwZGI1YWU2YWQ0NzA5NmQ1ZmYzMzQyMjMwNjhlOWYyNzYyNWM4Iiwic3RhdHVzIjoibmV3In0seyJhcHBfaWQiOjM1LCJpZGVudGl0eV9oYXNoIjoiMjZjODEzOGYwZDU1NmQ4ODY5MTFjY2MyMjdjZThmMWYxMmM5MTk4NTJmNWE4OWI4NDZiNjI3MWY1Yzg3NmE1NSIsInN0YXR1cyI6Im5ldyJ9LHsiYXBwX2lkIjozNSwiaWRlbnRpdHlfaGFzaCI6IjMxODg0YjkyMDhlOGRiMTJlYzcxNGNlNDkwZDFmMjllMjQzMDQ1OTMwM2FkOGUyOTFkMWJkZWVkZDIwYTdhZjkiLCJzdGF0dXMiOiJuZXcifSx7ImFwcF9pZCI6MzUsImlkZW50aXR5X2hhc2giOiIzMjkyYzdlODdiZDI1OGQ0ODAyMzk2NmYwZmFmMDA1YWM4Mjk3NWIwZGZiNDVhODEyYjEwYmVlZDdmNGJhZmNhIiwic3RhdHVzIjoiZGVmZXJyZWQifV0=", "base64"));
  res.end();

  return __filename;
};
