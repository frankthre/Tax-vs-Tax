const taxDataUrl = 'tax_brackets.json';

let taxData;

fetch(taxDataUrl)
    .then(response => response.json())
    .then(data => {
        taxData = data;
        populateStates();
    });

const populateStates = () => {
    const states = Object.keys(taxData.states);
    const stateSelectors = [document.getElementById('state1'), document.getElementById('state2')];

    stateSelectors.forEach(selector => {
        states.forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            selector.appendChild(option);
        });
    });
};

document.getElementById('compareButton').addEventListener('click', () => {
    const grossIncome = parseFloat(
        document.getElementById('grossIncome').value.replace(/,/g, '')
    );

    if (isNaN(grossIncome)) {
        alert('Please enter a valid gross income.');
        return;
    }

    const state1 = document.getElementById('state1').value;
    const filingStatus1 = document.getElementById('filingStatus1').value;

    const state2 = document.getElementById('state2').value;
    const filingStatus2 = document.getElementById('filingStatus2').value;

    const result1 = calculatePostTaxIncome(grossIncome, state1, filingStatus1);
    const result2 = calculatePostTaxIncome(grossIncome, state2, filingStatus2);

    document.getElementById('result1').textContent = `Post-Tax Income: $${result1.netIncome.toLocaleString()}`;
    document.getElementById('result2').textContent = `Post-Tax Income: $${result2.netIncome.toLocaleString()}`;

    const diff = Math.abs(result1.netIncome - result2.netIncome) / 12;

    const summary = `
        You will have $${result1.netIncome.toLocaleString()} in ${state1} and $${result2.netIncome.toLocaleString()} in ${state2}.
        This means in ${result1.netIncome > result2.netIncome ? state1 : state2}, you will have $${diff.toLocaleString()} more per month in post-tax income.
        The effective tax rates are ${result1.effectiveTaxRate}% and ${result2.effectiveTaxRate}%, respectively.
    `;

    document.getElementById('summary').textContent = summary;
});

const calculatePostTaxIncome = (income, state, filingStatus) => {
    const federalBrackets = taxData.federal[filingStatus];
    const stateBrackets = taxData.states[state][filingStatus] || [];

    const federalTax = calculateTax(income, federalBrackets);
    const stateTax = calculateTax(income, stateBrackets);

    const netIncome = income - federalTax - stateTax;
    const effectiveTaxRate = (((federalTax + stateTax) / income) * 100).toFixed(2);

    return { netIncome, effectiveTaxRate };
};

const calculateTax = (income, brackets) => {
    let tax = 0;
    for (const bracket of brackets) {
        const { rate, range } = bracket;
        const taxable = Math.min(range[1] || income, income) - range[0];
        if (taxable > 0) {
            tax += taxable * rate;
        }
    }
    return tax;
};