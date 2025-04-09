/**
 * Aplicativo de conversão de música para 8D
 */
document.addEventListener('DOMContentLoaded', () => {
    // Elementos da interface
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const processButton = document.getElementById('process-button');
    const pauseButton = document.getElementById('pause-button');
    const downloadButton = document.getElementById('download-button');
    const resetButton = document.getElementById('reset-button');
    const statusMessage = document.getElementById('status-message');
    const progressContainer = document.getElementById('progress-container');
    const progressBar = document.getElementById('progress-bar');
    const playerContainer = document.getElementById('player-container');
    const audioPlayer = document.getElementById('audio-player');
    const visualizerContainer = document.getElementById('visualizer-container');
    const visualizerCanvas = document.getElementById('visualizer');
    const presetButtons = document.querySelectorAll('.preset-button');
    
    // Controles
    const panSpeedControl = document.getElementById('pan-speed');
    const panSpeedValue = document.getElementById('pan-speed-value');
    const panAmountControl = document.getElementById('pan-amount');
    const panAmountValue = document.getElementById('pan-amount-value');
    const reverbAmountControl = document.getElementById('reverb-amount');
    const reverbAmountValue = document.getElementById('reverb-amount-value');
    const roomSizeControl = document.getElementById('room-size');
    const roomSizeValue = document.getElementById('room-size-value');
    const echoDelayControl = document.getElementById('echo-delay');
    const echoDelayValue = document.getElementById('echo-delay-value');
    const echoFeedbackControl = document.getElementById('echo-feedback');
    const echoFeedbackValue = document.getElementById('echo-feedback-value');
    const panPatternControl = document.getElementById('pan-pattern');
    const bassBoostControl = document.getElementById('bass-boost');
    const bassBoostValue = document.getElementById('bass-boost-value');
    
    // Estado da aplicação
    let selectedFile = null;
    let processedAudioBlob = null;
    
    // Inicializar processador de áudio e visualizador
    const audioProcessor = new AudioProcessor();
    const visualizer = new Visualizer(visualizerCanvas);
    
    /**
     * Atualiza o estado dos botões com base no estado da aplicação
     */
    function updateButtonStates() {
        processButton.disabled = !selectedFile;
        pauseButton.disabled = !selectedFile || !audioProcessor.processingStarted;
        downloadButton.disabled = !processedAudioBlob;
    }
    
    /**
     * Exibe mensagem de status
     * @param {String} message - Mensagem a ser exibida
     * @param {String} type - Tipo de mensagem ('success' ou 'error')
     */
    function showStatusMessage(message, type = 'success') {
        statusMessage.textContent = message;
        statusMessage.className = `status ${type}`;
        statusMessage.classList.remove('hidden');
        
        // Ocultar após 5 segundos
        setTimeout(() => {
            statusMessage.classList.add('hidden');
        }, 5000);
    }
    
    /**
     * Atualiza a barra de progresso
     * @param {Number} progress - Progresso (0-1)
     */
    function updateProgress(progress) {
        const percent = Math.round(progress * 100);
        progressBar.style.width = `${percent}%`;
        progressBar.textContent = `${percent}%`;
    }
    
    /**
     * Lê o arquivo selecionado pelo usuário
     * @param {File} file - Arquivo de áudio
     */
    async function handleFile(file) {
        try {
            selectedFile = file;
            
            // Atualizar nome do arquivo na área de upload
            const fileNameElement = dropArea.querySelector('p');
            fileNameElement.textContent = `Arquivo selecionado: ${file.name}`;
            
            // Carregar o arquivo no processador de áudio
            await audioProcessor.loadAudioFile(file);
            
            // Atualizar estados dos botões
            updateButtonStates();
            
            showStatusMessage('Arquivo carregado com sucesso!');
        } catch (error) {
            console.error('Erro ao carregar o arquivo:', error);
            showStatusMessage(`Erro ao carregar o arquivo: ${error.message}`, 'error');
        }
    }
    
    /**
     * Obtém as configurações atuais dos controles
     * @returns {Object} - Configurações atuais
     */
    function getCurrentSettings() {
        return {
            panSpeed: parseFloat(panSpeedControl.value),
            panAmount: parseFloat(panAmountControl.value),
            reverbAmount: parseFloat(reverbAmountControl.value),
            roomSize: parseFloat(roomSizeControl.value),
            echoDelay: parseFloat(echoDelayControl.value),
            echoFeedback: parseFloat(echoFeedbackControl.value),
            panPattern: panPatternControl.value,
            bassBoost: parseFloat(bassBoostControl.value)
        };
    }
    
    /**
     * Aplica configurações aos controles da interface
     * @param {Object} settings - Configurações a serem aplicadas
     */
    function applySettings(settings) {
        panSpeedControl.value = settings.panSpeed;
        panSpeedValue.textContent = `${settings.panSpeed.toFixed(1)} Hz`;
        
        panAmountControl.value = settings.panAmount;
        panAmountValue.textContent = settings.panAmount.toFixed(1);
        
        reverbAmountControl.value = settings.reverbAmount;
        reverbAmountValue.textContent = settings.reverbAmount.toFixed(1);
        
        roomSizeControl.value = settings.roomSize;
        roomSizeValue.textContent = settings.roomSize.toFixed(1);
        
        echoDelayControl.value = settings.echoDelay;
        echoDelayValue.textContent = `${settings.echoDelay.toFixed(1)} s`;
        
        echoFeedbackControl.value = settings.echoFeedback;
        echoFeedbackValue.textContent = settings.echoFeedback.toFixed(1);
        
        panPatternControl.value = settings.panPattern;
        
        bassBoostControl.value = settings.bassBoost;
        bassBoostValue.textContent = `${settings.bassBoost} dB`;
    }
    
    /**
     * Alterna entre pausar e reproduzir o áudio
     */
    function togglePause() {
        if (!audioProcessor.processingStarted) {
            // Se a reprodução não começou, não faça nada
            return;
        }
        
        if (audioProcessor.isPaused) {
            // Se estiver pausado, retome a reprodução
            audioProcessor.resume();
            pauseButton.textContent = 'Pausar';
        } else {
            // Se estiver reproduzindo, pause
            audioProcessor.pause();
            pauseButton.textContent = 'Continuar';
        }
    }
    
    /**
     * Processa o áudio com as configurações atuais
     */
    async function processAudio() {
        if (!selectedFile) return;
        
        try {
            // Ocultar player anterior
            playerContainer.classList.add('hidden');
            
            // Mostrar barra de progresso
            progressContainer.classList.remove('hidden');
            updateProgress(0);
            
            // Obter configurações atuais
            const settings = getCurrentSettings();
            
            // Processar áudio para visualização
            processButton.disabled = true;
            await audioProcessor.processAudio(settings);
            
            // Habilitar botão de pausa
            pauseButton.disabled = false;
            
            // Conectar visualizador
            visualizer.connectAnalyser(audioProcessor.getAnalyser());
            visualizerContainer.classList.remove('hidden');
            visualizer.start();
            
            // Mostrar player
            const audioUrl = URL.createObjectURL(selectedFile);
            audioPlayer.src = audioUrl;
            playerContainer.classList.remove('hidden');
            
            // Processar e exportar áudio separadamente (em background)
            setTimeout(async () => {
                try {
                    // Exportar áudio processado
                    progressContainer.classList.remove('hidden');
                    const blob = await audioProcessor.exportAudio({
                        ...settings,
                        onProgress: updateProgress
                    });
                    
                    // Definir explicitamente o blob processado
                    processedAudioBlob = blob;
                    
                    // Habilitar o botão de download
                    downloadButton.disabled = false;
                    
                    showStatusMessage('Áudio processado com sucesso! Download disponível.');
                } catch (exportError) {
                    console.error('Erro na exportação:', exportError);
                    showStatusMessage('Erro ao exportar o áudio: ' + exportError.message, 'error');
                } finally {
                    progressContainer.classList.add('hidden');
                }
            }, 100);
            
        } catch (error) {
            console.error('Erro ao processar o áudio:', error);
            showStatusMessage(`Erro ao processar o áudio: ${error.message}`, 'error');
            processButton.disabled = false;
            progressContainer.classList.add('hidden');
        }
    }
    
    /**
     * Baixa o áudio processado
     */
    function downloadProcessedAudio() {
        if (!processedAudioBlob) {
            showStatusMessage('Nenhum áudio processado disponível para download', 'error');
            return;
        }
        
        console.log("Iniciando download de blob:", processedAudioBlob);
        
        const fileName = selectedFile.name.replace(/\.[^/.]+$/, '') + '_8D.wav';
        const url = URL.createObjectURL(processedAudioBlob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        showStatusMessage('Download iniciado!');
    }
    
    /**
     * Reseta a aplicação
     */
    function resetApp() {
        // Resetar arquivo selecionado
        selectedFile = null;
        processedAudioBlob = null;
        
        // Resetar áudio
        audioProcessor.stop();
        
        // Parar visualizador
        visualizer.stop();
        
        // Resetar interface
        dropArea.querySelector('p').textContent = 'Arraste e solte um arquivo de áudio aqui ou clique para selecionar';
        playerContainer.classList.add('hidden');
        visualizerContainer.classList.add('hidden');
        audioPlayer.src = '';
        pauseButton.textContent = 'Pausar';
        
        // Resetar controles para valores padrão
        applySettings(Presets.default);
        
        // Atualizar estados dos botões
        updateButtonStates();
        
        showStatusMessage('Aplicação resetada');
    }
    
    // Evento para área de upload por arrastar e soltar
    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('drag-over');
    });
    
    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('drag-over');
    });
    
    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('drag-over');
        
        if (e.dataTransfer.files.length) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('audio/')) {
                handleFile(file);
            } else {
                showStatusMessage('Por favor, selecione um arquivo de áudio válido.', 'error');
            }
        }
    });
    
    // Evento para clique na área de upload
    dropArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Evento para seleção de arquivo
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            const file = e.target.files[0];
            if (file.type.startsWith('audio/')) {
                handleFile(file);
            } else {
                showStatusMessage('Por favor, selecione um arquivo de áudio válido.', 'error');
            }
        }
    });
    
    // Eventos para botões
    processButton.addEventListener('click', processAudio);
    pauseButton.addEventListener('click', togglePause);
    downloadButton.addEventListener('click', downloadProcessedAudio);
    resetButton.addEventListener('click', resetApp);
    
    // Eventos para controles deslizantes
    panSpeedControl.addEventListener('input', () => {
        panSpeedValue.textContent = `${parseFloat(panSpeedControl.value).toFixed(1)} Hz`;
    });
    
    panAmountControl.addEventListener('input', () => {
        panAmountValue.textContent = parseFloat(panAmountControl.value).toFixed(1);
    });
    
    reverbAmountControl.addEventListener('input', () => {
        reverbAmountValue.textContent = parseFloat(reverbAmountControl.value).toFixed(1);
    });
    
    roomSizeControl.addEventListener('input', () => {
        roomSizeValue.textContent = parseFloat(roomSizeControl.value).toFixed(1);
    });
    
    echoDelayControl.addEventListener('input', () => {
        echoDelayValue.textContent = `${parseFloat(echoDelayControl.value).toFixed(1)} s`;
    });
    
    echoFeedbackControl.addEventListener('input', () => {
        echoFeedbackValue.textContent = parseFloat(echoFeedbackControl.value).toFixed(1);
    });
    
    bassBoostControl.addEventListener('input', () => {
        bassBoostValue.textContent = `${parseInt(bassBoostControl.value)} dB`;
    });
    
    // Eventos para botões de predefinição
    presetButtons.forEach(button => {
        button.addEventListener('click', () => {
            const presetName = button.getAttribute('data-preset');
            const presetSettings = Presets.getByName(presetName);
            applySettings(presetSettings);
            
            showStatusMessage(`Predefinição "${presetName}" aplicada!`);
        });
    });
    
    // Configurar visualizador quando clicado
    visualizerContainer.addEventListener('click', () => {
        visualizer.toggleColorMode();
    });
    
    // Botão para copiar código PIX
    const copyPixButton = document.getElementById('copy-pix-button');
    const pixText = document.getElementById('pix-text');
    
    if (copyPixButton && pixText) {
        copyPixButton.addEventListener('click', () => {
            pixText.select();
            document.execCommand('copy');
            
            // Feedback visual
            const originalText = copyPixButton.textContent;
            copyPixButton.textContent = 'Copiado!';
            copyPixButton.style.backgroundColor = '#28a745';
            
            setTimeout(() => {
                copyPixButton.textContent = originalText;
                copyPixButton.style.backgroundColor = '#6c63ff';
            }, 2000);
            
            // Deselecionar o texto
            window.getSelection().removeAllRanges();
        });
    }
    
    // Inicializar com configurações padrão
    applySettings(Presets.default);
    
    // Atualizar estados dos botões
    updateButtonStates();
});