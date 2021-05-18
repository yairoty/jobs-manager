
const { JOB_STATUS } = require('../utils/constants');
const cronParser = require('cron-parser');

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
};

function validateJob(schema) {
    // TODO add schema validation middleware    
    if (!schema.commandName || !schema.moduleName) {
        throw 'missing job args';
    }
}

function isValidStatus(status) {
    return Object.values(JOB_STATUS).includes(status);
}

function validateMetadata(schema) {
    // TODO add schema validation middleware    
    if (!schema.maxJobRun) {
        throw 'missing meta args';
    }
}
function sortByNextRunDate(a, b) {
    if (a.nextRunDate === null && b.nextRunDate === null) {
        return a.creationDate < b.creationDate ? -1 : 1;
    }

    if (a.nextRunDate === null) {
        return -1;
    }

    if (a.nextRunDate === b.nextRunDate) {
        return 0;
    }

    return a.nextRunDate < b.nextRunDate ? 1 : -1;
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

function isRunningJob(job) {
    return job.status === JOB_STATUS.RUNNING;
}

function isPendingJob(job) {
    return job.status === JOB_STATUS.PENDING;
}

function getStatusData(job) {
    return {
        commandName: job.commandName,
        moduleName: job.moduleName,
        status: job.status,
        nextRunDate: job.nextRunDate,
        id: job.uid
    }
};


module.exports = {
    Job,
    validateJob,
    isValidStatus,
    validateMetadata,
    sortByNextRunDate,
    calcNextRunDate,
    isRunningJob,
    isPendingJob,
    getStatusData
}