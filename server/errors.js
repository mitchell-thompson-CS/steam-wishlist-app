
function handleError(err, res) {
  switch (err.name) {
    case 'FirebaseError':
      res.status(500).send(err.message);
      break;
    case 'UserError':
        res.status(401).send(err.message);
        break;
    default:
      res.status(500).send('An error occurred');
      break;
  }
}

class FirebaseError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'FirebaseError';
  }
}

class UserError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'UserError';
  }
}

exports.handleError = handleError;
exports.FirebaseError = FirebaseError;
exports.UserError = UserError;