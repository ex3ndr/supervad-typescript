import { SuperVADEngine } from "./engine";
import { SuperVADParameters } from "./settings";
import { concat, EMPTY } from "./utils";

export type SuperVADRealtimeState = 'active' | 'deactivating' | 'deactivated';

export type SuperVADRealtimeEvent =
    | { kind: 'activated' }
    | { kind: 'valid' }
    | { kind: 'activation-aborted' }
    | { kind: 'deactivating' }
    | { kind: 'deactivation-aborted' }
    | { kind: 'complete', buffer: Float32Array, tokens: number }
    | { kind: 'canceled' };

/**
 * Realtime voice activity detection. This class it not concurrent safe.
 */
export class SuperVADRealtime {

    /**
     * Create realtime SuperVAD instance.
     * @param engine inference engine
     * @param parameters detection parameters
     * @returns realtime SuperVAD instance
     */
    static create(engine: SuperVADEngine, parameters: SuperVADParameters) {
        return new SuperVADRealtime(engine, parameters);
    }

    readonly engine: SuperVADEngine;
    readonly parameters: SuperVADParameters;

    private _state: SuperVADRealtimeState = 'deactivated';
    private _preBuffer = EMPTY;
    private _activeBuffer = EMPTY;
    private _activeTokens = 0;
    private _stateTokens = 0;
    private _stateValid = false;

    private constructor(engine: SuperVADEngine, parameters: SuperVADParameters) {
        this.engine = engine;
        this.parameters = parameters;
    }

    /**
     * Process next audio token.
     * @param token audio token
     * @returns event if state changed, null otherwise
     */
    async process(token: Float32Array): Promise<SuperVADRealtimeEvent | null> {

        // Run prediction
        const prediction = await this.engine.predict(token);

        //
        // Append to token buffer
        //

        this._preBuffer = concat(this._preBuffer, token);
        if (this._preBuffer.length > this.parameters.activationTokens * SuperVADEngine.TOKEN_SIZE) {
            this._preBuffer = this._preBuffer.subarray(this._preBuffer.length - this.parameters.activationTokens * SuperVADEngine.TOKEN_SIZE);
        }

        //
        // Handle activation
        //

        if (this._state === 'deactivated') {
            if (prediction >= this.parameters.activationThreshold) {
                this._state = 'active';
                this._activeBuffer = this._preBuffer;
                this._activeTokens = 1;
                this._stateValid = false;
                return { kind: 'activated' };
            }
        }

        //
        // Handle active state
        //

        if (this._state === 'active') {
            this._activeBuffer = concat(this._activeBuffer, token);

            // Count active tokens
            if (prediction >= this.parameters.activationThreshold) {
                this._activeTokens++;
                if (this._activeTokens >= this.parameters.minActiveTokens && !this._stateValid) {
                    this._stateValid = true;
                    return { kind: 'valid' };
                }
            }

            // Check if we should start deactivation
            if (prediction <= this.parameters.deactivationThreshold) {
                this._state = 'deactivating';
                this._stateTokens = 1;
                return { kind: 'deactivating' };
            }
        }

        //
        // Handle deactivation
        //

        if (this._state === 'deactivating') {
            this._activeBuffer = concat(this._activeBuffer, token);

            // If voice activity detected
            if (prediction >= this.parameters.activationThreshold) {
                this._state = 'active';
                this._stateTokens = 0;
                this._activeTokens++;
                return { kind: 'deactivation-aborted' };
            }

            // Update coutners
            if (prediction <= this.parameters.deactivationThreshold) {
                this._stateTokens++;
            } else {
                this._stateTokens--;
            }

            // If deactivation failed
            if (this._stateTokens <= 0) {
                this._state = 'active';
                this._stateTokens = 0;
                return { kind: 'deactivation-aborted' };
            }

            // If deactivation successful
            if (this._stateTokens >= this.parameters.deactivationTokens) {
                const buffer = this._activeBuffer;
                const tokens = this._activeTokens;
                const valid = this._stateValid;
                this._activeBuffer = EMPTY;
                this._state = 'deactivated';
                this._stateTokens = 0;
                if (valid) {
                    return { kind: 'complete', buffer, tokens };
                } else {
                    return { kind: 'canceled' };
                }
            }
        }

        return null;
    }
}