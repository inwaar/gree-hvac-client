/**
 * @class
 * @augments Error
 */
class ClientError extends Error {
    /**
     * @param {string} message
     * @param {Error|undefined} origin
     * @param {Object<string, unknown>} props
     */
    constructor(message, origin, props) {
        super(message);
        this.message = message;
        this.origin = origin;
        this.props = props;
    }
}

/**
 * Connectivity problems while communicating with HVAC
 *
 * @class
 * @augments ClientError
 */
class ClientSocketSendError extends ClientError {
    /**
     * @param {Error} cause
     */
    constructor(cause) {
        super(cause.message, cause);
    }
}

/**
 * The message received from HVAC cannot be parsed
 *
 * @class
 * @augments ClientError
 */
class ClientMessageParseError extends ClientError {
    /**
     * @param {Error} cause
     * @param {Object<string, unknown>} props
     */
    constructor(cause, props) {
        super(
            `Can not parse device JSON response (${cause.message})`,
            cause,
            props
        );
    }
}

/**
 * The package from the message received from HVAC cannot be decrypt
 *
 * @class
 * @augments ClientError
 */
class ClientMessageUnpackError extends ClientError {
    /**
     * @param {Error} cause
     * @param {Object<string, unknown>} props
     */
    constructor(cause, props) {
        super(`Can not decrypt message (${cause.message})`, cause, props);
    }
}

/**
 * A message having an unknown format was received from HVAC
 *
 * @class
 * @augments ClientError
 */
class ClientUnknownMessageError extends ClientError {
    /**
     * @param {Object<string, unknown>} props
     */
    constructor(props) {
        super('Unknown message type received', props);
    }
}

/**
 * Request operations on not connected to the HVAC client
 *
 * @class
 * @augments ClientError
 */
class ClientNotConnectedError extends ClientError {
    constructor() {
        super('Client is not connected to the HVAC');
    }
}

/**
 * @class
 * @augments ClientError
 */
class ClientConnectTimeoutError extends ClientError {
    constructor() {
        super('Connecting to HVAC timed out');
    }
}

/**
 * Connecting was cancelled by calling disconnect
 *
 * @class
 * @augments ClientError
 */
class ClientCancelConnectError extends ClientError {
    constructor() {
        super('Connecting to HVAC was cancelled');
    }
}

module.exports = {
    ClientError,
    ClientNotConnectedError,
    ClientConnectTimeoutError,
    ClientCancelConnectError,
    ClientSocketSendError,
    ClientMessageParseError,
    ClientMessageUnpackError,
    ClientUnknownMessageError,
};
