import * as ort from 'isomorphic-onnxruntime';

/**
 * SuperVAD engine that manages the ONNX session, runs inference and keeps buffer of the last 10 tokens.
 * This class is not concurrency-safe and should not be used in parallel.
 */
export class SuperVADEngine {

    /**
     * Number of samples per token
     */
    static readonly TOKEN_SIZE = 320;

    /**
     * Create from existing inference session.
     * @param session inference session
     * @returns engine
     */
    static createFromSession(session: ort.InferenceSession) {
        return new SuperVADEngine(session);
    }

    /**
     * Create from path or URL.
     * @param pathOrUrl path or URL
     * @param options session options
     * @returns engine
     */
    static async create(pathOrUrl: string, options?: ort.InferenceSession.SessionOptions) {
        return new SuperVADEngine(await ort.InferenceSession.create(pathOrUrl, options));
    }

    /**
     * Create from buffer.
     * @param buffer buffer
     * @param options session options
     * @returns engine
     */
    static async createFromBuffer(buffer: ArrayBufferLike, options?: ort.InferenceSession.SessionOptions) {
        return new SuperVADEngine(await ort.InferenceSession.create(buffer, options));
    }

    private _buffer = new Float32Array(3200);
    private _session: ort.InferenceSession;
    private constructor(session: ort.InferenceSession) {
        this._session = session;
    }

    /**
     * Get the underlying inference session.
     */
    get session() {
        return this._session;
    }

    /**
     * Run inference on the given audio token.
     * @param token audio token
     * @returns probability of the token being speech
     */
    async predict(token: Float32Array) {
        if (token.length !== SuperVADEngine.TOKEN_SIZE) {
            throw new Error('Invalid token length, expected ' + SuperVADEngine.TOKEN_SIZE + ' items, got: ' + token.length);
        }

        // Shift biffer
        for (let i = 0; i < 3200 - 320; i++) {
            this._buffer[i] = this._buffer[i + 320];
        }

        // Load token
        for (let i = 0; i < 320; i++) {
            this._buffer[3200 - 320 + i] = token[i];
        }

        // Run inference
        const input = new ort.Tensor('float32', this._buffer, [1, this._buffer.length]);
        const results = await this._session.run({ input });

        // Return probability
        return results.output.data[0] as number;
    }

    /**
     * Release resources.
     */
    destroy() {
        this._session.release();
    }
}