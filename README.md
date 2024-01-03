# ✨ SuperVAD typescript library

Robust voice activity detection for Node.js, browser and React Native, perfect for always-on voice applications.

**Features:**

- 🚀 Fast
- 🎙️ Works in any environment: terrible voip, phone, browser, etc
- 🎛️ Sensitivity is configurable
- 🌐 Works in Node.js, browser and React Native
- 📦 Zero dependencies except ONNX runtime

## How to install

This library depends on `onnxruntime`, depending on your platform you need to install additional dependency: `onnxruntime-web` for browser and `onnxruntime-node` for Node.js.

```bash
# For web
yarn add supervad onnxruntime-web

# For node
yarn add supervad onnxruntime-node

# You can mix them together
yarn add supervad onnxruntime-web onnxruntime-node
```

Some web environment requires serving onnx wasm files from root folder of a directory, please, check onnxruntime-web documentation for more details.

## How to use

This library requires sound stream to be mono and `16kHz`, represented as `Float32Array` typed array. Most of modules process one `audio token` at once, which is exactly `320` samples, or `20ms` of audio. This library also need to have an access to onnx model, which you can provide as a url, file path or as `Buffer`-like object.

### Simple engine
In case you want to get raw predictions, you can always use `SuperVADEngine` directly. Be advised: this module keeps track of few previous tokens and if you want to restart it you need to create a new one.

```typescript
import { SuperVADEngine } from 'supervad';

// Create engine
const engine = await SuperVADEngine.create('/supervad-1.onnx'); // Download model from url

const token = new Float32Array(320); // Your audio token

const probability = await engine.predict(token); // probability of a voice in this token 0..1

```

### Realtime example in Web

The most common usecase is to use it in realtime pipeline, this is an example to implement it in browser.

```typescript
import { SuperVADEngine, SuperVADRealtime, SuperVADParameters, optimalParameters } from 'supervad';

// Create engine
const engine = await SuperVADEngine.create('/supervad-1.onnx'); // Download model from url
const parameters: SuperVADParameters = optimalParameters();
const realtime = SuperVADRealtime.create(engine, parameters);

// Get Stream
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

// Create audio processor
const audioContext = new AudioContext({ sampleRate: 16000 }); // 16khz
const source = audioContext.createMediaStreamSource(stream); // Source
const processor = audioContext.createScriptProcessor(2048, 1, 1);

// Audio buffer handler
let pending: Float32Array = new Float32Array(0);
processor.onaudioprocess = function (e) {

  // Append new buffer to existing one
  const input = e.inputBuffer.getChannelData(0);
  pending = concat(pending, input);

  // Process tokens
  while (pending.length > SuperVADEngine.TOKEN_SIZE) {

    // Read token from buffer
    const output = await session.process(pending.subarray(0, SuperVADStreamEngine.TOKEN_SIZE));
    pending = pending.subarray(SuperVADStreamEngine.TOKEN_SIZE);

    // Handle event
    if (output) {
      // Log state change
      console.log(output);

      // Handle when audio segment finished capture
      if (output.state === 'complete') {
        // Here in output.buffer will be detected segment
      }
    }
  }
}

// Launch processor
source.connect(processor);
processor.connect(audioContext.destination);
```

# License

MIT
