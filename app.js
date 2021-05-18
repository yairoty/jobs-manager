const chalk = require("chalk");
const cron = require('node-cron');
const express = require('express');
const { init: initJob, ticker } = require('./controller/job');
const { router: jobRouter } = require('./router/job');
const app = express();
const port = process.env.PORT || 3000;
const cronTime = process.env.CRON_TIME || '*/10 * * * * *';

// middlewares
app.use(express.json());
app.use(logApiCalls);
app.use('/job', jobRouter);

function logApiCalls(req, res, next) {
    // TODO add logs
    console.log(`[Incoming API]`,
        `${req.method}`,
        `path=${req.path},`,
        `params=${JSON.stringify(req.params)},`,
        `${['POST', 'PUT'].includes(req.method) ? `body=${JSON.stringify(req.body)}` : ''}`,
        `Time:=${Date.now()} `);

    next();
}

app.listen(port, (err) => {
    if (err) {
        console.error(chalk.red.bold('server Error:'), err);
    };
    console.log(chalk.green(`Server on ${port}`));

    initJob()
        .then(() => {
            cron.schedule(cronTime, ticker);
            console.log(chalk.green('Scheduler ticks...'));
        }).catch((err) => {
            console.error(chalk.red.bold('error: '), err.message, err.stack);
        });

});

process.on('unhandledRejection', err => {
    console.log(chalk.red.bold('UNHANDLED REJECTION! Shutting down...'), err.message, err.stack);
    process.exit(1);
});
