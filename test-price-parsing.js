const { parseMessage } = require('./server/dist/services/chatbot/MessageParser');

console.log('Testing price parsing:');
console.log('"nen 20$":', parseMessage('nen 20$'));
console.log('"under 20$":', parseMessage('under 20$'));
console.log('"xhinse nen 20$":', parseMessage('xhinse nen 20$'));
