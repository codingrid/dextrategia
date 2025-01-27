// Dados pré-existentes de consultores
const CONSULTORES_INICIAIS = [
    {
        nome: 'Ricardo Almeida',
        especialidade: 'Gestão Financeira',
        valor_hora: 60.00,
        linkedin_url: 'https://linkedin.com/in/ricardoalmeida',
        foto: 'ricardo.jpg',
        pacotes_horas: [5, 10, 15]
    },
    {
        nome: 'Fernanda Costa',
        especialidade: 'RH e Processos',
        valor_hora: 55.00,
        linkedin_url: 'https://linkedin.com/in/fernandacosta',
        foto: 'fernanda.jpg',
        pacotes_horas: [8, 16, 24]
    },
    {
        nome: 'Marcos Tavares',
        especialidade: 'Estratégia Empresarial',
        valor_hora: 75.00,
        linkedin_url: 'https://linkedin.com/in/marcostavares',
        foto: 'marcos.jpg',
        pacotes_horas: [10, 20, 30]
    },
    {
        nome: 'Ana Beatriz Mendes',
        especialidade: 'Inovação',
        valor_hora: 65.00,
        linkedin_url: 'https://linkedin.com/in/anabeatrizmendes',
        foto: 'ana.jpg',
        pacotes_horas: [6, 12, 18]
    },
    {
        nome: 'Paulo Henrique Silva',
        especialidade: 'Marketing Digital',
        valor_hora: 50.00,
        linkedin_url: 'https://linkedin.com/in/paulohsilva',
        foto: 'paulo.jpg',
        pacotes_horas: [5, 10, 15]
    }
];

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/frontend/login.html';
        return;
    }

    initializeDashboard();
    setupNavigation();
    loadConsultants();
    loadFinancialData();
    
    // Setup form listeners
    document.getElementById('consultor-form')?.addEventListener('submit', handleConsultantFormSubmit);
    document.getElementById('admin-form')?.addEventListener('submit', createAdmin);
});

// Função para exibir formulário de admin
function showAdminForm() {
    const form = document.getElementById('admin-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

// Criar novo admin
async function createAdmin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch('http://localhost:3000/api/admin/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password')
            })
        });

        if (response.ok) {
            alert('Administrador criado com sucesso!');
            e.target.reset();
            e.target.style.display = 'none';
        } else {
            const data = await response.json();
            throw new Error(data.error);
        }
    } catch (error) {
        alert('Erro ao criar administrador: ' + error.message);
    }
}

// Gerenciamento de consultores
async function loadConsultants() {
    try {
        const response = await fetch('http://localhost:3000/api/consultants', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const dbConsultants = await response.json();
        const allConsultants = [...CONSULTORES_INICIAIS, ...dbConsultants];
        
        const tableBody = document.querySelector('#lista-consultores tbody');
        tableBody.innerHTML = '';
        
        allConsultants.forEach(consultant => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${consultant.nome || consultant.name}</td>
                <td>${consultant.especialidade}</td>
                <td>R$ ${(consultant.valor_hora || 0).toFixed(2)}</td>
                <td>
                    <button class="btn btn-view" onclick="viewConsultant('${consultant.id}')">Detalhes</button>
                    <button class="btn btn-edit" onclick="editConsultant('${consultant.id}')">Editar</button>
                    <button class="btn btn-delete" onclick="deleteConsultant('${consultant.id}')">Excluir</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Erro ao carregar consultores:', error);
    }
}

async function handleConsultantFormSubmit(e) {
    e.preventDefault();
    const consultorId = e.target.querySelector('button[type="submit"]').dataset.consultorId;
    
    if (consultorId) {
        await updateConsultant(consultorId, e);
    } else {
        await createConsultant(e);
    }
}

async function createConsultant(e) {
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch('http://localhost:3000/api/consultants', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                name: formData.get('nome'),
                email: formData.get('email'),
                password: formData.get('senha'),
                especialidade: formData.get('especialidade'),
                valor_hora: formData.get('valor_hora'),
                linkedin_url: formData.get('linkedin_url'),
                pacotes_horas: formData.get('pacotes_horas').split(',').map(h => parseInt(h.trim()))
            })
        });

        if (response.ok) {
            alert('Consultor criado com sucesso!');
            e.target.reset();
            loadConsultants();
        } else {
            const data = await response.json();
            throw new Error(data.error);
        }
    } catch (error) {
        alert('Erro ao criar consultor: ' + error.message);
    }
}

