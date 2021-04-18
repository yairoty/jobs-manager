async function test1() {
    console.log('moduleA:test1 fires');
    return;
}

async function test2_timeoutJob() {
    console.log('moduleA:test2 fires');
    return new Promise((resolve)=>{
        setTimeout(() => {
            console.log('moduleA:test2 timeout fires');
            resolve();
        }, 30 * 1000);
    })
    
}

async function test3_errorJob() {
    console.log('moduleA:test3_errorJob fires');    
    throw Error('moduleA:test3_errorJob setTimeout error');
}

module.exports = {
    test1,
    test2_timeoutJob,
    test3_errorJob
}