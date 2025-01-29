document.addEventListener('DOMContentLoaded', () => {
    // Recupera os dados do localStorage
    const bookingDetails = JSON.parse(localStorage.getItem('bookingDetails') || '{}');
    const paymentMethods = document.querySelectorAll('.payment-method');
    const mainForm = document.getElementById('payment-form');
    const paymentForms = document.querySelectorAll('.payment-form');
 
    console.log('Dados recuperados:', bookingDetails); // Debug
    
    // Atualiza os campos de resumo
    const servicoElement = document.getElementById('service-name');
    const valorElement = document.getElementById('total-value');
    
    if (servicoElement && bookingDetails.tipo_servico) {
        servicoElement.textContent = bookingDetails.tipo_servico;
    }
    
    if (valorElement && bookingDetails.valor) {
        valorElement.textContent = `€${bookingDetails.valor}`;
    }
    
    // Esconder todos os formulários de pagamento inicialmente
    paymentForms.forEach(form => {
        form.style.display = 'none';
    });
    
    // Gestão de seleção de método de pagamento
    paymentMethods.forEach(method => {
        method.addEventListener('click', () => {
            // Remove seleção anterior
            paymentMethods.forEach(m => {
                m.classList.remove('active');
                const selectElement = m.querySelector('.payment-method-select');
                if (selectElement) selectElement.innerHTML = '';
            });
 
            // Esconde todos os formulários
            paymentForms.forEach(form => form.style.display = 'none');
 
            // Ativa o método selecionado
            method.classList.add('active');
            const selectElement = method.querySelector('.payment-method-select');
            if (selectElement) selectElement.innerHTML = '✓';
 
            // Mostra o formulário correspondente
            const methodType = method.dataset.method;
            const form = document.getElementById(`${methodType}-form`);
            if (form) {
                form.style.display = 'block';
            }
        });
    });
 
    // Seleciona MBWay por padrão
    const mbwayMethod = document.querySelector('[data-method="mbway"]');
    if (mbwayMethod) {
        mbwayMethod.click();
    }
 
    // Gerenciamento do formulário de pagamento
    if (mainForm) {
        mainForm.addEventListener('submit', async (e) => {
            e.preventDefault();
 
            const activeMethod = document.querySelector('.payment-method.active');
            if (!activeMethod) {
                alert('Por favor, selecione um método de pagamento.');
                return;
            }
 
            const methodType = activeMethod.dataset.method;
            let isValid = validatePaymentForm(methodType);
 
            if (isValid) {
                try {
                    const paymentData = {
                        nome: bookingDetails.nome,
                        email: bookingDetails.email,
                        servico: bookingDetails.tipo_servico,
                        valor_total: bookingDetails.valor,
                        forma_pagamento: methodType,
                        consultor: bookingDetails.consultor,
                        data_consulta: bookingDetails.data_consulta,
                        hora_consulta: bookingDetails.hora_consulta,
                        agendamento_id: localStorage.getItem('agendamentoId')
                    };
 
                    console.log('Enviando dados:', paymentData); // Debug
 
                    const response = await fetch('http://localhost:3000/api/payments', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(paymentData)
                    });
 
                    if (response.ok) {
                        localStorage.setItem('confirmationDetails', JSON.stringify(paymentData));
                        window.location.href = 'confirmacao.html';
                    } else {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Erro ao processar pagamento');
                    }
                } catch (error) {
                    console.error('Erro:', error);
                    alert('Erro ao processar pagamento. Por favor, tente novamente.');
                }
            }
        });
    }
 
    // Função de validação de formulário
    function validatePaymentForm(methodType) {
        let isValid = true;
        const requiredFields = {
            mbway: ['mbway-phone'],
            cartao: ['card-number', 'card-name', 'card-expiry', 'card-cvv'],
            paypal: ['paypal-email']
        };
 
        (requiredFields[methodType] || []).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && !field.value.trim()) {
                field.classList.add('error');
                isValid = false;
            } else if (field) {
                field.classList.remove('error');
            }
        });
 
        if (!isValid) {
            alert('Por favor, preencha todos os campos obrigatórios.');
        }
 
        return isValid;
    }
 
    // Máscaras de input
    function maskInput(input, mask) {
        if (!input) return;
        
        input.addEventListener('input', function() {
            const cleanValue = this.value.replace(/\D/g, '');
            let maskedValue = '';
            let pos = 0;
    
            for (let i = 0; i < mask.length && pos < cleanValue.length; i++) {
                if (mask[i] === 'X') {
                    maskedValue += cleanValue[pos];
                    pos++;
                } else {
                    maskedValue += mask[i];
                }
            }
    
            this.value = maskedValue;
        });
    }
 
    // Aplicar máscaras
    maskInput(document.getElementById('mbway-phone'), 'XXX XXX XXX');
    maskInput(document.getElementById('card-number'), 'XXXX XXXX XXXX XXXX');
    maskInput(document.getElementById('card-expiry'), 'XX/XX');
    maskInput(document.getElementById('card-cvv'), 'XXX');
 });