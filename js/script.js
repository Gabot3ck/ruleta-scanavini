// Selección de elementos del DOM
const roulette = document.querySelector("#roulette");
const spinButton = document.querySelector("#spin");
const arrow = document.querySelector("#arrow");

// Ocultar el botón de reset ya que lo eliminaremos de la funcionalidad
const resetButton = document.querySelector("#reset");
if (resetButton) {
    resetButton.style.display = "none";
}

// Configuración básica
const maxSpins = 10;
const minSpins = 5;
const maxDegrees = 360;
const minDegrees = 1;

// Obtener las secciones de la ruleta
const sections = document.querySelectorAll('.roulette-section');
const sectionAngle = 360 / sections.length;

// Variables para el sistema de arrastre
let isDragging = false;
let startAngle = 0;
let currentRotation = 0;
let startRotation = 0;
let dragSpeed = 0;
let lastDragTime = 0;
let lastDragAngle = 0;
let dragSamples = [];
const maxSamples = 5; // Número de muestras para calcular la velocidad

// Estado para controlar si la ruleta está girando
let isSpinning = false;

// Obtener un número aleatorio entre un mínimo y un máximo
const getRandomNumber = (min, max) => {
    return Math.round(Math.random() * (max - min) + min);
};

// Función para convertir grados a radianes
const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
};

// Función para convertir radianes a grados
const toDegrees = (radians) => {
    return radians * (180 / Math.PI);
};

// Función para calcular el ángulo entre dos puntos con respecto al centro
const calculateAngle = (centerX, centerY, pointX, pointY) => {
    return toDegrees(Math.atan2(pointY - centerY, pointX - centerX));
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
    const lostSound = new Audio('../sounds/lost-sound.mp3');
    
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
        },
        playLosing: () => {
            lostSound.currentTime = 0;
            lostSound.play().catch(e => console.log("Error al reproducir sonido:", e));
        }
    };
};

// Crear los efectos de sonido
const sounds = addSoundEffects();

// Función para mostrar confeti cuando se determina un ganador
const showConfetti = () => {
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
    const message = document.createElement('p');
    title.className = 'winner-title';
    message.className = 'winner-message';

    if( prizeName !== 'Siga participando' ){
        title.textContent = '¡Felicidades!';
        ( prizeName === 'Huincha' || prizeName === 'Sorpresa' ) 
        ? message.innerHTML = `Has ganado una: <strong>${prizeName}</strong>`
        : message.innerHTML = `Has ganado un: <strong>${prizeName}</strong>`;
        
    } else {
        title.innerHTML = '¡Suerte para la próxima!';
        message.innerHTML = `<strong>${prizeName}</strong>`;
    }
    
    
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

// Función para iniciar el giro con una velocidad dada (basada en el arrastre)
const spinWithDragSpeed = (speed) => {
    if (isSpinning) return;
    isSpinning = true;
    
    // Asegurarse de que la velocidad tenga un mínimo
    let actualSpeed = Math.abs(speed);
    if (actualSpeed < 200) actualSpeed = 200;
    
    // Calcular un número de giros basado en la velocidad
    const spinsBase = Math.min(Math.max(actualSpeed / 100, minSpins), maxSpins);
    const spins = spinsBase + getRandomNumber(0, 2); // Añade algo de aleatoriedad
    
    // Calcular grados adicionales
    const degrees = getRandomNumber(minDegrees, maxDegrees);
    
    // Determinar la dirección basada en el signo de la velocidad
    const direction = speed >= 0 ? 1 : -1;
    
    // Calcular la rotación total
    const fullSpins = spins * 360 * direction;
    const spin = currentRotation + fullSpins + (degrees * direction);
    
    // Actualizar la rotación actual
    currentRotation = spin;
    
    // Calcular el tiempo de animación basado en la velocidad
    const animationTime = Math.min(Math.max(spins * 0.5, 3), 8); // Entre 3 y 8 segundos
    
    // Reproducir sonido de ticking
    sounds.playTicking();
    
    // Animar la ruleta
    roulette.style.transition = `transform ${animationTime}s cubic-bezier(0.1, 0.7, 0.1, 1)`;
    roulette.style.transform = `rotate(${spin}deg)`;
    
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
        
        
        // Detener la sacudida de la flecha
        clearInterval(shakeInterval);
        
        // Determinar el premio ganador
        const prizeName = determineWinner(spin);
        
        if (prizeName !== 'Siga participando') {
            // Mostrar confeti
            showConfetti();
            // sonido de premiado
            sounds.playFinish();
        } else {
            // sonido de derrota
            sounds.playLosing();
        }
        
        // Mostrar modal con el premio
        setTimeout(() => {
            createWinnerModal(prizeName);
            isSpinning = false;
        }, 1000);
        
    }, animationTime * 1000);
};

