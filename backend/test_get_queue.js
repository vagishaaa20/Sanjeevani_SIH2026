require('dotenv').config();
const { getQueue } = require('./src/controllers/doctorQueueController');
const { DoctorProfile } = require('./src/models');

async function test() {
    try {
        const doc = await DoctorProfile.findOne({ where: { fullName: 'Dr. Sohail Khan' } });
        console.log('Found doc with userId:', doc.userId);

        const req = { user: { id: doc.userId } };
        const res = {
            status: (code) => {
                console.log('Status set to', code);
                return {
                    json: (data) => console.log('JSON Output:', data)
                };
            },
            json: (data) => console.log('JSON Output:', data)
        };

        await getQueue(req, res);
    } catch (e) {
        console.error('CRASH:', e);
    }
}
test();
