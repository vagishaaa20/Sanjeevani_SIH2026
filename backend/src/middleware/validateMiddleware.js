function validateBody(validator) {
    return (req, res, next) => {
        const { valid, errors } = validator(req.body);
        if (!valid) {
            return res.status(400).json({ error: errors.join(', ') });
        }
        return next();
    };
}

module.exports = validateBody;
