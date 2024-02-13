
function handleError(err, res) {
  switch (err.name) {
    case 'FirebaseError':
      res.sendStatus(500);
      break;
    case 'UserError':
        res.sendStatus(401);
        break;
    default:

      // not an error we created, so lets check firebase errors next
      switch (err.code) {
        case 5:
          // NOT_FOUND error
          res.sendStatus(400);
          break;
        default:
          res.sendStatus(500);
          break;
      }

      console.log(err);

      if (!res.headersSent) {
        res.status(500);
      }
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