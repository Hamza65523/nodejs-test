const {addMessage,getAllMessage,search,deleteForMe,deleteForEveryone}  = require('../Controllers/messagesControllers')
const router = require('express').Router()
router.post('/addmsg/',addMessage)
router.post("/getmsg/",getAllMessage)
router.post('/search/:query/:userId', search);
router.delete('/deleteForMe/:id/:messageId', deleteForMe);
router.delete('/deleteForEveryone/:id/:messageId/:user_id', deleteForEveryone);

module.exports = router