var mongoose = require('mongoose');
mongoose.model('User', new mongoose.Schema({
        firstName: String,
        lastName: String,
        email: String,
        passwordHash: String,
        subscriptionActive: {type: Boolean, default: false},
        customerId: String,
        subscriptionId: String,
}));