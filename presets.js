/**
 * Predefinições para o conversor de música 8D
 */
const Presets = {
    /**
     * Configuração padrão
     */
    default: {
        panSpeed: 2.0,
        panAmount: 1.0,
        reverbAmount: 0.3,
        roomSize: 0.8,
        echoDelay: 0.2,
        echoFeedback: 0.2,
        panPattern: 'sine',
        bassBoost: 2
    },
    
    /**
     * Configuração suave
     */
    suave: {
        panSpeed: 1.0,
        panAmount: 0.8,
        reverbAmount: 0.4,
        roomSize: 0.9,
        echoDelay: 0.3,
        echoFeedback: 0.15,
        panPattern: 'sine',
        bassBoost: 1
    },
    
    /**
     * Configuração intensa
     */
    intenso: {
        panSpeed: 3.5,
        panAmount: 1.0,
        reverbAmount: 0.2,
        roomSize: 0.7,
        echoDelay: 0.1,
        echoFeedback: 0.3,
        panPattern: 'square',
        bassBoost: 5
    },
    
    /**
     * Configuração psicodélica
     */
    psicodelico: {
        panSpeed: 3.0,
        panAmount: 1.0,
        reverbAmount: 0.6,
        roomSize: 0.95,
        echoDelay: 0.5,
        echoFeedback: 0.4,
        panPattern: 'triangle',
        bassBoost: 3
    },
    
    /**
     * Gera configuração aleatória
     * @returns {Object} - Configuração aleatória
     */
    generateRandom() {
        return {
            panSpeed: Math.random() * 4.9 + 0.1,
            panAmount: Math.random() * 0.9 + 0.1,
            reverbAmount: Math.random() * 0.9,
            roomSize: Math.random() * 0.89 + 0.1,
            echoDelay: Math.random() * 0.9 + 0.1,
            echoFeedback: Math.random() * 0.7,
            panPattern: ['sine', 'triangle', 'square', 'random'][Math.floor(Math.random() * 4)],
            bassBoost: Math.floor(Math.random() * 15)
        };
    },
    
    /**
     * Obtém uma configuração pelo nome
     * @param {String} name - Nome da configuração
     * @returns {Object} - Configuração correspondente
     */
    getByName(name) {
        switch (name) {
            case 'suave':
                return this.suave;
            case 'intenso':
                return this.intenso;
            case 'psicodelico':
                return this.psicodelico;
            case 'aleatorio':
                return this.generateRandom();
            default:
                return this.default;
        }
    }
};