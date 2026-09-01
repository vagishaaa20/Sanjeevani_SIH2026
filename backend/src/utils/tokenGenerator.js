const tokenGenerator = {
    generateDailyToken: (prefix = 'TK') => {
        const randomNum = Math.floor(100 + Math.random() * 900);
        return `${prefix}-${randomNum}`;
    },
};
module.exports = tokenGenerator;
