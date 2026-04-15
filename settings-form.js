// Crowdin low-code UI for app settings
// Docs: https://crowdin.github.io/app-project-module/user-interface/

exports.getForm = () => {
    return {
        maskPasswords: true,
        environments: ['crowdin-enterprise', 'crowdin'],
        formSchema: {
            title: 'Custom MT Integration Setup',
            description: 'Configure the API credentials for your MT provider.',
            type: 'object',
            required: ['apiKey'],
            properties: {
                apiKey: {
                    type: 'string',
                    title: 'API Key',
                    description: 'Enter your MT provider API key.',
                },
                apiUrl: {
                    type: 'string',
                    title: 'API URL',
                    description: 'Optional. Override the default MT provider endpoint.',
                    default: 'https://api.example.com/translate',
                },
            },
        },
        formUiSchema: {
            apiKey: {
                'ui:widget': 'password',
            },
        },
        // The /form endpoint in handler.js validates the credentials before persisting them.
        // Remove this line to let the framework persist the form data directly on submit.
        formPostDataUrl: '/form',
    };
};
