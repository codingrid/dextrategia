const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'frontend');
const folders = ['images', 'videos']; // Subpastas criadas pelo script

folders.forEach(folder => {
    const folderPath = path.join(baseDir, folder);
    if (fs.existsSync(folderPath)) {
        const files = fs.readdirSync(folderPath);

        files.forEach(file => {
            const oldPath = path.join(folderPath, file);
            const newPath = path.join(baseDir, file);

            // Move o arquivo de volta para o diretório base
            fs.renameSync(oldPath, newPath);
            console.log(`Movido: ${file}`);
        });

        // Após mover os arquivos, remove a pasta vazia
        fs.rmdirSync(folderPath);
        console.log(`Pasta removida: ${folder}`);
    }
});

console.log('Arquivos revertidos para o diretório principal.');
