let currentAsset = 'House';
let currentLoan = 'With Loan';

const CONFIG = {
    'House': {
        'With Loan': { label: 'Down Payment', saleLabel: 'Sale Price', showLoan: true, showPlot: false },
        'Without Loan': { label: 'Purchase Price', saleLabel: 'Sale Price', showLoan: false, showPlot: false }
    },
    'Plot': {
        'With Loan': { label: 'Down Payment', saleLabel: 'Sale Rate (per sqft)', showLoan: true, showPlot: true },
        'Without Loan': { label: 'Purchase Price', saleLabel: 'Sale Rate (per sqft)', showLoan: false, showPlot: true }
    }
};

// NEW: Lakh/Crore formatting logic[cite: 4]
const formatToWords = num => {
    if (num >= 10000000) { // Crore
        const value = Math.ceil((num / 10000000) * 100) / 100;
        return `₹${value.toFixed(2)} Crore`;
    } else if (num >= 100000) { // Lakh
        const value = Math.ceil((num / 100000) * 100) / 100;
        return `₹${value.toFixed(2)} Lakh`;
    } else {
        let integer = Math.ceil(num).toString();
        if (integer.length > 3) {
            let lastThree = integer.slice(-3);
            let otherNumbers = integer.slice(0, -3);
            otherNumbers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
            integer = otherNumbers + "," + lastThree;
        }
        return "₹" + integer;
    }
};

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

function refreshUI() {
    const state = CONFIG[currentAsset][currentLoan];
    
    document.getElementById('paymentLabel').innerText = state.label;
    document.getElementById('saleLabel').innerText = state.saleLabel;
    
    document.querySelectorAll('.loan-only').forEach(el => el.style.display = state.showLoan ? 'block' : 'none');
    document.querySelectorAll('.plot-only').forEach(el => el.style.display = state.showPlot ? 'block' : 'none');
    document.querySelectorAll('.house-only').forEach(el => el.style.display = (currentAsset === 'House') ? 'block' : 'none');

    // Hide Purchase Price specifically for Plot + Without Loan[cite: 1]
    const downPaymentGroup = document.getElementById('downPaymentGroup');
    if (currentAsset === 'Plot' && currentLoan === 'Without Loan') {
        downPaymentGroup.style.display = 'none';
    } else {
        downPaymentGroup.style.display = 'block';
    }

    const grid = document.getElementById('inputGrid');
    const downPaymentInput = document.getElementById('downPayment');
    const salePriceInput = document.getElementById('salePrice');
    
    // Update Placeholders[cite: 2]
    if (currentAsset === 'Plot') {
        salePriceInput.placeholder = "e.g. 8,000"; // Updated placeholder for Sale Rate[cite: 4]
    } else {
        salePriceInput.placeholder = "e.g. 80,00,000";
    }

    if (currentAsset === 'House' && currentLoan === 'Without Loan') {
        grid.classList.add('without-loan-active');
        downPaymentInput.placeholder = "e.g. 50,00,000";
    } else {
        grid.classList.remove('without-loan-active');
        downPaymentInput.placeholder = "e.g. 10,00,000";
    }

    document.getElementById('results').style.display = 'none';
    document.getElementById('error-message').style.display = 'none';
}

function setAsset(asset) {
    currentAsset = asset;
    document.getElementById('houseBtn').classList.toggle('active', asset === 'House');
    document.getElementById('plotBtn').classList.toggle('active', asset === 'Plot');
    refreshUI();
}

function setLoan(loan) {
    currentLoan = loan;
    document.getElementById('withLoanBtn').classList.toggle('active', loan === 'With Loan');
    document.getElementById('withoutLoanBtn').classList.toggle('active', loan === 'Without Loan');
    refreshUI();
}

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

document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', function() { 
        formatNumber(this); 
        this.classList.remove('error');
    });
});

document.querySelectorAll('select').forEach(select => {
    select.addEventListener('change', function() {
        this.classList.remove('error');
    });
});

function calculate() {
    const state = CONFIG[currentAsset][currentLoan];
    let required = ['regCost', 'salePrice', 'pYear', 'pMonth', 'sYear', 'sMonth'];
    
    if (!(currentAsset === 'Plot' && currentLoan === 'Without Loan')) required.push('downPayment');
    if (state.showLoan) required.push('emi', 'installments', 'closureAmount');
    if (state.showPlot) required.push('plotSize', 'purchaseRate');

    let isValid = true;
    required.forEach(id => {
        const el = document.getElementById(id);
        if (!el.value) {
            el.classList.add('error');
            isValid = false;
        } else {
            el.classList.remove('error');
        }
    });

    if (!isValid) return;

    const getVal = id => parseFloat(document.getElementById(id).value.replace(/,/g, '')) || 0;
    
    let totalOutflow, totalInflow;

    if (currentAsset === 'House') {
        totalOutflow = getVal('downPayment') + getVal('regCost') + getVal('buyBrokerage') + (state.showLoan ? (getVal('emi') * getVal('installments')) : 0);
        totalInflow = getVal('salePrice') + (getVal('monthlyRent') * getVal('rentMonths')) - (state.showLoan ? getVal('closureAmount') : 0) - getVal('saleBrokerage');
    } else if (currentAsset === 'Plot') {
        let purchaseCost = (currentLoan === 'Without Loan') ? (getVal('plotSize') * getVal('purchaseRate')) : getVal('downPayment');
        totalOutflow = purchaseCost + getVal('regCost') + getVal('buyBrokerage') + (state.showLoan ? (getVal('emi') * getVal('installments')) : 0);
        totalInflow = (getVal('plotSize') * getVal('salePrice')) - (state.showLoan ? getVal('closureAmount') : 0) - getVal('saleBrokerage');
    }

    const startMonth = parseInt(document.getElementById('pMonth').value);
    const startYear = parseInt(document.getElementById('pYear').value);
    const endMonth = parseInt(document.getElementById('sMonth').value);
    const endYear = parseInt(document.getElementById('sYear').value);

    let totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth);
    const t = totalMonths / 12;

    if (t <= 0) {
        document.getElementById('error-message').style.display = 'block';
        return;
    }

    // CAGR Formula: ((Inflow / Outflow)^(1/t) - 1) * 100[cite: 3]
    const annualValue = (Math.pow((totalInflow / totalOutflow), (1 / t)) - 1) * 100;
    const realValue = annualValue - 6;

    // Apply Lakh/Crore logic to the result display[cite: 4]
    document.getElementById('totalInvestment').innerText = formatToWords(totalOutflow);
    document.getElementById('totalSale').innerText = formatToWords(totalInflow);
    
    document.getElementById('annualReturns').innerText = annualValue.toFixed(2) + "%";
    document.getElementById('annualReturns').style.color = annualValue >= 0 ? "#28a745" : "#d9534f";

    document.getElementById('realReturns').innerText = realValue.toFixed(2) + "%";
    document.getElementById('realReturns').style.color = realValue >= 0 ? "#28a745" : "#d9534f";

    document.getElementById('results').style.display = 'block';
}

initYears();
refreshUI();
