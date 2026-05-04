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
    
    // Update Labels
    document.getElementById('paymentLabel').innerText = state.label;
    document.getElementById('saleLabel').innerText = state.saleLabel;
    
    // Toggle Visibility of Groups
    document.querySelectorAll('.loan-only').forEach(el => el.style.display = state.showLoan ? 'block' : 'none');
    document.querySelectorAll('.plot-only').forEach(el => el.style.display = state.showPlot ? 'block' : 'none');

    // RE-APPLYING THE SPECIAL LAYOUT:
    // Only apply the 'without-loan-active' class if it's House + Without Loan
    const grid = document.getElementById('inputGrid');
    if (currentAsset === 'House' && currentLoan === 'Without Loan') {
        grid.classList.add('without-loan-active');
    } else {
        grid.classList.remove('without-loan-active');
    }
    if (currentAsset === 'House' && currentLoan === 'Without Loan') {
        grid.classList.add('without-loan-active');
        // Add this line to change the placeholder:
        document.getElementById('downPayment').placeholder = "e.g. 50,00,000";
    } else {
        grid.classList.remove('without-loan-active');
        // Reset it back to your default for other modes:
        document.getElementById('downPayment').placeholder = "e.g. 10,00,000";
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

// Initial setup
initYears();
refreshUI(); // Ensures Plot boxes are hidden on start[cite: 2]

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

function calculate() {
    const state = CONFIG[currentAsset][currentLoan];
    let required = ['downPayment', 'regCost', 'salePrice', 'pYear', 'pMonth', 'sYear', 'sMonth'];
    
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
        totalInflow = getVal('salePrice') - (state.showLoan ? getVal('closureAmount') : 0) - getVal('saleBrokerage');
    } else if (currentAsset === 'Plot') {
        totalOutflow = getVal('downPayment') + getVal('regCost') + getVal('buyBrokerage') + (state.showLoan ? (getVal('emi') * getVal('installments')) : 0);
        // Formula: (Plot Size * Sale Rate) - optional closure - optional brokerage[cite: 2]
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

    const annualValue = (Math.pow((totalInflow / totalOutflow), (1 / t)) - 1) * 100;
    const realValue = annualValue - 6;

    document.getElementById('annualReturns').innerText = annualValue.toFixed(2) + "%";
    document.getElementById('annualReturns').style.color = annualValue >= 0 ? "#28a745" : "#d9534f";

    document.getElementById('realReturns').innerText = realValue.toFixed(2) + "%";
    document.getElementById('realReturns').style.color = realValue >= 0 ? "#28a745" : "#d9534f";

    document.getElementById('results').style.display = 'block';
}
