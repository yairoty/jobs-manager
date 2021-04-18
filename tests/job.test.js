const jobCtrl = require('../controller/job');

const initDb = () => console.log('db init');
const cleanupDb = () => console.log('db cleanupDb');

// afterAll(() => initDb());
// beforeAll(() => cleanupDb());

describe('update metadata', () => {
    test('should failed update metadata with invalid params', async () => {
        const inValidMeta = { invalidArg: 1 }
        await expect(jobCtrl.updateMeta(inValidMeta)).rejects.toMatch('missing meta args');
    });

    test('should update metadata with valid params', async () => {
        const validMeta = { maxJobRun: 2 }
        await expect(jobCtrl.updateMeta(validMeta)).resolves.toEqual({ 'maxJobRun': 2 });
    });
})

describe('job CRUD', () => {

    test('should failed create job with missing params moduleName', async () => {
        const missingParamsJob = {
            commandName: 'testCommandName'
        };
        await expect(jobCtrl.createJob(missingParamsJob)).rejects.toMatch('missing job args');

    });

    test('should failed create job with missing params commandName', async () => {
        const missingParamsJob = {
            moduleName: 'testModuleName'
        };
        await expect(jobCtrl.createJob(missingParamsJob)).rejects.toMatch('missing job args');
    });

    test('should create job', () => {
    });

    test('should delete job', () => {

    });

    test('should fail update Job with wrong Status', async () => {
        const testId = 'testId';
        const invalidStatus = 'invalidStatus'
        await expect(jobCtrl.updateJobStatus(testId, invalidStatus)).rejects.toMatch('invalid args');
    });

    test('should update Job Status', () => {

    });

    test('async testing', async () => {
        expect.assertions(1);
        const data = await Promise.resolve({ name: 'name' });
        expect(data).toEqual({ name: 'name' });
        return;
    });
});

describe('tick works', () => {

});


