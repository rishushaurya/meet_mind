const fetch = require('node-fetch'); // wait, native fetch in node 18+

async function test() {
  try {
    const res = await fetch('http://localhost:3003/api/process', {
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
    const data = await res.json();
    console.log("RESPONSE:", JSON.stringify(data, null, 2));
  } catch(e) {
    console.error(e);
  }
}
test();
