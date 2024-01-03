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

# License

MIT