async function updateConsultant(id, e) {
    const formData = new FormData(e.target);
    
    try {
        const response = await fetch(`http://localhost:3000/api/consultants/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                name: formData.get('nome'),
                especialidade: formData.get('especialidade'),
                valor_hora: formData.get('valor_hora'),
                linkedin_url: formData.get('linkedin_url'),
                pacotes_horas: formData.get('pacotes_horas').split(',').map(h => parseInt(h.trim()))
            })
        });

        if (response.ok) {
            alert('Consultor atualizado com sucesso!');
            resetConsultantForm();
            loadConsultants();
        } else {
            const data = await response.json();
            throw new Error(data.error);
        }
    } catch (error) {
        alert('Erro ao atualizar consultor: ' + error.message);
    }
}

function resetConsultantForm() {
    const form = document.getElementById('consultor-form');
    form.reset();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Cadastrar Consultor';
    delete submitBtn.dataset.consultorId;
}

async function viewConsultant(id) {
    try {
        const response = await fetch(`http://localhost:3000/api/consultants/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const consultant = await response.json();
        
        alert(`
            Detalhes do Consultor:
            Nome: ${consultant.name}
            Especialidade: ${consultant.especialidade}
            Valor/Hora: R$ ${consultant.valor_hora.toFixed(2)}
            LinkedIn: ${consultant.linkedin_url || 'Não informado'}
            Email: ${consultant.email}
            Pacotes de Horas: ${consultant.pacotes_horas?.join(', ') || 'Não informado'}
        `);
    } catch (error) {
        console.error('Erro ao carregar consultor:', error);
    }
}

async function editConsultant(id) {
    try {
        const response = await fetch(`http://localhost:3000/api/consultants/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const consultant = await response.json();
        
        document.getElementById('nome').value = consultant.name;
        document.getElementById('especialidade').value = consultant.especialidade;
        document.getElementById('valor_hora').value = consultant.valor_hora;
        document.getElementById('linkedin_url').value = consultant.linkedin_url || '';
        document.getElementById('email').value = consultant.email;
        document.getElementById('pacotes_horas').value = consultant.pacotes_horas?.join(', ') || '';
        
        const submitBtn = document.querySelector('#consultor-form button[type="submit"]');
        submitBtn.textContent = 'Atualizar Consultor';
        submitBtn.dataset.consultorId = id;
        
        document.getElementById('consultor-form').scrollIntoView();
    } catch (error) {
        console.error('Erro ao carregar consultor:', error);
    }
}

async function deleteConsultant(id) {
    if (!confirm('Tem certeza que deseja excluir este consultor?')) return;
    
    try {
        const response = await fetch(`http://localhost:3000/api/consultants/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            alert('Consultor excluído com sucesso!');
            loadConsultants();
        } else {
            const data = await response.json();
            throw new Error(data.error);
        }
    } catch (error) {
        alert('Erro ao excluir consultor: ' + error.message);
    }
}

// Funções para gráficos e relatórios
async function fetchFinancialData() {
    // Simulação de chamada à API
    return {
        revenue: [
            { month: 'Janeiro', amount: 50000 },
            { month: 'Fevereiro', amount: 65000 },
            { month: 'Março', amount: 55000 },
            { month: 'Abril', amount: 70000 },
            { month: 'Maio', amount: 60000 }
        ],
        payments: [
            { consultant: 'João Silva', date: '2024-01-15', amount: 5000 },
            { consultant: 'Maria Souza', date: '2024-01-20', amount: 6500 },
            { consultant: 'Pedro Santos', date: '2024-01-25', amount: 4500 }
        ],
        consultants: CONSULTORES_INICIAIS.map(c => c.nome),
        documents: [
            { 
                date: '2024-01-15', 
                consultant: 'João Silva', 
                documents: [
                    { name: 'Ata Reunião.pdf', url: 'path/to/ata1.pdf' }
                ]
            },
            { 
                date: '2024-01-20', 
                consultant: 'Maria Souza', 
                documents: [
                    { name: 'Relatório.pdf', url: 'path/to/relatorio.pdf' },
                    { name: 'Apresentação.pdf', url: 'path/to/apresentacao.pdf' }
                ]
            }
        ]
    };
}

function createRevenueChart(data) {
    const ctx = document.getElementById('revenueChartCanvas').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(item => item.month),
            datasets: [{
                label: 'Receita (R$)',
                data: data.map(item => item.amount),
                backgroundColor: '#1A5F7A',
                borderColor: '#1A5F7A',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Valor (R$)'
                    }
                }
            }
        }
    });
}

