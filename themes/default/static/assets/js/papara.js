$(document).ready(function() {
    let selectedDayCount = 0;
    let selectedButton = null;

    // Input validations
    $('#papara-email').on('input', function() {
        const isValid = validateEmail($(this).val());
        updateValidationState($(this), isValid);
    });

    $('#papara-quantity').on('input', function() {
        const isValid = validateQuantity($(this).val());
        updateValidationState($(this), isValid);
    });

    $('#papara-discount').on('input', function() {
        const isValid = validateDiscount($(this).val());
        updateValidationState($(this), isValid);
    });

    // Update validation state
    function updateValidationState(input, isValid) {
        input.removeClass('is-valid is-invalid');
        if (input.val()) {
            input.addClass(isValid ? 'is-valid' : 'is-invalid');
        }
    }

    // When discount code checkbox changes
    $('#has-discount').on('change', function() {
        const $discountGroup = $('#discount-group');
        if ($(this).is(':checked')) {
            $discountGroup.addClass('show');
        } else {
            $discountGroup.removeClass('show');
            setTimeout(() => {
                if (!$('#has-discount').is(':checked')) {
                    $('#papara-discount').val('').removeClass('is-valid is-invalid');
                    $('#discount-error').text('');
                }
            }, 150);
        }
    });

    // When clicking on Papara payment buttons
    $('.pay-with-papara').on('click', function() {
        selectedButton = $(this);
        selectedDayCount = selectedButton.data('day-count');
        
        // Show selected package details
        $('#package-days').text(selectedDayCount);
        const priceText = selectedButton.find('.price-text').html() || '';
        $('#package-price').html(priceText);
        
        resetForm();
        $('#papara-email-modal').modal('show');
    });

    // Reset form
    function resetForm() {
        $('#papara-email, #papara-quantity, #papara-discount').val('').removeClass('is-valid is-invalid');
        $('#papara-quantity').val('1');
        $('#email-error, #quantity-error, #discount-error').text('');
        $('#has-discount').prop('checked', false);
        $('#discount-group').removeClass('show');
    }

    // Email validation
    function validateEmail(email) {
        const emailInput = $('#papara-email');
        const errorDiv = $('#email-error');
        
        if (!email) {
            emailInput.addClass('is-invalid');
            errorDiv.text('Email address is required.');
            return false;
        }
        
        if (!isValidEmail(email)) {
            emailInput.addClass('is-invalid');
            errorDiv.text('Please enter a valid email address.');
            return false;
        }

        emailInput.removeClass('is-invalid');
        errorDiv.text('');
        return true;
    }

    // Quantity validation
    function validateQuantity(quantity) {
        const quantityInput = $('#papara-quantity');
        const errorDiv = $('#quantity-error');
        const numQuantity = parseInt(quantity);

        if (!quantity) {
            quantityInput.addClass('is-invalid');
            errorDiv.text('Quantity is required.');
            return false;
        }

        if (isNaN(numQuantity)) {
            quantityInput.addClass('is-invalid');
            errorDiv.text('Please enter a valid number.');
            return false;
        }

        if (numQuantity < 1) {
            quantityInput.addClass('is-invalid');
            errorDiv.text('You must select at least 1 quantity.');
            return false;
        }

        if (numQuantity > 100) {
            quantityInput.addClass('is-invalid');
            errorDiv.text('You can select a maximum of 100 quantities.');
            return false;
        }

        quantityInput.removeClass('is-invalid');
        errorDiv.text('');
        return true;
    }

    // Discount code validation
    function validateDiscount(code) {
        const discountInput = $('#papara-discount');
        const errorDiv = $('#discount-error');

        if (!code) {
            discountInput.removeClass('is-invalid');
            errorDiv.text('');
            return true;
        }

        // Discount code format: Only letters, numbers and dash
        if (!/^[A-Za-z0-9-]*$/.test(code)) {
            discountInput.addClass('is-invalid');
            errorDiv.text('Invalid characters.');
            return false;
        }

        discountInput.removeClass('is-invalid');
        errorDiv.text('');
        return true;
    }

    // When clicking on continue button
    $('#papara-continue').on('click', function() {
        const email = $('#papara-email').val();
        const quantity = $('#papara-quantity').val();
        const discount = $('#has-discount').is(':checked') ? $('#papara-discount').val() : '';

        // Check all validations
        const isEmailValid = validateEmail(email);
        const isQuantityValid = validateQuantity(quantity);
        const isDiscountValid = validateDiscount(discount);

        if (!isEmailValid || !isQuantityValid || !isDiscountValid) {
            return;
        }

        let path = '';
        const lang = $('html').attr('lang') || 'tr';
        if (lang === 'tr') {
            path = '/tr';
        }

        // Send request to backend
        fetch('https://pay.kozymacro.com/v1/papara', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'manual',
            body: JSON.stringify({
                email: email,
                language: lang,
                quantity: parseInt(quantity),
                dayCount: selectedDayCount,
                discountCode: discount,
                successUrl: 'https://kozymacro.com' + path + '?payment=success',
                cancelUrl: 'https://kozymacro.com' + path + '?payment=fail'
            })
        })
        .then(response => response.json())
        .then(data => {
            window.location = data.url;
        })
        .catch(error => {
            if (error.response && error.response.json) {
                return error.response.json();
            }
            throw error;
        })
        .then(errorData => {
            if (errorData && errorData.error) {
                const field = errorData.field;
                const errorMessage = errorData.error;

                if (field === 'email') {
                    $('#papara-email').addClass('is-invalid');
                    $('#email-error').text(errorMessage + '.');
                } else if (field === 'quantity') {
                    $('#papara-quantity').addClass('is-invalid');
                    $('#quantity-error').text(errorMessage + '.');
                } else if (field === 'discount') {
                    $('#papara-discount').addClass('is-invalid');
                    $('#discount-error').text(errorMessage + '.');
                }
            }
            console.error('Papara payment error:', error);
        });
    });

    // Email validation function
    function isValidEmail(email) {
        const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return re.test(String(email).toLowerCase());
    }
});
