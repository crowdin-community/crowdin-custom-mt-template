const crowdinModule = require('@crowdin/app-project-module'); // Crowdin App development framework
const axios = require('axios');

const express = crowdinModule.express; // Express instance from the framework (includes best-practice middleware)
const app = express();
app.use(express.json({ limit: '50mb' }));

const configuration = {
    // TODO: brand your integration
    name: 'Custom MT Template',
    identifier: 'custom-mt-template',
    description: 'Template for building a custom Machine Translation provider for Crowdin',

    imagePath: __dirname + '/logo.svg', // app's logo

    // Crowdin Custom MT interface
    // https://crowdin.github.io/app-project-module/tools/custom-mt/
    customMT: {
        translate: async ({ client, context, projectId, source, target, strings } = {}) => {
            // Read app's per-organization settings stored via /form
            const organization = context.jwtPayload.domain || context.jwtPayload.context.organization_id;
            const config = await crowdinApp.getMetadata(organization) || {};

            // Guard: credentials must be configured before we call the provider
            if (!config.credentials || !config.credentials.apiKey || !config.credentials.apiKey.length) {
                return {
                    error: {
                        message: 'The integration is not configured. Please configure the credentials in the settings.',
                    },
                };
            }

            // Reject unsupported languages early with a clear message
            if (!isLanguageSupported(source)) {
                throw `Source language "${source}" is not supported`;
            }
            if (!isLanguageSupported(target)) {
                throw `Target language "${target}" is not supported`;
            }

            source = getLanguage(source);
            target = getLanguage(target);

            return await translateStrings(config.credentials, source, target, strings);
        },
    },

    // Render the settings form in both Organization and Profile menus
    organizationSettingsMenu: require('./settings-form').getForm(),
    profileResourcesMenu: require('./settings-form').getForm(),
};

/**
 * TODO: implement the call to your MT provider's API.
 *
 * Must return an array of translated strings in the same order as `strings`.
 *
 * @param {{ apiKey: string, apiUrl?: string }} config  credentials from the settings form
 * @param {string} sourceLanguage  provider-specific source language code
 * @param {string} targetLanguage  provider-specific target language code
 * @param {string[]} strings       strings to translate
 * @returns {Promise<string[]>}
 */
async function translateStrings(config, sourceLanguage, targetLanguage, strings) {
    const apiUrl = config.apiUrl || 'https://api.example.com/translate';

    // Example request body — replace with your provider's schema
    const body = {
        source: sourceLanguage,
        target: targetLanguage,
        texts: strings,
    };

    try {
        const response = await axios.post(apiUrl, body, {
            headers: {
                Authorization: `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            timeout: 30000, // 30 seconds
        });

        // TODO: adapt to your provider's response shape
        const translations = response.data?.translations || [];

        if (translations.length === 0) {
            throw new Error('No translations returned from the provider');
        }

        return translations;
    } catch (e) {
        console.error('MT provider error:', {
            status: e.response?.status,
            statusText: e.response?.statusText,
            data: e.response?.data,
            message: e.message,
            code: e.code,
            sourceLanguage,
            targetLanguage,
        });

        // Friendly messages for common network failures
        if (e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT' || e.message?.includes('timeout')) {
            throw 'Request timeout: the MT provider is taking too long to respond. Please try again later.';
        }
        if (e.code === 'ECONNREFUSED') {
            throw 'Connection refused: unable to connect to the MT provider.';
        }
        if (e.code === 'ENOTFOUND') {
            throw 'DNS error: cannot resolve the MT provider hostname.';
        }
        if (!e.response) {
            throw `Network error: ${e.message || 'unable to connect to the MT provider'}`;
        }

        throw (e.response?.data?.message || e.message || 'Failed to translate');
    }
}

/**
 * TODO: map Crowdin language codes to your provider's codes.
 *
 * The key is the Crowdin language code (lowercased), the value is the
 * provider-specific code that should be sent in translation requests.
 *
 * See https://support.crowdin.com/developer/language-codes/ for the full
 * list of Crowdin language codes.
 */
const SUPPORTED_LANGUAGES = {
    // 'en': 'en',
    // 'en-us': 'en',
    // 'fr': 'fr',
    // 'de': 'de',
    // 'es': 'es',
    // ...
};

function getLanguage(crowdinLanguageCode) {
    const lowerCode = crowdinLanguageCode.toLowerCase();
    if (SUPPORTED_LANGUAGES[lowerCode]) {
        return SUPPORTED_LANGUAGES[lowerCode];
    }
    // Fall back to the raw code (validation below should prevent this reaching the API)
    return lowerCode;
}

function isLanguageSupported(crowdinLanguageCode) {
    // Once SUPPORTED_LANGUAGES is filled with real mappings, uncomment the
    // line below and delete `return true` so unsupported language pairs are
    // rejected before hitting the provider.
    // return SUPPORTED_LANGUAGES[crowdinLanguageCode.toLowerCase()] !== undefined;
    return true;
}

// Attach Crowdin endpoints (install, OAuth callback, etc.)
const crowdinApp = crowdinModule.addCrowdinEndpoints(app, configuration);

// Validate the credentials before saving them.
// This is optional — if you don't need validation, delete this block and the low-code UI
// will persist the form data directly on submit.
app.post(
    '/form',
    crowdinModule.postRequestCredentialsMasker(require('./settings-form').getForm()), // mask secrets in logs
    async (req, res) => {
        const { client, context } = await crowdinApp.establishCrowdinConnection({
            jwtToken: req.query.jwtToken,
        });
        const formData = req.body.data;

        try {
            // Quick check: make a round-trip translation request with the submitted credentials.
            // Replace "en" / "fr" / ["Hello"] with language codes and a sample your provider supports.
            const testTranslation = await translateStrings(formData, 'en', 'fr', ['Hello']);

            if (!testTranslation || testTranslation.length === 0) {
                throw new Error('Validation failed: no translation returned');
            }

            // Store app's configuration if the test call succeeded
            const organization = context.jwtPayload.domain || context.jwtPayload.context.organization_id;
            await crowdinApp.saveMetadata({
                id: organization,
                metadata: { credentials: formData },
                crowdinId: context.crowdinId,
            });

            res.status(200).send({
                message: 'Credentials are valid. The integration is ready to use.',
            });
        } catch (e) {
            console.error('Validation error:', e);
            const errorMessage = typeof e === 'string' ? e : (e.message || 'Invalid credentials');
            res.status(400).send({
                message: `Credentials are invalid. ${errorMessage}`,
            });
        }
    }
);

app.listen(process.env.PORT || 3000, () =>
    console.info(`Custom MT app listening on port ${process.env.PORT || 3000}`)
);
