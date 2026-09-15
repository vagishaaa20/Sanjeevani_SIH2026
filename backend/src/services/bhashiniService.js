const axios = require('axios');
let aiClient = null;

class BhashiniService {
    constructor() {
        this.userId = process.env.BHASHINI_USER_ID;
        this.ulcaApiKey = process.env.BHASHINI_API_KEY;
        this.pipelineId = "64392f96daac500b55c543cd";

        this.pipelineCache = new Map();

        // In test environments, skip automatic background initialization on module load.
        // It will lazy-load via getServiceConfig() when actually needed.
        if (process.env.NODE_ENV !== 'test') {
            this.initPromise = this.initializePipeline().finally(() => {
                this.initPromise = null;
            }).catch(err => {
                console.warn('[Bhashini] Pipeline initialization skipped/failed:', err.message);
            });
        } else {
            this.initPromise = null;
        }
    }

    async initializePipeline() {
        if (!this.userId || !this.ulcaApiKey || this.userId === 'your_bhashini_user_id' || this.ulcaApiKey === 'your_bhashini_api_key') {
            console.warn('[Bhashini] BHASHINI_USER_ID or BHASHINI_API_KEY missing/placeholder.');
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

            const response = await axios.post(url, payload, { headers, timeout: 8000 });

            const pipelineData = response.data.pipelineResponseConfig?.[0];
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

            console.log(`[Bhashini] Loaded pipeline configurations for ${this.pipelineCache.size} language pairs.`);
        } catch (error) {
            console.warn('[Bhashini] Pipeline not available:', error.message);
        }
    }

    async getServiceConfig(sourceLang, targetLang) {
        if (sourceLang === targetLang) return null;

        const key = `${sourceLang}-${targetLang}`;
        if (!this.pipelineCache.has(key)) {
            if (!this.initPromise) {
                this.initPromise = this.initializePipeline().finally(() => {
                    this.initPromise = null;
                });
            }
            await this.initPromise;
        }

        return this.pipelineCache.get(key) || null;
    }

    /**
     * Translates text using Bhashini with AI fallback.
     */
    async translateText(text, sourceLang = 'en', targetLang = 'hi') {
        if (!text || sourceLang === targetLang) return text;

        const safeText = text.length > 3000 ? text.substring(0, 3000) : text;

        // 1. Try Bhashini if configured
        try {
            const config = await this.getServiceConfig(sourceLang, targetLang);
            if (config) {
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
                if (outputText) return outputText;
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
