document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/frontend/login.html';
        return;
    }

    // Carrega todos os dados iniciais
    loadDashboardData();
    loadConsultores();
    loadUltimasReunioes();

    // Adiciona listeners para navegação
    setupNavigation();
});

// Setup da navegação
function setupNavigation() {
    const menuItems = document.querySelectorAll('.sidebar nav a');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('href').substring(1);
            showSection(targetId);
        });
    });
}

// Mostra a seção selecionada
function showSection(sectionId) {
    document.querySelectorAll('section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';

    // Atualiza o item ativo no menu
    document.querySelectorAll('.sidebar nav li').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`a[href="#${sectionId}"]`).parentElement.classList.add('active');
}

// Função para carregar dados do dashboard
async function loadDashboardData() {
    try {
        const token = localStorage.getItem('token');
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Carregar contagem de consultores
        const consultoresResponse = await fetch('http://localhost:3000/api/consultants/count', { headers });
        const consultoresData = await consultoresResponse.json();
        document.getElementById('total-consultores').textContent = consultoresData.count;

        // Carregar dados financeiros do mês atual
        const hoje = new Date();
        const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

        const financialResponse = await fetch(`http://localhost:3000/api/payments/summary?start=${primeiroDiaMes.toISOString()}&end=${ultimoDiaMes.toISOString()}`, { headers });
        const financialData = await financialResponse.json();
        document.getElementById('receita-mensal').textContent = `€ ${financialData.total.toFixed(2)}`;

        // Carregar contagem de clientes ativos
        const clientesResponse = await fetch('http://localhost:3000/api/users/active', { headers });
        const clientesData = await clientesResponse.json();
        document.getElementById('clientes-ativos').textContent = clientesData.count;

        // Carregar reuniões do mês
        const reunioesResponse = await fetch('http://localhost:3000/api/meetings/month-count', { headers });
        const reunioesData = await reunioesResponse.json();
        document.getElementById('total-reunioes').textContent = reunioesData.count;

    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
    }
}

// Função para carregar e exibir consultores
async function loadConsultores() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/consultants', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const consultores = await response.json();
        
        const tbody = document.querySelector('#lista-consultores tbody');
        tbody.innerHTML = ''; // Limpa a tabela atual
        
        consultores.forEach(consultor => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${consultor.name}</td>
                <td>${consultor.especialidade}</td>
                <td>€ ${consultor.valor_hora.toFixed(2)}</td>
                <td>
                    <button class="btn btn-primary" onclick="editConsultor(${consultor.id})">Editar</button>
                    <button class="btn btn-danger" onclick="deleteConsultor(${consultor.id})">Excluir</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Atualizar também o select de consultores na seção de reuniões
        const selectConsultor = document.getElementById('consultant-filter');
        if (selectConsultor) {
            selectConsultor.innerHTML = '<option value="">Todos os Consultores</option>';
            consultores.forEach(consultor => {
                selectConsultor.innerHTML += `
                    <option value="${consultor.id}">${consultor.name}</option>
                `;
            });
        }

    } catch (error) {
        console.error('Erro ao carregar consultores:', error);
    }
}

// Função para carregar últimas reuniões
async function loadUltimasReunioes() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/meetings/recent', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Erro ao carregar reuniões');

        const reunioes = await response.json();
        const tableBody = document.querySelector('#ultimas-reunioes tbody');

        if (!reunioes || reunioes.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">Nenhuma reunião encontrada</td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = reunioes.map(reuniao => {
            // Formata a data para o padrão brasileiro
            const data = new Date(reuniao.data_consulta).toLocaleDateString('pt-BR');
            
            return `
                <tr>
                    <td>${data}</td>
                    <td>${reuniao.consultor}</td>
                    <td>${reuniao.cliente}</td>
                    <td><span class="status-badge ${reuniao.status.toLowerCase()}">${reuniao.status}</span></td>
                    <td>${reuniao.tipo_servico}</td>
                    <td>${reuniao.tipo_reuniao}</td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Erro ao carregar reuniões:', error);
        document.querySelector('#ultimas-reunioes tbody').innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger">
                    Erro ao carregar reuniões. Por favor, tente novamente.
                </td>
            </tr>
        `;
    }
}

// Funções para modal de novo consultor
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
                        <label>Valor/Hora (€):</label>
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

// Handler do formulário de novo consultor
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

        const response = await fetch('http://localhost:3000/auth/consultants', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(consultantData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao criar consultor');
        }

        alert('Consultor criado com sucesso!');
        closeModal('consultant-modal');
        
        // Recarrega os dados
        await loadDashboardData();
        await loadConsultores();
        
    } catch (error) {
        console.error('Erro:', error);
        alert(error.message);
    }
}

// Função para modal de novo admin
function showAdminForm() {
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

// Handler do formulário de novo admin
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

// Função para fechar modais
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

// Função para mostrar erros
function showError(message) {
    console.error(message);
    alert(message);
}

// Adiciona estilos para os status das reuniões
const style = document.createElement('style');
style.textContent = `
    .status-badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.875rem;
        display: inline-block;
    }

    .status-badge.agendada {
        background-color: #ebf5ff;
        color: #1a56db;
    }

    .status-badge.hoje {
        background-color: #fef3c7;
        color: #92400e;
    }

    .status-badge.concluida {
        background-color: #def7ec;
        color: #03543f;
    }

    .text-center {
        text-align: center;
    }

    .text-danger {
        color: #dc2626;
    }
`;
// Faz logout
async function logout() {
    try {
        await fetch('http://localhost:3000/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    } finally {
        localStorage.removeItem('token');
        window.location.href = '/index.html';
    }
}