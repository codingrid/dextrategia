// Inicializa o Flatpickr para seleção de data
flatpickr("#data", {
    enableTime: false,
    dateFormat: "Y-m-d",
    minDate: "today",
    disable: [
        function(date) {
            return (date.getDay() === 0 || date.getDay() === 6);
        }
    ],
    locale: {
        firstDayOfWeek: 1
    }
});

// Carousel Navigation
const wrapper = document.querySelector('.consultores-wrapper');
const prevBtn = document.querySelector('.prev');
const nextBtn = document.querySelector('.next');

prevBtn.addEventListener('click', () => {
    wrapper.scrollBy({ left: -320, behavior: 'smooth' });
});

nextBtn.addEventListener('click', () => {
    wrapper.scrollBy({ left: 320, behavior: 'smooth' });
});

// Definição dos serviços e valores
const servicos = {
    'individual': 100,
    'pack-starter': 225,
    'pack-business': 450,
    'pack-enterprise': 800,
    'pack-premium': 1200
};

// Função para carregar consultores do banco de dados
async function loadConsultants() {
    try {
        const response = await fetch('http://localhost:3000/api/consultants', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token') // Adiciona o token de autenticação
            }
        });
        
        if (!response.ok) throw new Error('Erro ao buscar consultores');
        
        const consultores = await response.json();

        // Popula os cards dos consultores
        wrapper.innerHTML = ''; // Limpa o wrapper antes de adicionar os cards
        
        consultores.forEach(consultor => {
            const card = document.createElement('div');
            card.className = 'consultor-card';
            card.innerHTML = `
                <div class="consultor-header">
                    <img src="${consultor.linkedin_url}" alt="${consultor.name}" class="consultor-img">
                    <div>
                        <h3>${consultor.name}</h3>
                        <p class="consultor-especialidade">${consultor.especialidade}</p>
                    </div>
                </div>
                <p class="consultor-valor">€${consultor.valor_hora}/hora</p>
                <p class="consultor-descricao">Especialista em ${consultor.especialidade}</p>
                <div class="consultor-skills">
                    <span class="skill-tag">${consultor.especialidade}</span>
                </div>
                <div class="consultor-packs">
                    <p class="pack-info">Pack Starter: 5h - €${consultor.valor_hora * 5}</p>
                    <p class="pack-info">Pack Business: 10h - €${consultor.valor_hora * 10}</p>
                    <p class="pack-info">Pack Enterprise: 20h - €${consultor.valor_hora * 20}</p>
                </div>
                <a href="${consultor.linkedin_url}" target="_blank" class="linkedin-btn">
                    Ver perfil no LinkedIn
                </a>
            `;
            wrapper.appendChild(card);
        });

        // Atualiza o select de consultores
        const consultorSelect = document.getElementById('consultor');
        consultorSelect.innerHTML = '<option value="">Selecione o Consultor</option>';
        
        consultores.forEach(consultor => {
            const option = document.createElement('option');
            option.value = consultor.id;
            option.textContent = `${consultor.name} - ${consultor.especialidade}`;
            consultorSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar consultores:', error);
        wrapper.innerHTML = '<p>Erro ao carregar consultores. Por favor, tente novamente.</p>';
    }
}

// Update consultant select based on service type
const tipoServicoSelect = document.getElementById('tipo_servico');
const consultorSelect = document.getElementById('consultor');

tipoServicoSelect.addEventListener('change', () => {
    consultorSelect.innerHTML = '<option value="">Selecione o Consultor</option>';
    
    if (tipoServicoSelect.value) {
        loadConsultants(); // Carrega os consultores do banco quando um serviço é selecionado
    }
});

// Form submission handler
document.getElementById('agendamentoForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        nome: document.getElementById('nome').value,
        email: document.getElementById('email').value,
        tipo_servico: document.getElementById('tipo_servico').value,
        valor: servicos[document.getElementById('tipo_servico').value],
        consultor: document.getElementById('consultor').value, // Agora já está salvando o ID
        data_consulta: document.getElementById('data').value,
        hora_consulta: document.getElementById('hora').value,
        tipo_reuniao: document.getElementById('tipo_reuniao').value,
        descricao: document.getElementById('descricao').value
    };

    try {
        const response = await fetch('http://localhost:3000/api/agendamentos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            const result = await response.json();
            localStorage.setItem('bookingDetails', JSON.stringify(formData));
            localStorage.setItem('agendamentoId', result.id);
            window.location.href = 'pagamentos.html';
        } else {
            alert('Erro ao agendar consulta. Por favor, tente novamente.');
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao agendar consulta. Por favor, tente novamente.');
    }
});

// Carrega os consultores quando a página inicializa
document.addEventListener('DOMContentLoaded', () => {
    loadConsultants();
});