import sanitizeHtml from 'sanitize-html';

// Sanitization options
const sanitizeOptions = {
  allowedTags: [], // No HTML tags allowed
  allowedAttributes: {}, // No attributes allowed
};

// Sanitize request body middleware
export const sanitizeBody = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeHtml(req.body[key], sanitizeOptions).trim();
      }
    });
  }
  next();
};

// Sanitize query parameters middleware
export const sanitizeQuery = (req, res, next) => {
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeHtml(req.query[key], sanitizeOptions).trim();
      }
    });
  }
  next();
};

// Sanitize specific fields
export const sanitizeFields = (fields) => {
  return (req, res, next) => {
    if (req.body) {
      fields.forEach(field => {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = sanitizeHtml(req.body[field], sanitizeOptions).trim();
        }
      });
    }
    next();
  };
};