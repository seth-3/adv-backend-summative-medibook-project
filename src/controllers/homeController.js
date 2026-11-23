// GET / - a small welcome message that lists the available endpoints
function index(req, res) {
  res.json({
    name: 'MediBook API',
    status: 'running',
    endpoints: {
      patients: ['GET /patients', 'POST /patients', 'GET /patients/:id', 'PATCH /patients/:id', 'DELETE /patients/:id'],
      doctors: ['GET /doctors', 'POST /doctors', 'GET /doctors/:id', 'PATCH /doctors/:id', 'DELETE /doctors/:id', 'GET /doctors/:id/stats'],
      appointments: ['POST /appointments', 'GET /appointments/:id', 'POST /appointments/:id/cancellation'],
      waitlist: ['POST /waitlist', 'GET /waitlist?doctor_id=1&date=YYYY-MM-DD'],
      reports: ['GET /reports/doctors', 'GET /reports/busy-days'],
      feedback: ['GET /feedback', 'GET /feedback?lang=fr'],
    },
  });
}

module.exports = { index };
