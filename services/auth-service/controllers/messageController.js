const Message = require('../models/Message');

// @POST /api/messages — anyone can send
exports.sendMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message)
      return res.status(400).json({ message: 'All fields are required' });
    const newMessage = await Message.create({ name, email, message });
    res.status(201).json({ message: 'Message sent successfully!', data: newMessage });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/messages — admin only
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @DELETE /api/messages/:id — admin only
exports.deleteMessage = async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @PATCH /api/messages/:id/read — admin only
exports.markAsRead = async (req, res) => {
  try {
    const msg = await Message.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};