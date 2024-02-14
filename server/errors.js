const write_to_console = true;

const LogLevels = Object.freeze({
  INFO: 0,
  WARN: 1,
  ERROR: 2
});

class Logging {
  constructor() {

  }

  static handleError(err, res) {
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
  
  /** sends a response to the client with the code and data (data can be null)
   * and logs the message if flags are set
   * 
   * TODO: need to implement flags
   * @param {Response} res - the response object
   * @param {number} code - the status code to send to the client
   * @param {any} data - the data to send to the client
   * @param {string} function_name - the name of the function that called this
   * @param {string} message - the message to log
   * @param {number} level - the level of the message
   */
  static handleResponse(res, code, data=null, function_name, message="", level=LogLevels.INFO) {
    if (data) {
      res.status(code).send(data);
    } else {
      res.sendStatus(code);
    }
  
    if (write_to_console) {
      console.log("(" + function_name + ") " + message);
    }
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

// exports.handleError = handleError;
// exports.handleResponse = handleResponse;
exports.FirebaseError = FirebaseError;
exports.UserError = UserError;
exports.LogLevels = LogLevels;
exports.Logging = Logging;