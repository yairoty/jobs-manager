const { v4: uuidv4 } = require('uuid');

const testJobs = [{
    commandName: 'test1',
    moduleName: 'tests/moduleA',
    cronTime: '*/10 * * * * *',
    onCancel: null,
    singleRun: false,
    creationDate: 1,
    lastRunDate: null,
    nextRunDate: null,
    status: 'pending',
    uid: '6be02932-4066-41ea-9fe2-001832771a00',
    logicalId: 'test1../moduleA'
}, {
    commandName: 'test2_timeoutJob',
    moduleName: 'tests/moduleA',
    cronTime: '*/10 * * * * *',
    onCancel: null,
    singleRun: false,
    creationDate: 2,
    lastRunDate: null,
    nextRunDate: null,
    status: 'pending',
    uid: '6be02932-4066-41ea-9fe2-001832771a01',
    logicalId: 'test2_timeoutJob../moduleA'
}, {
    commandName: 'test3_errorJob',
    moduleName: 'tests/moduleA',
    cronTime: '*/10 * * * * *',
    onCancel: null,
    singleRun: false,
    creationDate: 3,
    lastRunDate: null,
    nextRunDate: null,
    status: 'pending',
    uid: '6be02932-4066-41ea-9fe2-001832771a02',
    logicalId: 'test3_errorJob../moduleA'
}]

// db instance in memory
const dbInstance = {
    jobs: [],
    meta: [{
        maxJobRun: 5 // default 5
    }]
}

function printDbState(showFull) {
    return;
    // display the in-memory db
    if (showFull) {
        console.log('\nDB STATUS:', dbInstance.jobs);
        return;
    }

    console.log('\nDB STATUS:', dbInstance.jobs.map(i => {
        return {
            moduleName: i.moduleName,
            commandName: i.commandName,
            status: i.status,
            cronTime: i.cronTime,
            nextRunDate: i.nextRunDate
        }
    }));
}

async function createJob(job) {
    const newJob = Object.assign({}, job, { uid: uuidv4() });
    dbInstance.jobs.push(newJob);
}

async function readJob(uid) {
    if (uid)
        return dbInstance.jobs.filter(job => job.uid === uid)[0];

    return dbInstance.jobs;
}

async function updateJob(uid, newJob) {
    for (let job of dbInstance.jobs) {
        if (job.uid === uid) {
            Object.assign(job, newJob);
            break;
        }
    }
}

async function deleteJob(uid) {
    const data = dbInstance.jobs.filter(job => job.uid !== uid);
    dbInstance.jobs = data;
}

async function readNextRunDateJobs() {
    return dbInstance.jobs.filter(job => {
        if (!job.nextRunDate) // init run jobs
            return true;

        return job.nextRunDate < Date.now();
    });
}

// TODO move meta to new db.file
async function readMeta() {
    return dbInstance.meta
}

async function updateMeta(newMeta) {
    Object.assign(dbInstance.meta, newMeta)
}

module.exports = {
    createJob,
    readJob,
    readNextRunDateJobs,
    updateJob,
    deleteJob,
    readMeta,
    updateMeta
}