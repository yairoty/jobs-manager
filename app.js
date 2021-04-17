// task desc:
// CRON jobs 
// each job feedback its state (paused, pending, running, finidshed/failed => date ?)
// single run support (no CRON use)
// max running jobs (default 5)
// uniqueu identifier same uid cannot run at the same time
// cancel job inprogress with cleanup   
// API for jobs status

// db  => in memory
// test


// Job entity: 
// CRON time OR singleTIme run 
// onRun function callback
// onCancel function callback

// creation date
// last run date
// status PENDING RUNNING FAILED PAUSED FINISHED(single run)
// uid
// logicalId = onRun function


// app API's:
// registerJob(Job)
// cancelJob(uid)
// removeJob(uid)
// getJobStatus(null/uid)
// updateJobStatus(uid, status)
// updateMaxJobRun(max)


// app db:
// updateMaxJobsRun

// createJob
// readJob(null/uid)
// readJobsByDate(minDate)
// updateJob(uid, Job)
// deleteJob    


// cron process (cron middleware)
// wakeup every sec
// get filtered tasks for running (nextRunningTs + status + MAX_RUNNING_JOBS)
// run the jobs
// update nextRunningTs
// on error -> update error + cleanupFn

// test : test func trust timeing
// test tasks as REST calls

const chalk = require( "chalk" );
const cron = require('node-cron');
const express = require('express');
const { init: initBl, ticker } = require('./controller/job');
const { router:jobRouter } = require('./router/job');
const app = express();
const port = process.env.PORT || 3000;
const cronTime = process.env.CRON_TIME || '*/10 * * * * *';

// middlewares
app.use(express.json());
app.use(logApiCalls)
app.use('/job', jobRouter);

function logApiCalls(req, res, next) {
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

    initBl()
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
