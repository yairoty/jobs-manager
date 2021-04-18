const chalk = require("chalk");
const cronParser = require('cron-parser');
const PCancelable = require('p-cancelable');
const db = require('../db/db');
const { JOB_STATUS } = require('../utils/constants');

class Job {
    constructor(moduleName, commandName, cronTime, onCancel) {
        this.commandName = commandName; // mandatory
        this.moduleName = moduleName; // mandatory
        this.cronTime = cronTime; // optional        
        this.onCancel = onCancel; // optional
        this.singleRun = !Boolean(cronTime);
        this.creationDate = Date.now();
        this.lastRunDate = null;
        this.nextRunDate = null;
        this.status = JOB_STATUS.PENDING;
        this.uid = null;
        this.logicalId = commandName.toString() + '_' + moduleName.toString();
    }
}

let MAX_JOB_RUN = null;
const cancelRunningJobManger = {
    list: [],
    add: function (id, onCancel) {
        this.list.push({
            id,
            onCancel
        });
    },
    remove: function (id) {
        this.list = this.list.filter(i => i.id !== id);
    },
    cancel: async function (id) {
        const target = this.list.find(i => i.id === id);
        if (target)
            await target.onCancel();

        this.remove(id);
    }
};

async function init() {
    await syncMaxJobRun();
}

async function syncMaxJobRun() {
    if (MAX_JOB_RUN === null) {
        const meta = await db.readMeta();
        MAX_JOB_RUN = meta[0].maxJobRun;
    }
}

function validateJob(schema) {
    // TODO add schema validation middleware    
    if (!schema.commandName || !schema.moduleName)
        throw 'missing job args';
}

function validateMetadata(schema) {
    // TODO add schema validation middleware    
    if (!schema.maxJobRun)
        throw 'missing meta args';
}

function isValidStatus(status) {
    return Object.values(JOB_STATUS).includes(status);
}

async function updateMeta(newMeta) {
    await validateMetadata(newMeta);

    await db.updateMeta(newMeta);

    if (newMeta.maxJobRun && Number.isInteger(newMeta.maxJobRun))
        MAX_JOB_RUN = newMeta.maxJobRun;

    return { maxJobRun: newMeta.maxJobRun }
}

async function ticker() {
    const sortByNextRunDate = (a, b) => {
        if (a.nextRunDate === null && b.nextRunDate === null)
            return a.creationDate < b.creationDate ? -1 : 1;

        if (a.nextRunDate === null)
            return -1;

        if (a.nextRunDate === b.nextRunDate)
            return 0;

        return a.nextRunDate < b.nextRunDate ? 1 : -1;
    }
    const jobsList = await db.readNextRunDateJobs();
    const runningJobs = jobsList.filter(job => job.status === JOB_STATUS.RUNNING);
    const runningSlots = MAX_JOB_RUN - runningJobs.length;
    const pendingJobsSorted = jobsList.filter(job => job.status === JOB_STATUS.PENDING)
        .sort(sortByNextRunDate);

    console.log(`[ticker] found ${pendingJobsSorted.length} pending jobs.`);

    if (pendingJobsSorted.length === 0) {
        return;
    }
    if (runningSlots === 0) {
        console.log(`[ticker] no slots available for ${pendingJobsSorted.length} jobs.`);
        return;
    }

    const nextJobs = pendingJobsSorted.splice(0, runningSlots);
    console.log(`[ticker] start running ${nextJobs.length} jobs.`);
    for (let job of nextJobs) {

        // update job
        let jobUpdate = {
            status: JOB_STATUS.RUNNING,
            nextRunDate: Boolean(job.cronTime) ? calcNextRunDate(job.cronTime) : null
        }
        await db.updateJob(job.uid, Object.assign({}, job, jobUpdate));

        // run job
        try {
            let modulePath = require.resolve(`../${job.moduleName}.js`);
            let targetModule = require(modulePath);
            let targetFn = targetModule[job.commandName];

            new PCancelable((resolve, reject, onCancel) => {
                targetFn()
                    .then(async () => {
                        await onJobFinish(job.uid);
                    }).catch(async (err) => {
                        console.error(`[ticker] ${job.uid}`, chalk.red(`Error`), err);
                        await onJobError(job.uid);
                    });

                // add to cancel list
                cancelRunningJobManger.add(job.uid, onCancel);                
            });
        } catch (err) {
            console.error(`[ticker] ${job.uid}`, chalk.red(`Error`), err);
            onJobError(job.uid);
        }
    }
}

async function createJob(job) {
    validateJob(job);
    const newJob = new Job(job.moduleName, job.commandName, job.cronTime, job.onCancel);
    await db.createJob(newJob);
    return newJob;
}

async function deleteJob(uid) {
    if (!uid)
        throw Error('missing args');
    return db.deleteJob(uid);
}

async function updateJobStatus(uid, status) {
    if (!uid || !status || !isValidStatus(status))
        throw 'invalid args';

    return db.updateJob(uid, status);
}

async function getAllJobs() {
    return db.readJob();
}

async function getJobStatus(uid) {
    const getStatusData = (job) => {
        return {
            commandName: job.commandName,
            moduleName: job.moduleName,
            status: job.status,
            nextRunDate: job.nextRunDate,
            id: job.uid
        }
    };

    if (uid) {
        const job = await db.readJob(uid);
        return getStatusData(job);
    }

    const jobList = await getAllJobs();
    return jobList.map(getStatusData);
}

async function cancelJob(uid) {
    try {
        const jobUpdate = {
            status: JOB_STATUS.CANCEL
        }

        // update record as canceled
        await db.updateJob(uid, jobUpdate);

        //cancel inprogress process
        await cancelRunningJobManger.cancel(uid);

        // fire rollback function
        const job = await db.readJob(uid);
        if (job.onCancel) {
            const modulePath = require.resolve(`../${job.moduleName}.js`);
            const targetModule = require(modulePath);
            const rollbackFn = targetModule[job.onCancel];
            await rollbackFn();
        }
    } catch (err) {
        console.error('[cancelJob]', chalk.red('failed'), err);
        throw err;
    }

}

async function updateJobsMax(newMaxValue) {
    await db.updateMeta(newMaxValue)
    MAX_JOB_RUN = newMaxValue; // update in memory value
}

async function onJobFinish(uid) {
    const job = await db.readJob(uid);
    const data = {
        status: JOB_STATUS.PENDING,
        lastRunDate: Date.now(),
        nextRunDate: calcNextRunDate(job.cronTime)
    }

    if (job.singleRun)
        data.status = JOB_STATUS.FINISHED;

    await db.updateJob(uid, Object.assign({}, job, data));
    cancelRunningJobManger.remove(uid);
}

async function onJobError(uid) {
    console.error(`[onJobError] uid=${uid}`, chalk.red('Error'));

    const jobUpdate = {
        status: JOB_STATUS.FAILED,
        lastRunDate: Date.now()
    }

    await db.updateJob(uid, jobUpdate);
    await cancelRunningJobManger.cancel(uid);
}

function calcNextRunDate(cronTime) {
    try {
        const interval = cronParser.parseExpression(cronTime);
        return interval.next().getTime();
    } catch (err) {
        console.error('[calcNextRunDate] failed', err);
        throw err;
    }
}

module.exports = {
    init,
    updateMeta,
    ticker,
    createJob,
    deleteJob,
    getJobStatus,
    updateJobStatus,
    updateJobsMax,
    getAllJobs,
    cancelJob
};