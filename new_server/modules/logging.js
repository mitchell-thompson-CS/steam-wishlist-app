let write_to_console = process.argv.includes("--verbose") ? true : false || process.argv.includes("-v") ? true : false;

const LogLevels = Object.freeze({
  INFO: 0,
  WARN: 1,
  ERROR: 2
});

const LogLevelsStrings = Object.freeze({
  0: "INFO",
  1: "WARN",
  2: "ERROR"
});

class Logging {  
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
    if (res.headersSent) {
      this.log(function_name, "Response already sent", LogLevels.ERROR);
    } else {
      if (data) {
        res.status(code).send(data);
      } else {
        res.sendStatus(code);
      }
      
      this.log(function_name, message, level);
    }
  }

  /** logs a message
   * @param {string} function_name - the name of the function that called this
   * @param {any} message - the message to log
   * @param {number} level - the level of the message
   */
  static log(function_name, message, level=LogLevels.INFO) {
    if ((write_to_console || level !== LogLevels.INFO || process.env.NODE_ENV === "test-dev") && process.env.NODE_ENV !== "test") {
      console.log("(" + LogLevelsStrings[level] + ")(" + function_name + ") " + message);
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