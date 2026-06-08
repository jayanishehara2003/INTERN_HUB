const router = require('express').Router();
const { sendMessage, getMessages, deleteMessage, markAsRead } = require('../controllers/messageController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/', sendMessage);                           // public
router.get('/', protect, adminOnly, getMessages);        // admin only
router.delete('/:id', protect, adminOnly, deleteMessage); // admin only
router.patch('/:id/read', protect, adminOnly, markAsRead); // admin only

module.exports = router;