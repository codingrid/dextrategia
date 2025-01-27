const fs = require('fs');
const path = require('path');

// Diretórios a serem analisados
const directories = ['./backend', './frontend'];

// Arquivo de saída para as explicações
const outputFile = './documentacao.txt';

// Extensões de arquivos que queremos documentar
const allowedExtensions = ['.js', '.ts', '.py', '.html', '.css'];

function getExplanationForFile(filePath) {
    // Aqui você pode usar prompts para o Copilot melhorar as explicações
    const fileName = path.basename(filePath);
    return `
# Explicação gerada para: ${fileName}
Este arquivo faz parte do projeto. Adicione aqui uma explicação personalizada para o seu código. 
Se precisar, descreva funções, classes ou módulos.

`;
}

function processDirectory(dir, output = []) {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            processDirectory(filePath, output);
        } else if (allowedExtensions.includes(path.extname(file))) {
            const explanation = getExplanationForFile(filePath);
            const content = fs.readFileSync(filePath, 'utf-8');
            output.push(`${explanation}\n${content}\n`);
        }
    });

    return output;
}

function generateDocumentation() {
    let documentation = '';

    directories.forEach(dir => {
        if (fs.existsSync(dir)) {
            const docs = processDirectory(dir);
            documentation += docs.join('\n\n');
        } else {
            console.warn(`Diretório não encontrado: ${dir}`);
        }
    });

    fs.writeFileSync(outputFile, documentation, 'utf-8');
    console.log(`Documentação gerada em: ${outputFile}`);
}

generateDocumentation();
