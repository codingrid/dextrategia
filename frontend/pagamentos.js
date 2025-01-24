document.addEventListener('DOMContentLoaded', () => {
    const bookingDetails = JSON.parse(localStorage.getItem('bookingDetails') || '{}');
    const paymentMethods = document.querySelectorAll('.payment-method');
    const paymentForms = document.querySelectorAll('.payment-form');
    const mainForm = document.getElementById('payment-form');
 
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
 
    paymentMethods.forEach(method => {
        method.addEventListener('click', () => {
            // Reset dos métodos
            paymentMethods.forEach(m => {
                m.classList.remove('active');
                m.querySelector('.payment-method-select').innerHTML = '';
            });
    
            // Esconder todos os formulários
            document.querySelectorAll('.payment-form').forEach(form => {
                form.style.display = 'none';
            });
    
            // Ativar método selecionado
            method.classList.add('active');
            method.querySelector('.payment-method-select').innerHTML = '✓';
    
            // Mostrar formulário correspondente
            const selectedMethod = method.dataset.method;
            const selectedForm = document.getElementById(`${selectedMethod}-form`);
            selectedForm.style.display = 'block';
            mainForm.classList.remove('hidden');
        });
    });
 
    mainForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const activeMethod = document.querySelector('.payment-method.active').dataset.method;
        let isValid = true;
 
        if (activeMethod === 'mbway') {
            const mbwayPhone = document.getElementById('mbway-phone');
            if (!mbwayPhone.value.trim()) {
                mbwayPhone.classList.add('error');
                isValid = false;
            }
        } else if (activeMethod === 'card') {
            const cardInputs = document.querySelectorAll('#card-form input');
            cardInputs.forEach(input => {
                if (!input.value.trim()) {
                    input.classList.add('error');
                    isValid = false;
                }
            });
        } else if (activeMethod === 'paypal') {
            const paypalEmail = document.getElementById('paypal-email');
            if (!paypalEmail.value.trim()) {
                paypalEmail.classList.add('error');
                isValid = false;
            }
        }
 
        if (isValid) {
            try {
                const response = await fetch('http://localhost:5000/confirmar-pagamento', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        emailCliente: bookingDetails.emailCliente,
                        nomeCliente: bookingDetails.nomeCliente
                    })
                });
 
                const data = await response.json();
                
                if (data.success) {
                    const paymentMethod = document.querySelector('.payment-method.active .payment-method-name').textContent;
                    const totalValue = document.getElementById('total-value').textContent;
 
                    alert(`Pagamento processado com sucesso!\n\nServiço: ${bookingDetails.servico}\nValor: ${totalValue}\nMétodo: ${paymentMethod}`);
                    localStorage.removeItem('bookingDetails');
                    window.location.href = 'confirmacao.html';
                }
            } catch (error) {
                console.error('Erro ao processar pagamento:', error);
                alert('Erro ao processar pagamento. Tente novamente.');
            }
        } else {
            alert('Por favor, preencha todos os campos corretamente.');
        }
    });
 
    function maskInput(input, mask) {
        input.addEventListener('input', function() {
            const cleanValue = this.value.replace(/\D/g, '');
            let maskedValue = '';
            let pos = 0;
 
            for (let i = 0; i < mask.length; i++) {
                if (mask[i] === 'X') {
                    if (pos < cleanValue.length) {
                        maskedValue += cleanValue[pos];
                        pos++;
                    }
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