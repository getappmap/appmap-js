'use strict';

const colors = require('ansi-colors');
const exec = require('child_process').exec;

module.exports = (command) => {
    return new Promise((resolve, reject) => {
        console.log(`Executing command '${colors.yellow(command)}'`);
        const childProcess = exec(command, {maxBuffer: Number.MAX_SAFE_INTEGER}, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
        childProcess.stdout.pipe(process.stdout);
        childProcess.stderr.pipe(process.stderr);
    });
};