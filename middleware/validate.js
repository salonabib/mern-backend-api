const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const errorList = errors.array().map(e => ({ field: e.param, message: e.msg }));
        return res.status(400).json({
            success: false,
            message: errorList[0].message,
            errors: errorList
        });
    }

    next();
};

module.exports = validate; 