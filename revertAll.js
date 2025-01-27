const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'frontend');

function moveFilesBackToRoot(dir) {
    const items = fs.readdirSync(dir);

    items.forEach(item => {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
            // Recursivamente mover arquivos das subpastas
            moveFilesBackToRoot(itemPath);

            // Remover a pasta vazia
            fs.rmdirSync(itemPath);
            console.log(`Pasta removida: ${itemPath}`);
        } else {
            // Mover arquivo para o diretório raiz
            const newLocation = path.join(baseDir, path.basename(itemPath));
            fs.renameSync(itemPath, newLocation);
            console.log(`Arquivo movido: ${itemPath} -> ${newLocation}`);
        }
    });
}

// Executa o script para mover todos os arquivos de volta
moveFilesBackToRoot(baseDir);

console.log('Todos os arquivos foram movidos de volta para o diretório raiz.');
