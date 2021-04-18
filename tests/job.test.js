const jobCtrl = require('../controller/job');

const initDb = () => console.log('db init');
const cleanupDb = () => console.log('db cleanupDb');

// afterAll(() => initDb());
// beforeAll(() => cleanupDb());

describe('update metadata', () => {
    test('meta call should not be valid', async () => {
        const inValidMeta = { invalidArg: 1 }
        await expect(jobCtrl.updateMeta(inValidMeta)).rejects.toMatch('missing meta args');
    })

    test('meta call should pass', async () => {
        const validMeta = { maxJobRun: 2 }
        await expect(jobCtrl.updateMeta(validMeta)).resolves.toEqual({'maxJobRun': 2});
    })
})

describe('CRUD job', () => {

    test('2 should equel 2', () => {
        expect(2).toBe(2);
    });

    test('hashMap should equel hashMap', () => {
        expect({ name: 'yaya' }).toEqual({ name: 'yaya' });
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


