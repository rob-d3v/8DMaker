/**
 * Classe AudioProcessor para transformar áudio em 8D
 */
class AudioProcessor {
    constructor() {
        this.audioContext = null;
        this.sourceNode = null;
        this.pannerNode = null;
        this.reverbNode = null;
        this.delayNode = null;
        this.bassBoostNode = null;
        this.analyserNode = null;
        this.audioBuffer = null;
        this.processingStarted = false;
        this.offsetTime = 0;
        this.startTime = 0;
        this.isPaused = false;
        this.panIntervalId = null;
        this.randomPanValues = [];
        this.processingPromise = null;
        this.processingReject = null;
    }

    /**
     * Inicializa o contexto de áudio
     */
    async initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            await Tone.start();
            Tone.setContext(this.audioContext);
        }
    }

    /**
     * Carrega um arquivo de áudio
     * @param {File} file - Arquivo de áudio a ser carregado
     * @returns {Promise<AudioBuffer>} - Buffer de áudio carregado
     */
    async loadAudioFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (event) => {
                try {
                    const arrayBuffer = event.target.result;
                    await this.initAudioContext();
                    this.audioContext.decodeAudioData(arrayBuffer, (buffer) => {
                        this.audioBuffer = buffer;
                        resolve(buffer);
                    }, (error) => {
                        reject(new Error('Falha ao decodificar o arquivo de áudio: ' + error.message));
                    });
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Erro ao ler o arquivo'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Configura os nós de processamento de áudio
     * @param {Object} options - Opções de configuração
     */
    setupAudioNodes(options) {
        // Reset nodes if they exist
        this.disposeAudioNodes();
        
        // Create source node
        this.sourceNode = this.audioContext.createBufferSource();
        this.sourceNode.buffer = this.audioBuffer;
        
        // Create stereo panner node
        this.pannerNode = this.audioContext.createStereoPanner();
        
        // Create analyser node for visualization
        this.analyserNode = this.audioContext.createAnalyser();
        this.analyserNode.fftSize = 2048;
        
        // Create reverb node using Tone.js
        this.reverbNode = new Tone.Reverb({
            decay: options.roomSize * 10,
            wet: options.reverbAmount
        });
        
        // Create delay node using Tone.js
        this.delayNode = new Tone.FeedbackDelay({
            delayTime: options.echoDelay,
            feedback: options.echoFeedback,
            wet: options.echoFeedback > 0 ? 0.5 : 0
        });
        
        // Create bass boost using Tone.js
        this.bassBoostNode = new Tone.EQ3({
            low: options.bassBoost,
            mid: 0,
            high: 0
        });
        
        // Connect nodes
        this.sourceNode.connect(this.pannerNode);
        this.pannerNode.connect(this.analyserNode);
        
        // Connect Tone.js nodes
        Tone.connect(this.analyserNode, this.bassBoostNode);
        Tone.connect(this.bassBoostNode, this.delayNode);
        Tone.connect(this.delayNode, this.reverbNode);
        Tone.connect(this.reverbNode, this.audioContext.destination);
    }

    /**
     * Limpa e desconecta os nós de áudio
     */
    disposeAudioNodes() {
        if (this.panIntervalId) {
            clearInterval(this.panIntervalId);
            this.panIntervalId = null;
        }
        
        if (this.sourceNode) {
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }
        
        if (this.pannerNode) {
            this.pannerNode.disconnect();
            this.pannerNode = null;
        }
        
        if (this.analyserNode) {
            this.analyserNode.disconnect();
            this.analyserNode = null;
        }
        
        if (this.reverbNode) {
            this.reverbNode.dispose();
            this.reverbNode = null;
        }
        
        if (this.delayNode) {
            this.delayNode.dispose();
            this.delayNode = null;
        }
        
        if (this.bassBoostNode) {
            this.bassBoostNode.dispose();
            this.bassBoostNode = null;
        }
    }

    /**
     * Inicia a panorâmica 8D
     * @param {Object} options - Opções de configuração
     */
    startPanning(options) {
        if (this.panIntervalId) {
            clearInterval(this.panIntervalId);
        }
        
        // Gerar valores aleatórios para o padrão random
        if (options.panPattern === 'random') {
            this.randomPanValues = [];
            for (let i = 0; i < 100; i++) {
                this.randomPanValues.push(Math.random() * 2 - 1);
            }
        }
        
        let phase = 0;
        const updateInterval = 50; // ms
        const phaseDelta = (options.panSpeed * updateInterval) / 1000;
        
        this.panIntervalId = setInterval(() => {
            if (!this.isPaused && this.pannerNode) {
                let panValue;
                
                switch (options.panPattern) {
                    case 'sine':
                        panValue = Math.sin(phase * Math.PI * 2) * options.panAmount;
                        break;
                    case 'triangle':
                        panValue = (Math.abs(((phase * 4) % 4) - 2) - 1) * options.panAmount;
                        break;
                    case 'square':
                        panValue = (Math.floor(phase * 2) % 2 === 0 ? 1 : -1) * options.panAmount;
                        break;
                    case 'random':
                        const index = Math.floor(phase * 10) % this.randomPanValues.length;
                        panValue = this.randomPanValues[index] * options.panAmount;
                        break;
                    default:
                        panValue = Math.sin(phase * Math.PI * 2) * options.panAmount;
                }
                
                this.pannerNode.pan.value = panValue;
                phase = (phase + phaseDelta) % 1;
            }
        }, updateInterval);
    }

    /**
     * Processa o áudio com efeito 8D
     * @param {Object} options - Opções de configuração
     * @returns {Promise<AudioBuffer>} - Promise resolvida quando o processamento estiver concluído
     */
    processAudio(options) {
        if (this.processingPromise) {
            if (this.processingReject) {
                this.processingReject(new Error('Processamento cancelado'));
            }
            this.stop();
        }
        
        this.processingPromise = new Promise((resolve, reject) => {
            this.processingReject = reject;
            
            try {
                this.setupAudioNodes(options);
                this.startPanning(options);
                
                // Start playback
                this.sourceNode.start(0, this.offsetTime);
                this.startTime = this.audioContext.currentTime;
                this.processingStarted = true;
                this.isPaused = false;
                
                // Setup ended callback
                this.sourceNode.onended = () => {
                    this.processingStarted = false;
                    this.offsetTime = 0;
                    this.startTime = 0;
                    resolve(this.audioBuffer);
                };
            } catch (error) {
                reject(error);
            }
        });
        
        return this.processingPromise;
    }

    /**
     * Pausa a reprodução do áudio
     */
    pause() {
        if (this.processingStarted && !this.isPaused && this.audioContext) {
            this.audioContext.suspend();
            this.offsetTime += this.audioContext.currentTime - this.startTime;
            this.isPaused = true;
        }
    }

    /**
     * Retoma a reprodução do áudio
     */
    resume() {
        if (this.processingStarted && this.isPaused && this.audioContext) {
            this.audioContext.resume();
            this.startTime = this.audioContext.currentTime;
            this.isPaused = false;
        }
    }

    /**
     * Para a reprodução do áudio
     */
    stop() {
        if (this.sourceNode) {
            this.sourceNode.stop();
        }
        this.disposeAudioNodes();
        this.processingStarted = false;
        this.isPaused = false;
        this.offsetTime = 0;
        this.startTime = 0;
        this.processingPromise = null;
        this.processingReject = null;
    }

    /**
     * Exporta o áudio processado para um Blob
     * @returns {Promise<Blob>} - Blob contendo o áudio processado
     */
    async exportAudio(options) {
        return new Promise(async (resolve, reject) => {
            try {
                // Configuramos um novo contexto offline para renderizar o áudio
                const offlineContext = new OfflineAudioContext(
                    2,
                    this.audioBuffer.length,
                    this.audioBuffer.sampleRate
                );
                
                // Criamos um buffer de saída para armazenar o áudio processado
                const outputBuffer = offlineContext.createBuffer(
                    2,
                    this.audioBuffer.length,
                    this.audioBuffer.sampleRate
                );
                
                // Configuramos os nós para o contexto offline
                const source = offlineContext.createBufferSource();
                source.buffer = this.audioBuffer;
                
                const panner = offlineContext.createStereoPanner();
                
                // Conectamos os nós básicos
                source.connect(panner);
                panner.connect(offlineContext.destination);
                
                // Iniciamos a source no contexto offline
                source.start();
                
                // Renderizamos os frames
                let framesProcessed = 0;
                const totalFrames = this.audioBuffer.length;
                const frameSize = 1024;
                
                // Aplicamos o efeito 8D frame por frame
                for (let i = 0; i < totalFrames; i += frameSize) {
                    const currentFrame = Math.min(frameSize, totalFrames - i);
                    
                    // Calculamos o valor da panorâmica com base no padrão selecionado
                    const phase = (i / totalFrames) % 1;
                    let panValue;
                    
                    switch (options.panPattern) {
                        case 'sine':
                            panValue = Math.sin(phase * Math.PI * 2) * options.panAmount;
                            break;
                        case 'triangle':
                            panValue = (Math.abs(((phase * 4) % 4) - 2) - 1) * options.panAmount;
                            break;
                        case 'square':
                            panValue = (Math.floor(phase * 2) % 2 === 0 ? 1 : -1) * options.panAmount;
                            break;
                        case 'random':
                            const randomIndex = Math.floor(Math.random() * this.randomPanValues.length);
                            panValue = this.randomPanValues[randomIndex] * options.panAmount;
                            break;
                        default:
                            panValue = Math.sin(phase * Math.PI * 2) * options.panAmount;
                    }
                    
                    // Aplicamos a panorâmica
                    panner.pan.value = panValue;
                    
                    // Atualizamos os frames processados
                    framesProcessed += currentFrame;
                    
                    // Reportamos o progresso
                    if (typeof options.onProgress === 'function') {
                        options.onProgress(framesProcessed / totalFrames);
                    }
                }
                
                // Renderizamos o áudio processado
                const renderedBuffer = await offlineContext.startRendering();
                
                // Convertemos o buffer para um blob
                const audioData = this.audioBufferToWav(renderedBuffer);
                const blob = new Blob([audioData], { type: 'audio/wav' });
                
                resolve(blob);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Converte um AudioBuffer para WAV
     * @param {AudioBuffer} buffer - Buffer de áudio para converter
     * @returns {ArrayBuffer} - Dados WAV
     */
    audioBufferToWav(buffer) {
        const numberOfChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;
        
        let result;
        if (numberOfChannels === 2) {
            result = this.interleave(buffer.getChannelData(0), buffer.getChannelData(1));
        } else {
            result = buffer.getChannelData(0);
        }
        
        return this.encodeWAV(result, format, sampleRate, numberOfChannels, bitDepth);
    }

    /**
     * Intercala canais de áudio para formato WAV estéreo
     * @param {Float32Array} left - Canal esquerdo
     * @param {Float32Array} right - Canal direito
     * @returns {Float32Array} - Canais intercalados
     */
    interleave(left, right) {
        const length = left.length + right.length;
        const result = new Float32Array(length);
        
        let inputIndex = 0;
        
        for (let i = 0; i < length;) {
            result[i++] = left[inputIndex];
            result[i++] = right[inputIndex];
            inputIndex++;
        }
        
        return result;
    }

    /**
     * Codifica dados de áudio para o formato WAV
     * @param {Float32Array} samples - Amostras de áudio
     * @param {Number} format - Formato (PCM = 1)
     * @param {Number} sampleRate - Taxa de amostragem
     * @param {Number} numChannels - Número de canais
     * @param {Number} bitDepth - Profundidade de bits
     * @returns {ArrayBuffer} - Dados WAV codificados
     */
    encodeWAV(samples, format, sampleRate, numChannels, bitDepth) {
        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;
        
        const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
        const view = new DataView(buffer);
        
        // RIFF chunk descriptor
        this.writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + samples.length * bytesPerSample, true);
        this.writeString(view, 8, 'WAVE');
        
        // FMT sub-chunk
        this.writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true); // Chunk size
        view.setUint16(20, format, true); // Format code
        view.setUint16(22, numChannels, true); // Channels
        view.setUint32(24, sampleRate, true); // Sample rate
        view.setUint32(28, sampleRate * blockAlign, true); // Byte rate
        view.setUint16(32, blockAlign, true); // Block align
        view.setUint16(34, bitDepth, true); // Bits per sample
        
        // Data sub-chunk
        this.writeString(view, 36, 'data');
        view.setUint32(40, samples.length * bytesPerSample, true);
        
        // Write the PCM samples
        const offset = 44;
        if (bitDepth === 16) {
            for (let i = 0; i < samples.length; i++, offset += 2) {
                const s = Math.max(-1, Math.min(1, samples[i]));
                view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            }
        } else {
            throw new Error('Unsupported bit depth');
        }
        
        return buffer;
    }

    /**
     * Escreve uma string em um DataView
     * @param {DataView} view - View para escrever
     * @param {Number} offset - Offset para começar a escrever
     * @param {String} string - String para escrever
     */
    writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    /**
     * Retorna o nó de análise para visualização
     * @returns {AnalyserNode} - Nó de análise
     */
    getAnalyser() {
        return this.analyserNode;
    }
}