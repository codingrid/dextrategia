document.addEventListener('DOMContentLoaded', () => {
    const bookingDetails = JSON.parse(localStorage.getItem('bookingDetails') || '{}');
    const paymentMethods = document.querySelectorAll('.payment-method');
    const mainForm = document.getElementById('payment-form');

    // Inicialmente esconder o formulário principal
    if (mainForm) mainForm.classList.add('hidden');
    
    // Esconder todos os formulários de pagamento
    document.querySelectorAll('.payment-form').forEach(form => {
        form.style.display = 'none';
    });
    if (bookingDetails.servico) {
        document.getElementById('service-name').textContent = bookingDetails.servico;
    }
    
    if (bookingDetails.valorTotal) {
        document.getElementById('total-value').textContent = `€${bookingDetails.valorTotal.toFixed(2).replace('.', ',')}`;
    }
 
    if (bookingDetails.nomeCliente) {
        document.getElementById('card-name').value = bookingDetails.nomeCliente;
    }
    
    if (bookingDetails.emailCliente) {
        document.getElementById('paypal-email').value = bookingDetails.emailCliente;
        document.getElementById('card-name').value = bookingDetails.nomeCliente;
    }
    document.addEventListener('DOMContentLoaded', function() {
        const formaPagamento = document.querySelectorAll('.payment-option');
        
        formaPagamento.forEach(option => {
            option.addEventListener('click', async function() {
                const agendamentoId = localStorage.getItem('agendamentoId');
                const paymentType = this.dataset.type;
    
                try {
                    const response = await fetch('http://localhost:3000/api/processar-pagamento', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            agendamentoId,
                            formaPagamento: paymentType
                        })
                    });
    
                    if (response.ok) {
                        window.location.href = 'confirmacao.html';
                    } else {
                        alert('Erro ao processar pagamento. Por favor, tente novamente.');
                    }
                } catch (error) {
                    console.error('Erro:', error);
                    alert('Erro ao processar pagamento. Por favor, tente novamente.');
                }
            });
        });
    });
    
    // Event listeners para métodos de pagamento
    paymentMethods.forEach(method => {
        method.addEventListener('click', () => {
            paymentMethods.forEach(m => {
                m.classList.remove('active');
                const selectElement = m.querySelector('.payment-method-select');
                if (selectElement) selectElement.innerHTML = '';
            });
    
            document.querySelectorAll('.payment-form').forEach(form => {
                form.style.display = 'none';
            });
    
            method.classList.add('active');
            const selectElement = method.querySelector('.payment-method-select');
            if (selectElement) selectElement.innerHTML = '✓';
    
            const selectedMethod = method.dataset.method;
            const selectedForm = document.getElementById(`${selectedMethod}-form`);
            if (selectedForm) {
                selectedForm.style.display = 'block';
                mainForm.classList.remove('hidden');
            }
        });
    });

    // Set MBWAY como default
    const mbwayMethod = document.querySelector('[data-method="mbway"]');
    if (mbwayMethod) {
        mbwayMethod.classList.add('active');
        const selectElement = mbwayMethod.querySelector('.payment-method-select');
        if (selectElement) selectElement.innerHTML = '✓';
        const mbwayForm = document.getElementById('mbway-form');
        if (mbwayForm) {
            mbwayForm.style.display = 'block';
            mainForm.classList.remove('hidden');
        }
    }

    if (mainForm) {
        mainForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const activeMethodElement = document.querySelector('.payment-method.active');
            if (!activeMethodElement) return;
            
            const activeMethod = activeMethodElement.dataset.method;
            let isValid = true;
        
            if (activeMethod === 'mbway') {
                const mbwayPhone = document.getElementById('mbway-phone');
                if (mbwayPhone && !mbwayPhone.value.trim()) {
                    mbwayPhone.classList.add('error');
                    isValid = false;
                }
                document.querySelectorAll('#card-form input, #paypal-form input').forEach(input => {
                    input.classList.remove('error');
                });
            } else if (activeMethod === 'card') {
                const cardInputs = document.querySelectorAll('#card-form input');
                cardInputs.forEach(input => {
                    if (!input.value.trim()) {
                        input.classList.add('error');
                        isValid = false;
                    }
                });
                document.querySelectorAll('#mbway-form input, #paypal-form input').forEach(input => {
                    input.classList.remove('error');
                });
            } else if (activeMethod === 'paypal') {
                const paypalEmail = document.getElementById('paypal-email');
                if (paypalEmail && !paypalEmail.value.trim()) {
                    paypalEmail.classList.add('error');
                    isValid = false;
                }
                document.querySelectorAll('#card-form input, #mbway-form input').forEach(input => {
                    input.classList.remove('error');
                });
            }
        
            if (isValid) {
                window.location.href = 'confirmacao.html';
            } else {
                alert('Por favor, preencha todos os campos corretamente.');
            }
        });
    }

    // Input masks
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

    maskInput(document.getElementById('mbway-phone'), 'XXX XXX XXX');
    maskInput(document.getElementById('card-number'), 'XXXX XXXX XXXX XXXX');
    maskInput(document.getElementById('card-expiry'), 'XX/XX');
});