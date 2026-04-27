const fetch = require('node-fetch');

async function test() {
  try {
    const res = await fetch('http://localhost:3006/api/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: "This is a test transcript that is definitely over fifty characters long so that it passes the validation check for minimum length. The attendees were Alice and Bob.",
        attendees: ["Alice", "Bob"],
        inputMethod: "paste",
        inputType: "text"
      })
    });
    console.log("STATUS:", res.status);
    const text = await res.text();
    console.log("RESPONSE:", text.substring(0, 500));
  } catch(e) {
    console.error(e);
  }
}
test();
