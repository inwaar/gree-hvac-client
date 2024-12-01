const winston = require('winston');
const util = require('util');

const { version } = require('../package.json');

const formats = {
    print: winston.format.printf(info => {
        const time = `[${info.timestamp} ${info.ms}]`;
        const service = info.service.toUpperCase();
        const line = `${time} ${info.level} ${service}:${info.version}>`;

        if (Object.keys(info.metadata).length > 0) {
            const meta = util.inspect(info.metadata, {
                colors: true,
                compact: 1,
                depth: 5,
            });

            return `${line} ${info.message} \n${meta}`;
        }

        return `${line} ${info.message}`;
    }),
    vscode: winston.format.printf(info =>
        Object.fromEntries(Object.entries(info))
    ),
};

const env = process.env.NODE_ENV;
const isDevelopment = env === 'development';
const isTest = env === 'test';

const createLogger = level =>
    winston.createLogger({
        level,
        defaultMeta: { version, pid: process.pid },
        silent: isTest,
        transports: [
            new winston.transports.Console({
                forceConsole: true,
                stderrLevels: ['error'],
                consoleWarnLevels: ['warn'],
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.ms(),
                    winston.format.metadata({
                        fillExcept: [
                            'timestamp',
                            'ms',
                            'level',
                            'message',
                            'service',
                            'sid',
                            'cid',
                            'pid',
                            'version',
                        ],
                    }),
                    ...(isDevelopment
                        ? [formats.vscode]
                        : [winston.format.colorize(), formats.print])
                ),
            }),
        ],
    });

module.exports = {
    createLogger,
};
