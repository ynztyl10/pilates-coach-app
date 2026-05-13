exports.handler = (req, resp, context) => {
  try {
    const path = req.path || '/';
    resp.setStatusCode(200);
    resp.setHeader('Content-Type', 'application/json');
    resp.send(JSON.stringify({
      ok: true,
      path: path,
      method: req.method,
      hasBody: !!req.body,
      bodyType: typeof req.body,
    }));
  } catch (err) {
    resp.setStatusCode(500);
    resp.setHeader('Content-Type', 'application/json');
    resp.send(JSON.stringify({ error: err.message, stack: err.stack }));
  }
};
