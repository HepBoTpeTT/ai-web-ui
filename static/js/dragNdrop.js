// Получаем элемент области дропа
const dropArea = document.querySelector('body');


// Предотвращаем стандартное поведение браузера при перетаскивании файлов
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false); // Предотвращаем стандартное поведение
    document.body.addEventListener(eventName, preventDefaults, false); // Для всего документа
});

// Добавляем классы для визуальной индикации
['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

// Обработка события дропа
dropArea.addEventListener('drop', handleDrop, false);

// Функция для предотвращения стандартного поведения
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Функция для выделения области дропа
function highlight() {
    dropArea.classList.add('highlight');
}

// Функция для снятия выделения
function unhighlight() {
    dropArea.classList.remove('highlight');
}

// Функция для обработки дропа файлов
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files; // Получаем файлы из события дропа

    handleFiles(files); // Обрабатываем файлы
}

// Функция для обработки файлов
function handleFiles(files) {
    const dataTransfer = new DataTransfer();
    
    for (let i = 0; i < files.length; i++) {
        dataTransfer.items.add(files[i]);
    }
    
    document.querySelector('input[type="file"]').files = dataTransfer.files;

    const event = new Event('change', {
        bubbles: true,
        cancelable: true
    });
    document.querySelector('input[type="file"]').dispatchEvent(event);
}
