const fs = require('fs');
const path = require('path');

// Estrutura de diretórios desejada
const structure = {
  "index": ["index.html", "style.css", "script.js"],
  "user-dashboard": ["user-dashboard.html"],
  "agendar-consulta": ["agendar-consulta.html", "agendar.js"],
  "consultant-dashboard": ["consultant-dashboard.html"],
  "admin-dashboard": ["admin-dashboard.html", "admin.css", "admin.js"],
  "others": ["confirmacao.html", "pagamentos.html", "pagamentos.css", "pagamentos.js", "email-template.html"],
  "media/images": ["back2.jpg", "background.png", "dextrategia_logo.png"],
  "media/videos": [] // Adicione arquivos de vídeo manualmente, se houver
};

const baseDir = path.resolve(__dirname, 'frontend');

// Função para mover arquivos
const moveFile = (src, dest) => {
  if (fs.existsSync(src)) {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.renameSync(src, dest);
    console.log(`Movido: ${src} -> ${dest}`);
  } else {
    console.log(`Arquivo não encontrado: ${src}`);
  }
};

// Reorganizar arquivos conforme a estrutura
for (const [folder, files] of Object.entries(structure)) {
  const folderPath = path.join(baseDir, folder);

  // Criar diretório, se não existir
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  // Mover os arquivos para o diretório
  files.forEach(file => {
    const srcPath = path.join(baseDir, file);
    const destPath = path.join(folderPath, file);
    moveFile(srcPath, destPath);
  });
}

console.log("Organização concluída!");
