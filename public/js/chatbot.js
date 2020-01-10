// // Chatbot Feature
// const socket = io();
// const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
// const recognition = new SpeechRecognition();
// recognition.lang = 'en-US';
// recognition.interimResults = false;
// document.querySelector('#chatbot-button').addEventListener('click', () => {
//     recognition.start();
//   });

// recognition.addEventListener('result', (e) => {
//   let last = e.results.length - 1;
//   let text = e.results[last][0].transcript;
//   socket.emit('chat message', text);
//   console.log('Confidence: ' + e.results[0][0].confidence);
// });


// function synthVoice(text) {
//   const synth = window.speechSynthesis;
//   const utterance = new SpeechSynthesisUtterance();
//   utterance.text = text;
//   synth.speak(utterance);
// }
