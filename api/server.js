let handler;
try {
  handler = require('../backend/src/app');
} catch (err) {
  handler = (req, res) => {
    res.status(500).json({ error: 'Function load failed', detail: err.message });
  };
}
module.exports = handler;
