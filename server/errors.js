let write_to_console = process.argv.includes("--verbose") ? true : false || process.argv.includes("-v") ? true : false;

const LogLevels = Object.freeze({
  INFO: 0,
  WARN: 1,
  ERROR: 2
});

class Logging {
  /** handles an error and sends the appropriate status code to the client
   * @param {Error} err - the error to handle
   * @param {Response} res - the response object, used to send the status code to the client
   */
  static handleError(err, res) {
    let function_name = "handleError";

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
  
        if (!res.headersSent) {
          res.sendStatus(500);
        }
        break;
    }

    this.log(function_name, err, LogLevels.ERROR);
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
  
    if (write_to_console || level === LogLevels.ERROR) {
      console.log("(" + function_name + ") " + message);
    }
  }

  /** logs a message
   * @param {string} function_name - the name of the function that called this
   * @param {any} message - the message to log
   * @param {number} level - the level of the message
   */
  static log(function_name, message, level=LogLevels.INFO) {
    if (write_to_console || level === LogLevels.ERROR) {
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