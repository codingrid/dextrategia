document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/frontend/login.html';
        return;
    }
});

function showConsultantForm() {
    const modalHtml = `
        <div class="modal" id="consultant-modal">
            <div class="modal-content">
                <h2>Novo Consultor</h2>
                <form id="consultant-form">
                    <div class="form-group">
                        <label>Nome:</label>
                        <input type="text" name="nome" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Email:</label>
                        <input type="email" name="email" 
                               pattern=".*@consult\\.admin$"
                               placeholder="exemplo@consult.admin"
                               title="O email deve terminar com @consult.admin"
                               required>
                    </div>
                    
                    <div class="form-group">
                        <label>Senha:</label>
                        <input type="password" name="senha" minlength="6" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Especialidade:</label>
                        <input type="text" name="especialidade" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Valor/Hora (R$):</label>
                        <input type="number" name="valor_hora" step="0.01" min="0" required>
                    </div>
                    
                    <div class="form-group">
                        <label>LinkedIn URL:</label>
                        <input type="url" name="linkedin_url">
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Criar Consultor</button>
                        <button type="button" class="btn btn-secondary" onclick="closeModal('consultant-modal')">Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('consultant-form').addEventListener('submit', handleConsultantSubmit);
}

async function handleConsultantSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    try {
        const consultantData = {
            name: formData.get('nome'),
            email: formData.get('email'),
            password: formData.get('senha'),
            especialidade: formData.get('especialidade'),
            valor_hora: Number(formData.get('valor_hora')),
            linkedin_url: formData.get('linkedin_url')
        };

        if (!consultantData.email.endsWith('@consult.admin')) {
            throw new Error('Email deve terminar com @consult.admin');
        }

        console.log('Dados a serem enviados:', consultantData);

        const response = await fetch('http://localhost:3000/auth/consultants', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(consultantData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao criar consultor');
        }

        alert('Consultor criado com sucesso!');
        closeModal('consultant-modal');
        
    } catch (error) {
        console.error('Erro:', error);
        alert(error.message);
    }
}

// Função para abrir modal de novo admin
function showAdminForm() {
    console.log('Abrindo modal de admin');
    const modalHtml = `
        <div class="modal" id="admin-modal">
            <div class="modal-content">
                <h2>Novo Administrador</h2>
                <form id="admin-form">
                    <div class="form-group">
                        <label>Nome:</label>
                        <input type="text" name="nome" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Email:</label>
                        <input type="email" name="email" 
                               pattern=".*@admin\\.com$"
                               placeholder="exemplo@admin.com"
                               title="O email deve terminar com @admin.com"
                               required>
                    </div>
                    
                    <div class="form-group">
                        <label>Senha:</label>
                        <input type="password" name="senha" minlength="6" required>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Criar Administrador</button>
                        <button type="button" class="btn btn-secondary" onclick="closeModal('admin-modal')">Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('admin-form').addEventListener('submit', handleAdminSubmit);
}

async function handleAdminSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch('http://localhost:3000/auth/admin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                nome: formData.get('nome'),
                email: formData.get('email'),
                senha: formData.get('senha')
            })
        });

        if (!response.ok) {
            throw new Error('Erro ao criar administrador');
        }

        alert('Administrador criado com sucesso!');
        closeModal('admin-modal');
    } catch (error) {
        showError('Erro ao criar administrador: ' + error.message);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

function showError(message) {
    console.error(message);
    alert(message);
}