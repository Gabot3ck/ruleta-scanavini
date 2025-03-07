// Selección de elementos del DOM
const roulette = document.querySelector("#roulette");
const spinButton = document.querySelector("#spin");
const resetButton = document.querySelector("#reset");
const arrow = document.querySelector("#arrow");

// Configuración básica
const maxSpins = 10;
const minSpins = 4; // Aumentado para garantizar un giro más prolongado
const maxDegrees = 360;
const minDegrees = 1;

// Obtener las secciones de la ruleta
const sections = document.querySelectorAll('.roulette-section');
const sectionAngle = 360 / sections.length;

// Obtener un número aleatorio entre un mínimo y un máximo
const getRandomNumber = (min, max) => {
    return Math.round(Math.random() * (max - min) + min);
};

// Función para hacer "trampa" y seleccionar un premio específico
const selectPrize = (prizeIndex) => {
    // Calculamos el ángulo necesario para que la flecha apunte al premio
    // El +0.5 es para apuntar al centro de la sección
    const targetAngle = (prizeIndex + 0.5) * sectionAngle;
    
    // Calculamos la rotación necesaria (sumamos giros completos para el efecto)
    const spins = getRandomNumber(minSpins, maxSpins);
    const spin = (spins * 360) + (360 - targetAngle);
    
    return spin;
};

// Detectar el premio ganador después de girar
const determineWinner = (finalRotation) => {
    // Normalizar la rotación a un valor entre 0-360
    const normalizedRotation = finalRotation % 360;
    
    // Determinar qué sección está en la posición ganadora (arriba)
    const winningIndex = Math.floor(normalizedRotation / sectionAngle);
    
    // Obtener el nombre del premio
    const winningSection = sections[sections.length - 1 - winningIndex];
    if (winningSection) {
        const prizeName = winningSection.querySelector('p').textContent;
        return prizeName;
    }
    
    return "No se pudo determinar el premio";
};

// Agregar efectos de sonido
const addSoundEffects = () => {
    const tickingSound = new Audio('../sounds/ticking-sound.mp3');
    const finishSound = new Audio('../sounds/finish-sound.mp3');
    
    return {
        playTicking: () => {
            tickingSound.currentTime = 0;
            tickingSound.loop = true;
            tickingSound.play().catch(e => console.log("Error al reproducir sonido:", e));
        },
        stopTicking: () => {
            tickingSound.pause();
            tickingSound.currentTime = 0;
        },
        playFinish: () => {
            finishSound.currentTime = 0;
            finishSound.play().catch(e => console.log("Error al reproducir sonido:", e));
        }
    };
};

// Crear los efectos de sonido
const sounds = addSoundEffects();

// Función para mostrar confeti cuando se determina un ganador
const showConfetti = () => {
    // Aquí puedes implementar la animación de confeti con canvas
    // Por ahora, usaremos un ejemplo simple con divs
    
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    document.body.appendChild(confettiContainer);
    
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', 
                    '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', 
                    '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];
    
    // Crear 150 piezas de confeti
    for (let i = 0; i < 150; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.animationDelay = Math.random() * 5 + 's';
        confetti.style.animationDuration = Math.random() * 3 + 2 + 's';
        
        confettiContainer.appendChild(confetti);
    }
    
    // Eliminar el confeti después de 5 segundos
    setTimeout(() => {
        confettiContainer.remove();
    }, 5000);
};

// Crear un modal para mostrar el premio ganador
const createWinnerModal = (prizeName) => {
    const modal = document.createElement('div');
    modal.className = 'winner-modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'winner-modal-content';
    
    const closeButton = document.createElement('span');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => modal.remove();
    
    const title = document.createElement('h2');
    title.textContent = '¡Felicidades!';
    
    const message = document.createElement('p');
    message.textContent = `Has ganado: ${prizeName}`;
    
    modalContent.appendChild(closeButton);
    modalContent.appendChild(title);
    modalContent.appendChild(message);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
    
    // Añadir evento para cerrar al hacer clic fuera del modal
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.remove();
        }
    };
};

// Estado para controlar si la ruleta está girando
let isSpinning = false;