function createPaymentsChart(data) {
    const ctx = document.getElementById('paymentsChartCanvas').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.map(item => item.consultant),
            datasets: [{
                label: 'Pagamentos por Consultor',
                data: data.map(item => item.amount),
                backgroundColor: [
                    '#1A5F7A', 
                    '#E6F2FF', 
                    '#14485e'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribuição de Pagamentos'
                }
            }
        }
    });
}

async function loadFinancialData() {
    const data = await fetchFinancialData();
    createRevenueChart(data.revenue);
    createPaymentsChart(data.payments);
    populateDocumentsList(data.documents);
    populateConsultantFilter(data.consultants);
    setupFilters(data);
}

function populateDocumentsList(documents) {
    const documentsList = document.getElementById('documents-list');
    documentsList.innerHTML = '';

    documents.forEach(meeting => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${meeting.date}</td>
            <td>${meeting.consultant}</td>
            <td>${meeting.documents.map(doc => doc.name).join(', ')}</td>
            <td>
                ${meeting.documents.map(doc => `
                    <button class="btn btn-view" onclick="openDocument('${doc.url}')">
                        Ver ${doc.name}
                    </button>
                `).join('')}
            </td>
        `;
        documentsList.appendChild(row);
    });
}

function populateConsultantFilter(consultants) {
    const consultantFilter = document.getElementById('consultant-filter');
    consultantFilter.innerHTML = '<option value="">Todos os Consultores</option>';
    
    consultants.forEach(consultant => {
        const option = document.createElement('option');
        option.value = consultant;
        option.textContent = consultant;
        consultantFilter.appendChild(option);
    });
}

function setupFilters(data) {
    const consultantFilter = document.getElementById('consultant-filter');
    const dateFilter = document.getElementById('date-filter');

    function applyFilters() {
        const selectedConsultant = consultantFilter.value;
        const selectedDate = dateFilter.value;

        const filteredDocuments = data.documents.filter(meeting => {
            const consultantMatch = !selectedConsultant || meeting.consultant === selectedConsultant;
            const dateMatch = !selectedDate || meeting.date === selectedDate;
            return consultantMatch && dateMatch;
        });

        populateDocumentsList(filteredDocuments);
    }

    consultantFilter.addEventListener('change', applyFilters);
    dateFilter.addEventListener('change', applyFilters);
}

function openDocument(url) {
    window.open(url, '_blank');
}

async function initializeDashboard() {
    try {
        const data = await fetchFinancialData();
        createRevenueChart(data.revenue);
        createPaymentsChart(data.payments);
        populateDocumentsList(data.documents);
        populateConsultantFilter(data.consultants);
        setupFilters(data);
        popularListaConsultores(CONSULTORES_INICIAIS);
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.sidebar nav ul li a');
    const sections = document.querySelectorAll('main section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(navLink => navLink.parentElement.classList.remove('active'));
            e.target.parentElement.classList.add('active');
            sections.forEach(section => section.style.display = 'none');

            const targetSectionId = e.target.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetSectionId);
            if (targetSection) {
                targetSection.style.display = 'block';
            }
        });
    });
}

function limparFormulario() {
    document.querySelector('form').reset();
}