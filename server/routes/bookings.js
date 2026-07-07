const express = require('express');
const router = express.Router();
const { bookEvent, confirmBooking, getMyBookings, cancelBooking, sendBookingOTP, getAllBookings } = require('../controllers/bookingController');
const { protect, admin } = require('../middleware/auth');

router.post('/send-otp', protect, sendBookingOTP);
router.post('/', protect, bookEvent);
router.put('/:id/confirm', protect, admin, confirmBooking);
router.get('/my', protect, getMyBookings);
router.get('/all', protect, admin, getAllBookings);
router.delete('/:id', protect, cancelBooking);

module.exports = router;