// Inicializar eventos para el arrastre
const initDragEvents = () => {
    // Obtener el centro de la ruleta
    const rouletteRect = roulette.getBoundingClientRect();
    const centerX = rouletteRect.left + rouletteRect.width / 2;
    const centerY = rouletteRect.top + rouletteRect.height / 2;
    
    // Función para manejar el inicio del arrastre
    const handleDragStart = (e) => {
        if (isSpinning) return;
        
        // Obtener las coordenadas del evento (táctil o ratón)
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        if (clientX === undefined || clientY === undefined) return;
        
        // Indicar que se está arrastrando
        isDragging = true;
        
        // Calcular el ángulo inicial
        startAngle = calculateAngle(centerX, centerY, clientX, clientY);
        
        // Guardar la rotación actual
        startRotation = currentRotation;
        
        // Resetear las muestras de arrastre
        dragSamples = [];
        lastDragTime = Date.now();
        lastDragAngle = startAngle;
        
        // Desactivar la transición durante el arrastre
        roulette.style.transition = 'none';
        
        // Cambiar el cursor
        roulette.style.cursor = 'grabbing';
        
        // Añadir clase para indicar que se está arrastrando
        roulette.classList.add('dragging');
    };
    
    // Función para manejar el movimiento durante el arrastre
    const handleDragMove = (e) => {
        if (!isDragging || isSpinning) return;
        
        // Obtener las coordenadas del evento (táctil o ratón)
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        if (clientX === undefined || clientY === undefined) return;
        
        // Calcular el ángulo actual
        const currentAngle = calculateAngle(centerX, centerY, clientX, clientY);
        
        // Calcular la diferencia de ángulo
        let angleDiff = currentAngle - startAngle;
        
        // Ajustar la rotación
        currentRotation = startRotation + angleDiff;
        roulette.style.transform = `rotate(${currentRotation}deg)`;
        
        // Calcular y guardar la velocidad de arrastre
        const now = Date.now();
        const timeDiff = now - lastDragTime;
        
        if (timeDiff > 20) { // Solo registrar cada 20ms para suavizar
            // Calcular velocidad angular (grados por segundo)
            const angleDelta = currentAngle - lastDragAngle;
            const speed = angleDelta / (timeDiff / 1000);
            
            // Añadir a las muestras
            dragSamples.push(speed);
            if (dragSamples.length > maxSamples) {
                dragSamples.shift();
            }
            
            // Actualizar valores para la próxima muestra
            lastDragTime = now;
            lastDragAngle = currentAngle;
        }
    };
    
    // Función para manejar el fin del arrastre
    const handleDragEnd = () => {
        if (!isDragging || isSpinning) return;
        
        // Ya no se está arrastrando
        isDragging = false;
        
        // Calcular la velocidad media de las últimas muestras
        if (dragSamples.length > 0) {
            dragSpeed = dragSamples.reduce((sum, speed) => sum + speed, 0) / dragSamples.length;
            
            // Si la velocidad es significativa, iniciar el giro
            if (Math.abs(dragSpeed) > 20) {
                // Convertir la velocidad angular a una medida que funcione con nuestro sistema de giro
                // Factor de escala para convertir velocidad angular a "impulso" para el giro
                const scaleFactor = 10;
                const spinImpulse = dragSpeed * scaleFactor;
                
                // Iniciar el giro con la velocidad calculada
                spinWithDragSpeed(spinImpulse);
            }
        }
        
        // Restaurar el cursor
        roulette.style.cursor = 'grab';
        
        // Quitar clase de arrastre
        roulette.classList.remove('dragging');
    };
    
    // Registrar los eventos para ratón
    roulette.addEventListener('mousedown', handleDragStart);
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    
    // Registrar los eventos para táctil
    roulette.addEventListener('touchstart', handleDragStart, { passive: true });
    window.addEventListener('touchmove', handleDragMove, { passive: true });
    window.addEventListener('touchend', handleDragEnd);
    
    // Evitar el comportamiento predeterminado del navegador
    roulette.addEventListener('dragstart', (e) => e.preventDefault());
};

