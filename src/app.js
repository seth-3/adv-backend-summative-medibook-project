const express = require('express');
const patientRoutes = require('./routes/patientRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const waitlistRoutes = require('./routes/waitlistRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const homeController = require('./controllers/homeController');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(express.json());

app.get('/', homeController.index);
app.use('/patients', patientRoutes);
app.use('/doctors', doctorRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/reports', reportRoutes);
app.use('/waitlist', waitlistRoutes);
app.use('/feedback', feedbackRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
