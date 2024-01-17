const messageModel = require('../model/messageModel')
const User = require('../model/userModel')

module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, to, message, id } = req.body
    const data = await
      messageModel.create({
        message: { text: message },
        users: [from, to],
        sender: from,
        uuid: id
      })
    if (data) return res.json({ msg: "Message addedd successfully" });
    return res.json({ msg: "Failed to add Message to the database " })
  } catch (err) {
    console.log(err)
  }
}
module.exports.getAllMessage = async (req, res, next) => {
  try {
    const { from, to } = req.body
    const messages = await messageModel.find({
      users: {
        $all: [from, to]
      },
    }).sort({
      updatedAt: 1
    })
    console.log(messages)
    const projectMessages = messages
      .filter((msg) => !msg.deletedFor.deletedForEveryone && msg.deletedFor.userId != from) // Filter out messages deleted for everyone
      .map((msg) => ({
        id: msg.uuid,
        user_id: msg.deletedFor.userId,
        deleted: msg.deletedFor?.deletedForMe || false, // Use optional chaining to handle possible undefined
        fromSelf: msg.sender.toString() === from,
        message: msg.message.text
      }));

    res.json(projectMessages)
  } catch (err) {
    console.log(err)
  }
}

// Search Feature
module.exports.search = async (req, res, next) => {
  try {
    const { query, userId } = req.params;



    // Search for messages and filter out deleted messages for the current user
    const messages = await messageModel
      .find({ 'message.text': { $regex: query, $options: 'i' } })
      .sort({ updatedAt: 1 }).populate('sender')
      .lean(); // Using lean() for better performance
    console.log(messages)
    const filteredMessages = messages
      .filter((msg) => !msg.deletedFor.deletedForEveryone && msg.deletedFor.userId != userId) // Filter out messages deleted for everyone
      .map((msg) => ({
        message: msg.message.text,
        sender: {
          email: msg.sender.email,
          username: msg.sender.username,
          avatarImage: msg.sender.avatarImage,
          _id: msg.sender._id,
        },
      }));
    res.json({ messages: filteredMessages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


// Delete for Me Feature
module.exports.deleteForMe = async (req, res, next) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.params.id;

    const message = await messageModel.findOne({ uuid: messageId });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Mark the message as deleted for the user
    message.deletedFor.deletedForMe = true;
    message.deletedFor.userId = userId;

    await message.save();

    res.json({ msg: 'Message deleted for you successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Delete for Everyone Feature
module.exports.deleteForEveryone = async (req, res, next) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.params.id;
    const antoheruser_id = req.params.user_id;

    const message = await messageModel.findOne({ uuid: messageId });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    message.deletedFor.deletedForEveryone = true;

    await message.save();
    const sendUserSocker = onlineUsers.get(antoheruser_id)
    if (sendUserSocker) {
      IO.to(sendUserSocker).emit("online-receiver", messageId)
    }
    res.json({ msg: 'Message deleted for everyone successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