// Mantener el botón de giro como una alternativa
spinButton.addEventListener("click", () => {
    if (isSpinning) return;
    
    // Generar un giro aleatorio
    const spins = getRandomNumber(minSpins, maxSpins);
    const degrees = getRandomNumber(minDegrees, maxDegrees);
    const fullSpins = spins * 360;
    const spin = currentRotation + fullSpins + degrees;
    
    // Actualizar la rotación actual
    currentRotation = spin;
    
    // Calcular tiempo de animación
    const animationTime = spins * 0.5 + 1;
    
    // Iniciar el giro
    roulette.style.transition = `transform ${animationTime}s cubic-bezier(0.1, 0.7, 0.1, 1)`;
    roulette.style.transform = `rotate(${spin}deg)`;
    
    // Reproducir sonido de ticking
    sounds.playTicking();
    
    // Marcar como girando
    isSpinning = true;
    
    // Cuando la animación termine
    setTimeout(() => {
        // Detener el sonido de ticking y reproducir el sonido de finalización
        sounds.stopTicking();
        
        
        // Determinar el premio ganador
        const prizeName = determineWinner(spin);
        

        if (prizeName !== 'Siga participando') {
            // Mostrar confeti
            showConfetti();
            // sonido de premiado
            sounds.playFinish();
        } else {
            // sonido de derrota
            sounds.playLosing();
        }
        
        // Mostrar modal con el premio
        setTimeout(() => {
            createWinnerModal(prizeName);
            isSpinning = false;
        }, 1000);
        
    }, animationTime * 1000);
});

// Añadir CSS para las nuevas funcionalidades
const addStyles = () => {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        
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
            cursor: grab;
            user-select: none;
            touch-action: none;
        }
        
        #roulette.dragging {
            cursor: grabbing;
        }
        
        /* Estilo para la flecha */
        #arrow {
            filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.7));
        }
        
        .show-indicator .drag-indicator {
            opacity: 1;
        }
    `;
    
    document.head.appendChild(styleEl);
};

// Añadir un indicador para el arrastre (opcional)
const addDragIndicator = () => {
    const indicator = document.createElement('div');
    indicator.className = 'drag-indicator';
    indicator.textContent = '¡Arrastra para girar!';
    
    const container = document.querySelector('.roulette-container');
    container.appendChild(indicator);
    
    // Mostrar el indicador brevemente cuando se carga la página
    setTimeout(() => {
        container.classList.add('show-indicator');
        
        setTimeout(() => {
            container.classList.remove('show-indicator');
        }, 3000);
    }, 1000);
    
    // Mostrar el indicador cuando el usuario toque la ruleta pero no arrastre
    let touchTimeout;
    roulette.addEventListener('touchstart', () => {
        touchTimeout = setTimeout(() => {
            if (!isDragging) {
                container.classList.add('show-indicator');
                setTimeout(() => {
                    container.classList.remove('show-indicator');
                }, 2000);
            }
        }, 500);
    });
    
    roulette.addEventListener('touchmove', () => {
        clearTimeout(touchTimeout);
    });
};

// Inicializar todo
const init = () => {
    addStyles();
    initDragEvents();
    addDragIndicator();
    
    // Hacer que la ruleta sea arrastrable desde el inicio
    roulette.style.cursor = 'grab';
};

// Iniciar cuando la página esté cargada
document.addEventListener('DOMContentLoaded', init);
