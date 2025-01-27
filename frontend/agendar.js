


const consultores = [
    {
        nome: "Carla Medeiros",
        especialidade: "Marketing Digital",
        valor: 45,
        imagem: "https://img.freepik.com/fotos-gratis/mulher-de-tiro-medio-posando-no-escritorio_23-2149392072.jpg?ga=GA1.1.1144895126.1737632696&semt=ais_hybrid",
        descricao: "Especialista em marketing digital com mais de 10 anos de experiência. Foco em estratégias de crescimento, SEO, marketing de conteúdo e mídia social.",
        skills: ["SEO", "Google Ads", "Social Media", "Content Marketing"],
        packs: {
            starter: { horas: 5, valor: 200 },
            business: { horas: 10, valor: 400 },
            enterprise: { horas: 20, valor: 750 }
        }
    },
    {
        nome: "Ricardo Almeida",
        especialidade: "Gestão Financeira",
        valor: 60,
        imagem: "https://img.freepik.com/fotos-gratis/designer-trabalhando-no-modelo-3d_23-2149371896.jpg?ga=GA1.1.1144895126.1737632696&semt=ais_hybrid",
        descricao: "Consultor financeiro com MBA em Finanças e 15 anos de experiência no mercado. Especializado em planejamento financeiro e análise de investimentos.",
        skills: ["Análise Financeira", "Investimentos", "Gestão de Riscos", "Valuation"],
        packs: {
            starter: { horas: 5, valor: 275 },
            business: { horas: 10, valor: 500 },
            enterprise: { horas: 20, valor: 900 }
        }
    },
    {
        nome: "Fernanda Costa",
        especialidade: "RH e Processos",
        valor: 55,
        imagem: "https://img.freepik.com/fotos-gratis/mulher-sorrindo-sentado-no-cafe-com-portatil-fechado_1262-1151.jpg?ga=GA1.1.1144895126.1737632696&semt=ais_hybrid",
        descricao: "Especialista em Recursos Humanos com Mestrado em Gestão de Pessoas. Experiência em implementação de programas de desenvolvimento.",
        skills: ["Gestão de Pessoas", "Cultura Organizacional", "Desenvolvimento", "Processos"],
        packs: {
            starter: { horas: 5, valor: 250 },
            business: { horas: 10, valor: 450 },
            enterprise: { horas: 20, valor: 800 }
        }
    },
    {
        nome: "João Silva",
        especialidade: "Estratégia Digital",
        valor: 65,
        imagem: "https://img.freepik.com/fotos-gratis/retrato-do-homem-de-negocios-feliz-com-tabuleta-digital_1262-12831.jpg?ga=GA1.1.1144895126.1737632696&semt=ais_hybrid",
        descricao: "Especialista em transformação digital e inovação. Experiência em startups e grandes empresas, com foco em crescimento escalável.",
        skills: ["Transformação Digital", "Inovação", "Growth", "Estratégia"],
        packs: {
            starter: { horas: 5, valor: 300 },
            business: { horas: 10, valor: 550 },
            enterprise: { horas: 20, valor: 1000 }
        }
    }
];

// Inicializa o Flatpickr
flatpickr("#data", {
    enableTime: false,
    dateFormat: "d/m/y",
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

// Populate consultants
consultores.forEach(consultor => {
    const card = document.createElement('div');
    card.className = 'consultor-card';
    card.innerHTML = `
        <div class="consultor-header">
            <img src="${consultor.imagem}" alt="${consultor.nome}" class="consultor-img">
            <div>
                <h3>${consultor.nome}</h3>
                <p class="consultor-especialidade">${consultor.especialidade}</p>
            </div>
        </div>
        <p class="consultor-valor">€${consultor.valor}/hora</p>
        <p class="consultor-descricao">${consultor.descricao}</p>
        <div class="consultor-skills">
            ${consultor.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
        </div>
        <div class="consultor-packs">
            <p class="pack-info">Pack Starter: ${consultor.packs.starter.horas}h - €${consultor.packs.starter.valor}</p>
            <p class="pack-info">Pack Business: ${consultor.packs.business.horas}h - €${consultor.packs.business.valor}</p>
            <p class="pack-info">Pack Enterprise: ${consultor.packs.enterprise.horas}h - €${consultor.packs.enterprise.valor}</p>
        </div>
        <a href="https://linkedin.com/in/${consultor.nome.toLowerCase().replace(' ', '')}" target="_blank" class="linkedin-btn">
            Ver perfil no LinkedIn
        </a>
    `;
    wrapper.appendChild(card);
});

// Update consultant select based on service type
const tipoServicoSelect = document.getElementById('tipo_servico');
const consultorSelect = document.getElementById('consultor');

tipoServicoSelect.addEventListener('change', () => {
    consultorSelect.innerHTML = '<option value="">Selecione o Consultor</option>';
    
    if (tipoServicoSelect.value) {
        consultores.forEach(consultor => {
            const option = document.createElement('option');
            option.value = consultor.nome.toLowerCase().replace(' ', '');
            option.textContent = `${consultor.nome} - ${consultor.especialidade}`;
            consultorSelect.appendChild(option);
        });
    }
});
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('agendamentoForm');
    if (!form) return;

    const servicos = {
        'pack-starter': 225,
        'pack-business': 450,
        'pack-enterprise': 800,
        'pack-premium': 1200,
        'individual': 100
    };

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const servicoSelecionado = document.getElementById('tipo_servico').selectedOptions[0];
        
        const bookingDetails = {
            nome: document.getElementById('nome').value,
            email: document.getElementById('email').value,
            servico: servicoSelecionado.textContent,
            valorTotal: servicos[servicoSelecionado.value],
            consultor: document.getElementById('consultor').selectedOptions[0].textContent,
            data: document.getElementById('data').value,
            hora: document.getElementById('hora').value
        };
        
        localStorage.setItem('bookingDetails', JSON.stringify(bookingDetails));
        window.location.href = 'pagamentos.html';
    });
});
