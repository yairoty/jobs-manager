const express = require('express');
const jobCtrl = require('../controller/job');
const { JOB_STATUS } = require('../utils/constants');
const router = express.Router();


router.route('/')
    .get(async (req, res) => {
        const jobs = await jobCtrl.getAllJobs();

        return res.json(jobs);
    })
    .post(async (req, res) => {
        const newJob = await jobCtrl.createJob(req.body);

        return res.json(newJob);
    })
    .delete(async (req, res) => {
        await jobCtrl.deleteJob(req.params.id);
        res.send('deleted successfully');
    });

router.route('/status')
    .get(async (req, res) => {
        const jobStatus = await jobCtrl.getJobStatus(req.params.id)

        return res.json(jobStatus);
    })
    .put(async (req, res) => { // TODO do we need this ?
        const uid = req.params.id;
        const status = req.params.status;

        await jobCtrl.updateJobStatus(uid, status);

        return res.send('updated successfully');
    });

router.route('/maxRun').put(async (req, res) => {
    await jobCtrl.updateMeta(req.body.maxRun);

    return res.send('updated successfully');
});

module.exports = { router };

// new Job:
// curl -X POST -H "Content-Type: application/json" \
//     -d '{"commandName": "test2", "moduleName": "./moduleA", "cronTime": "* */1 * * * *"}' \
//     localhost:3000/job


