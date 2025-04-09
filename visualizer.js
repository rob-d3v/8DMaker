/**
 * Classe Visualizer para renderizar visualizações do áudio
 */
class Visualizer {
    /**
     * Inicializa o visualizador
     * @param {HTMLCanvasElement} canvas - Elemento canvas para renderização
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.canvasCtx = canvas.getContext('2d');
        this.analyser = null;
        this.dataArray = null;
        this.animationId = null;
        this.isActive = false;
        this.colorMode = 'spectrum'; // 'spectrum', 'gradient', 'solid'
        
        // Ajustar tamanho do canvas
        this.resizeCanvas();
        
        // Adicionar evento de redimensionamento
        window.addEventListener('resize', this.resizeCanvas.bind(this));
    }
    
    /**
     * Redimensiona o canvas para o tamanho do container
     */
    resizeCanvas() {
        if (this.canvas) {
            const container = this.canvas.parentElement;
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        }
    }
    
    /**
     * Conecta o visualizador ao analisador de áudio
     * @param {AnalyserNode} analyser - Nó analisador de áudio
     */
    connectAnalyser(analyser) {
        this.analyser = analyser;
        this.analyser.fftSize = 2048;
        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);
    }
    
    /**
     * Inicia o visualizador
     */
    start() {
        if (!this.analyser) return;
        
        this.isActive = true;
        this.draw();
    }
    
    /**
     * Para o visualizador
     */
    stop() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // Limpar o canvas
        if (this.canvas && this.canvasCtx) {
            this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    /**
     * Alterna o modo de cor do visualizador
     */
    toggleColorMode() {
        const modes = ['spectrum', 'gradient', 'solid'];
        const currentIndex = modes.indexOf(this.colorMode);
        this.colorMode = modes[(currentIndex + 1) % modes.length];
    }
    
    /**
     * Desenha a visualização de áudio no canvas
     */
    draw() {
        if (!this.isActive || !this.analyser) return;
        
        this.animationId = requestAnimationFrame(this.draw.bind(this));
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        this.canvasCtx.clearRect(0, 0, width, height);
        
        // Escolher o tipo de visualização com base no modo de cor
        switch (this.colorMode) {
            case 'spectrum':
                this.drawSpectrum(width, height);
                break;
            case 'gradient':
                this.drawGradient(width, height);
                break;
            case 'solid':
                this.drawSolid(width, height);
                break;
            default:
                this.drawSpectrum(width, height);
        }
    }
    
    /**
     * Desenha visualização de espectro
     * @param {Number} width - Largura do canvas
     * @param {Number} height - Altura do canvas
     */
    drawSpectrum(width, height) {
        const barWidth = width / this.dataArray.length * 2.5;
        let barHeight;
        let x = 0;
        
        for (let i = 0; i < this.dataArray.length; i++) {
            barHeight = this.dataArray[i] / 2;
            
            // Calcular cor baseada na frequência
            const hue = i / this.dataArray.length * 360;
            this.canvasCtx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            
            this.canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);
            
            x += barWidth + 1;
        }
    }
    
    /**
     * Desenha visualização de gradiente
     * @param {Number} width - Largura do canvas
     * @param {Number} height - Altura do canvas
     */
    drawGradient(width, height) {
        const gradient = this.canvasCtx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#6c63ff');
        gradient.addColorStop(0.5, '#ff6584');
        gradient.addColorStop(1, '#6c63ff');
        
        this.canvasCtx.fillStyle = gradient;
        
        this.canvasCtx.beginPath();
        this.canvasCtx.moveTo(0, height);
        
        for (let i = 0; i < this.dataArray.length; i++) {
            const x = i / this.dataArray.length * width;
            const y = height - (this.dataArray[i] / 256 * height);
            
            this.canvasCtx.lineTo(x, y);
        }
        
        this.canvasCtx.lineTo(width, height);
        this.canvasCtx.closePath();
        this.canvasCtx.fill();
    }
    
    /**
     * Desenha visualização sólida
     * @param {Number} width - Largura do canvas
     * @param {Number} height - Altura do canvas
     */
    drawSolid(width, height) {
        this.canvasCtx.fillStyle = '#4a4a9c';
        
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.min(width, height) / 2;
        
        for (let i = 0; i < this.dataArray.length; i += 5) {
            const angle = i / this.dataArray.length * Math.PI * 2;
            const radius = (this.dataArray[i] / 256) * maxRadius;
            
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            if (i === 0) {
                this.canvasCtx.beginPath();
                this.canvasCtx.moveTo(x, y);
            } else {
                this.canvasCtx.lineTo(x, y);
            }
        }
        
        this.canvasCtx.closePath();
        this.canvasCtx.fill();
    }
}