// Evento para girar la ruleta
spinButton.addEventListener("click", () => {
    // Evitar múltiples clics mientras gira
    if (isSpinning) return;
    isSpinning = true;
    
    // Ocultar el botón de girar y mostrar el de reset
    spinButton.style.display = "none";
    resetButton.style.display = "inline-block";
    
    // Determinar la rotación (aleatoria o controlada)
    // Para hacer "trampa" y seleccionar un premio específico, descomenta la siguiente línea:
    // const spin = selectPrize(2); // Elige el tercer premio (índice 2)
    
    // Para una rotación totalmente aleatoria:
    const spins = getRandomNumber(minSpins, maxSpins);
    const degrees = getRandomNumber(minDegrees, maxDegrees);
    const fullSpins = spins * 360;
    const spin = fullSpins + degrees;
    
    // Calcular el tiempo de animación basado en la cantidad de giros
    const animationTime = spins * 0.5 + 1; // Tiempo base + tiempo por giro
    
    // Reproducir sonido de ticking
    sounds.playTicking();
    
    // Animar la ruleta
    roulette.style.transform = `rotate(${spin}deg)`;
    roulette.style.transitionDuration = `${animationTime}s`;
    roulette.style.transitionTimingFunction = "cubic-bezier(0.1, 0.7, 0.1, 1)"; // Efecto de desaceleración
    
    // Sacudir ligeramente la flecha para efecto visual
    const shakeArrow = () => {
        arrow.classList.add('shake-animation');
        setTimeout(() => {
            arrow.classList.remove('shake-animation');
        }, 500);
    };
    
    // Sacudir la flecha algunas veces durante la rotación
    const shakeInterval = setInterval(shakeArrow, 1000);
    
    // Cuando la animación termine
    setTimeout(() => {
        // Detener el sonido de ticking y reproducir el sonido de finalización
        sounds.stopTicking();
        sounds.playFinish();
        
        // Detener la sacudida de la flecha
        clearInterval(shakeInterval);
        
        // Determinar el premio ganador
        const prizeName = determineWinner(spin);
        
        // Mostrar confeti
        showConfetti();
        
        // Mostrar modal con el premio
        setTimeout(() => {
            createWinnerModal(prizeName);
            isSpinning = false;
        }, 1000);
        
    }, animationTime * 1000);
});

// Evento para resetear la ruleta
resetButton.addEventListener("click", () => {
    // Evitar resetear mientras está girando
    if (isSpinning) return;
    
    // Resetear la ruleta con una animación más corta
    roulette.style.transform = "rotate(0deg)";
    roulette.style.transitionDuration = "1s";
    
    // Cambiar los botones
    spinButton.style.display = "inline-block";
    resetButton.style.display = "none";
});

// Añadir CSS para las nuevas funcionalidades
const addStyles = () => {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        /* Estilos para la animación de sacudida de la flecha */
        @keyframes shake {
            0% { transform: rotate(224deg); }
            25% { transform: rotate(219deg); }
            50% { transform: rotate(224deg); }
            75% { transform: rotate(229deg); }
            100% { transform: rotate(224deg); }
        }
        
        .shake-animation {
            animation: shake 0.5s ease-in-out;
        }
        
        /* Estilos para el confeti */
        .confetti-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            overflow: hidden;
        }
        
        .confetti {
            position: absolute;
            top: -10px;
            width: 10px;
            height: 10px;
            opacity: 0.7;
            animation: fall linear forwards;
        }
        
        @keyframes fall {
            0% {
                top: -10px;
                transform: rotate(0deg) translateX(0);
            }
            100% {
                top: 100vh;
                transform: rotate(720deg) translateX(100px);
            }
        }
        
        /* Estilos para el modal */
        .winner-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        }
        
        .winner-modal-content {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            position: relative;
            width: 80%;
            max-width: 400px;
            animation: modalAppear 0.5s ease-out forwards;
        }
        
        @keyframes modalAppear {
            from {
                transform: scale(0.5);
                opacity: 0;
            }
            to {
                transform: scale(1);
                opacity: 1;
            }
        }
        
        .close-button {
            position: absolute;
            top: 10px;
            right: 15px;
            font-size: 24px;
            cursor: pointer;
        }
        
        /* Mejoras en la ruleta */
        #roulette {
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
            border: 10px solid #fff;
        }
        
        /* Estilos para los botones */
        .button-container button {
            transition: all 0.3s ease;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .button-container button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
        }
        
        .button-container button:active {
            transform: translateY(1px);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
    `;
    
    document.head.appendChild(styleEl);
};

// Inicializar estilos adicionales
addStyles();