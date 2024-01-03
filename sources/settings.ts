export type SuperVADParameters = {
    activationThreshold: number,
    deactivationThreshold: number,
    deactivationTokens: number,
    activationTokens: number,
    minActiveTokens: number,
}

export function optimalParameters(): SuperVADParameters {
    return {
        deactivationThreshold: 0.6,
        deactivationTokens: 20,
        activationThreshold: 0.8,
        activationTokens: 20,
        minActiveTokens: 10,
    }
}