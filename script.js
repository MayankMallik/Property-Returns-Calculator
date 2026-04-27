// 1. DYNAMIC DESCENDING YEAR POPULATION (1960 limit)
function initYears() {
    const pYear = document.getElementById('pYear');
    const sYear = document.getElementById('sYear');
    const currentYear = new Date().getFullYear(); 
    const startYear = 1960; 
    const futureLimit = currentYear + 10; 

    for (let i = futureLimit; i >= startYear; i--) {
        let opt = document.createElement('option');
        opt.value = i;
        opt.innerHTML = i;
        pYear.appendChild(opt.cloneNode(true));
        sYear.appendChild(opt);
    }
}
initYears();

// 2. ERROR CLEARING LISTENERS
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', function() { 
        formatNumber(this); 
        this.classList.remove('error'); 
    });
});

document.querySelectorAll('select').forEach(select => {
    select.addEventListener('change', function() {
        this.classList.remove('error');
        document.getElementById('error-message').style.display = 'none';
    });
});

// 3. FORMATTING LOGIC
function formatNumber(input) {
    let value = input.value.replace(/,/g, '');
    value = value.replace(/[^0-9.]/g, ''); 
    if (value.length > 3) {
        let parts = value.split('.');
        let integer = parts[0];
        let decimal = parts.length > 1 ? '.' + parts[1] : '';
        let lastThree = integer.slice(-3);
        let otherNumbers = integer.slice(0, -3);
        if (otherNumbers) {
            otherNumbers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
            integer = otherNumbers + "," + lastThree;
        }
        value = integer + decimal;
    }
    input.value = value;
}

// 4. CALCULATION
function calculatePropertyReturns() {
    const requiredFields = ['purchasePrice', 'salePrice', 'pYear', 'pMonth', 'sYear', 'sMonth'];
    const resultsDiv = document.getElementById('results');
    const dateErrorDiv = document.getElementById('error-message');
    let isValid = true;

    // Reset UI state before new calculation
    resultsDiv.style.display = 'none';
    dateErrorDiv.style.display = 'none';

    requiredFields.forEach(id => {
        const element = document.getElementById(id);
        if (element.value === "" || element.value === null) {
            element.classList.add('error');
            isValid = false;
        } else {
            element.classList.remove('error');
        }
    });

    if (!isValid) return;

    const pPrice = parseFloat(document.getElementById('purchasePrice').value.replace(/,/g, ''));
    const sPrice = parseFloat(document.getElementById('salePrice').value.replace(/,/g, ''));
    
    const startMonth = parseInt(document.getElementById('pMonth').value);
    const startYear = parseInt(document.getElementById('pYear').value);
    const endMonth = parseInt(document.getElementById('sMonth').value);
    const endYear = parseInt(document.getElementById('sYear').value);

    let totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth);
    // Precision fix: round time to ensure consistency with manual math
    const t = Math.round((totalMonths / 12) * 10000) / 10000;

    if (t <= 0) {
        dateErrorDiv.style.display = 'block';
        document.getElementById('sYear').classList.add('error');
        document.getElementById('sMonth').classList.add('error');
        return;
    }

    const annualValue = (Math.pow((sPrice / pPrice), (1 / t)) - 1) * 100;
    const realValue = annualValue - 6;

    // Set Annual Returns Value
    const annualSpan = document.getElementById('annualReturns');
    annualSpan.innerText = annualValue.toFixed(2) + "%";
    annualSpan.style.color = annualValue >= 0 ? "#28a745" : "#d9534f";

    // Set Real Returns Value
    const realSpan = document.getElementById('realReturns');
    realSpan.innerText = realValue.toFixed(2) + "%";
    realSpan.style.color = realValue >= 0 ? "#28a745" : "#d9534f";

    document.getElementById('results').style.display = 'block';
}