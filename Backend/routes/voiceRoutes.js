//import express and create Router
const express = require("express");
const router = express.Router();
//import the voice-Controller
const {parseVoiceTranscript} = require('../Controller/voiceController');
//now connect this controller logic with restApi mapping
router.post('/parse', parseVoiceTranscript);
//export the router
module.exports = router;