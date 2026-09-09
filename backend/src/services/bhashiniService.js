const axios = require('axios');

class BhashiniService {
    constructor() {
        this.userId = process.env.BHASHINI_USER_ID;
        this.ulcaApiKey = process.env.BHASHINI_API_KEY;
        this.pipelineId = "64392f96daac500b55c543cd";

        // Cache structure: langPair (e.g. 'en-hi') -> { serviceId, inferenceApiName, inferenceApiValue }
        this.pipelineCache = new Map();

        // Ensure initialization completes safely (does not block standard boot)
        // Store the active promise so concurrent misses can await it cooperatively.
        this.initPromise = this.initializePipeline().finally(() => {
            this.initPromise = null;
        }).catch(err => {
            console.warn('[Bhashini] Initial pipeline fetch failed, will retry on first use.', err.message);
        });
    }

    async initializePipeline() {
        if (!this.userId || !this.ulcaApiKey) {
            console.warn('[Bhashini] BHASHINI_USER_ID or BHASHINI_API_KEY missing. Translation will gracefully fallback to English.');
            return;
        }

        try {
            const url = 'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline';
            const payload = {
                pipelineTasks: [{ taskType: "translation" }],
                pipelineRequestConfig: { pipelineId: this.pipelineId }
            };

            const headers = {
                'userID': this.userId,
                'ulcaApiKey': this.ulcaApiKey,
                'Content-Type': 'application/json'
            };

            const response = await axios.post(url, payload, { headers, timeout: 10000 });

            const pipelineData = response.data.pipelineResponseConfig?.[0]; // Configuration task setup
            const inferenceApiKeyObj = response.data.pipelineInferenceAPIEndPoint?.inferenceApiKey;

            if (!pipelineData || !inferenceApiKeyObj || !inferenceApiKeyObj.value) {
                throw new Error("Invalid format received from Bhashini pipeline initialization.");
            }

            const inferenceApiName = inferenceApiKeyObj.name || 'Authorization';
            const inferenceApiValue = inferenceApiKeyObj.value;

            const modelSettings = pipelineData.config || [];

            this.pipelineCache.clear();
            modelSettings.forEach(model => {
                const sourceLang = model.language?.sourceLanguage;
                const targetLang = model.language?.targetLanguage;
                if (sourceLang && targetLang) {
                    const key = `${sourceLang}-${targetLang}`;
                    this.pipelineCache.set(key, {
                        serviceId: model.serviceId,
                        inferenceApiName,
                        inferenceApiValue
                    });
                }
            });

            console.log(`[Bhashini] Successfully loaded pipeline configurations for ${this.pipelineCache.size} language pairs.`);

        } catch (error) {
            console.error('[Bhashini] Failed to fetch pipeline config:', error);
            throw error;
        }
    }

    async getServiceConfig(sourceLang, targetLang) {
        if (sourceLang === targetLang) return null; // No translation needed

        const key = `${sourceLang}-${targetLang}`;
        if (!this.pipelineCache.has(key)) {
            // Lazy retry pipeline logic on miss if we failed earlier or cache was wiped, avoiding thundering herd
            if (!this.initPromise) {
                this.initPromise = this.initializePipeline().finally(() => {
                    this.initPromise = null;
                });
            }
            await this.initPromise;
        }

        const config = this.pipelineCache.get(key);
        if (!config) {
            throw new Error(`[Bhashini] No active translation pipeline found for pair: ${key}`);
        }

        return config;
    }

    /**
     * Translates text. Falls back to original text if configured incorrectly or if network crashes.
     */
    async translateText(text, sourceLang, targetLang) {
        if (!text || sourceLang === targetLang) return text;

        // Truncate to prevent payload size overflow on the Bhashini service pipeline
        const safeText = text.length > 3000 ? text.substring(0, 3000) : text;

        // Prevent wasting calls on very simple structural words if desired, but for now we pass all
        try {
            const config = await this.getServiceConfig(sourceLang, targetLang);
            if (!config) return text;

            const payload = {
                pipelineTasks: [{
                    taskType: "translation",
                    config: {
                        language: { sourceLanguage: sourceLang, targetLanguage: targetLang },
                        serviceId: config.serviceId
                    }
                }],
                inputData: {
                    input: [{ source: safeText }]
                }
            };

            const headers = {
                [config.inferenceApiName]: config.inferenceApiValue,
                'Content-Type': 'application/json'
            };

            const res = await axios.post('https://dhruva-api.bhashini.gov.in/services/inference/pipeline', payload, { headers, timeout: 8000 });

            const outputText = res.data?.pipelineResponse?.[0]?.output?.[0]?.target;
            if (outputText) {
                return outputText;
            } else {
                throw new Error("No target field in Dhruva inference layout.");
            }
        } catch (error) {
            console.warn(`[Bhashini] Translation failed for [${sourceLang}->${targetLang}]:`, error.message);
            return text; // Graceful fallback
        }
    }
}

// Export a singleton instance
const bhashiniService = new BhashiniService();
module.exports = bhashiniService;
