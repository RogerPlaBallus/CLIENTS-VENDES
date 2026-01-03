// Global variables
let clients = [];
let currentClientId = null;
let snippets = [];

// DOM elements
let clientList;
let searchInput;
let newClientBtn;
let newClientForm;
let newClientSection;
let clientDetailsSection;
let clientName;
let clientPhone;
let clientEmail;
let clientAddress;
let clientNotepad;
let notepadTextarea;
let expandNotepadBtn;
let expenseList;
let addExpenseForm;
let backToList;
let exportBtn;
let exportClientBtn;
let exportDbBtn;
let deleteModal;
let confirmDelete;
let cancelDelete;
let snippetsModal;
let manageSnippetsBtn;
let saveSnippetBtn;
let closeSnippetsModal;
let snippetsList;
let snippetSearch;
let cancelNewClient;
let iniciBtn;
let vendesBtn;
let vendesSection;
let vendesList;
let searchVendesInput;
let exportModal;
let exportStartDate;
let exportEndDate;
let confirmExport;
let cancelExport;

// Helper function to get current date in YYYY-MM-DD format
function getCurrentDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Helper function to format date to DD-MM-YYYY
function formatDate(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
}

// Helper function to normalize string for search (remove accents and lowercase)
function normalizeString(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Helper function to get the next available ascending ID
function getNextClientId() {
    if (clients.length === 0) {
        return 1;
    }

    const existingIds = clients.map(client => client.id).sort((a, b) => a - b);
    let nextId = 1;

    for (const id of existingIds) {
        if (id === nextId) {
            nextId++;
        } else if (id > nextId) {
            break;
        }
    }

    return nextId;
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize DOM elements
    clientList = document.getElementById('clientList');
    searchInput = document.getElementById('searchInput');
    newClientBtn = document.getElementById('newClientBtn');
    newClientForm = document.getElementById('newClientForm');
    newClientSection = document.getElementById('newClientSection');
    clientDetailsSection = document.getElementById('clientDetailsSection');
    clientName = document.getElementById('clientName');
    clientPhone = document.getElementById('clientPhone');
    clientEmail = document.getElementById('clientEmail');
    clientAddress = document.getElementById('clientAddress');
    clientNotepad = document.getElementById('clientNotepad');
    notepadTextarea = document.getElementById('notepadTextarea');
    expandNotepadBtn = document.getElementById('expandNotepadBtn');
    expenseList = document.getElementById('expenseList');
    addExpenseForm = document.getElementById('addExpenseForm');
    backToList = document.getElementById('backToList');
    exportBtn = document.getElementById('exportBtn');
    exportClientBtn = document.getElementById('exportClientBtn');
    exportDbBtn = document.getElementById('exportDbBtn');
    deleteModal = document.getElementById('deleteModal');
    confirmDelete = document.getElementById('confirmDelete');
    cancelDelete = document.getElementById('cancelDelete');
    snippetsModal = document.getElementById('snippetsModal');
    manageSnippetsBtn = document.getElementById('manageSnippetsBtn');
    saveSnippetBtn = document.getElementById('saveSnippetBtn');
    closeSnippetsModal = document.getElementById('closeSnippetsModal');
    snippetsList = document.getElementById('snippetsList');
    snippetSearch = document.getElementById('snippetSearch');
    cancelNewClient = document.getElementById('cancelNewClient');
    iniciBtn = document.getElementById('iniciBtn');
    vendesBtn = document.getElementById('vendesBtn');
    vendesSection = document.getElementById('vendesSection');
    vendesList = document.getElementById('vendesList');
    searchVendesInput = document.getElementById('searchVendesInput');
    exportModal = document.getElementById('exportModal');
    exportStartDate = document.getElementById('exportStartDate');
    exportEndDate = document.getElementById('exportEndDate');
    confirmExport = document.getElementById('confirmExport');
    cancelExport = document.getElementById('cancelExport');

    await loadClients();
    await loadSnippets();
    // Ensure modals are hidden on load
    hideSnippetsModal();
    hideDeleteModal();

    iniciBtn.addEventListener('click', showClientList);
    vendesBtn.addEventListener('click', showVendes);
    newClientBtn.addEventListener('click', showNewClientForm);
    newClientForm.addEventListener('submit', addClient);
    cancelNewClient.addEventListener('click', showClientList);
    searchInput.addEventListener('input', filterClients);
    snippetSearch.addEventListener('input', filterSnippets);
    addExpenseBtn.addEventListener('click', addExpense);
    backToList.addEventListener('click', showClientList);
    exportBtn.addEventListener('click', exportAllToExcel);
    exportClientBtn.addEventListener('click', exportClientToExcel);
    exportDbBtn.addEventListener('click', exportDatabase);
    manageSnippetsBtn.addEventListener('click', showSnippetsModal);
    saveSnippetBtn.addEventListener('click', saveSnippet);
    closeSnippetsModal.addEventListener('click', hideSnippetsModal);
    confirmDelete.addEventListener('click', deleteExpense);
    cancelDelete.addEventListener('click', hideDeleteModal);
    confirmExport.addEventListener('click', performExport);
    cancelExport.addEventListener('click', hideExportModal);

    // Notepad event listeners
    notepadTextarea.addEventListener('input', saveNotepad);
    expandNotepadBtn.addEventListener('click', toggleNotepadSize);

    // Close modals by clicking outside
    snippetsModal.addEventListener('click', (e) => {
        if (e.target === snippetsModal) {
            hideSnippetsModal();
        }
    });

    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            hideDeleteModal();
        }
    });

    exportModal.addEventListener('click', (e) => {
        if (e.target === exportModal) {
            hideExportModal();
        }
    });

    // Close modals with ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (snippetsModal.style.display !== 'none') {
                hideSnippetsModal();
            }
            if (deleteModal.style.display !== 'none') {
                hideDeleteModal();
            }
            if (exportModal.style.display !== 'none') {
                hideExportModal();
            }
        }
    });
});

// Functions
function renderClientList() {
    clientList.innerHTML = '';
    clients.forEach(client => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${client.name}</span>
            <button class="delete-btn">🗑️</button>
        `;
        li.addEventListener('click', () => showClientDetails(client.id));
        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showDeleteClientModal(client.id);
        });
        clientList.appendChild(li);
    });
}

function showClientList() {
    document.getElementById('clientListSection').classList.remove('hidden');
    newClientSection.classList.add('hidden');
    clientDetailsSection.classList.add('hidden');
    vendesSection.classList.add('hidden');
    currentClientId = null;
}

function showVendes() {
    document.getElementById('clientListSection').classList.add('hidden');
    newClientSection.classList.add('hidden');
    clientDetailsSection.classList.add('hidden');
    vendesSection.classList.remove('hidden');
    renderVendes();
}

function showNewClientForm() {
    document.getElementById('clientListSection').classList.add('hidden');
    newClientSection.classList.remove('hidden');
    clientDetailsSection.classList.add('hidden');
    newClientForm.reset();
    // Focus the first input field
    document.getElementById('name').focus();
}

async function addClient(e) {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    const address = document.getElementById('address').value;

    const newClient = {
        id: getNextClientId(),
        name,
        phone,
        email,
        address,
        expenses: []
    };

    clients.push(newClient);
    try {
        await saveClients();
        renderClientList();
        showClientList();
    } catch (error) {
        // Remove the client from local array if save failed
        clients.pop();
        alert('Failed to save client. Please try again.');
    }
}

function showClientDetails(clientId) {
    console.log('showClientDetails called with clientId:', clientId);
    currentClientId = clientId;
    const client = clients.find(c => c.id === clientId);
    console.log('Found client:', client);
    if (!client) return;

    clientName.textContent = client.name;
    clientPhone.textContent = client.phone;
    clientEmail.textContent = client.email;
    clientAddress.textContent = client.address;

    renderExpenses(client.expenses);

    // Set the date field to the current date
    document.getElementById('expenseDate').value = getCurrentDate();

    document.getElementById('clientListSection').classList.add('hidden');
    newClientSection.classList.add('hidden');
    clientDetailsSection.classList.remove('hidden');
    console.log('Sections toggled');
}

function renderExpenses(expenses) {
    expenseList.innerHTML = '';
    const validExpenses = expenses.filter(expense => expense.product !== null && expense.price !== null);
    const sortedExpenses = validExpenses.map((expense, index) => ({ expense, originalIndex: index })).sort((a, b) => {
        if (!a.expense.date) return 1;
        if (!b.expense.date) return -1;
        return b.expense.date.localeCompare(a.expense.date);
    });
    sortedExpenses.forEach(({ expense, originalIndex }) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${formatDate(expense.date)} - ${expense.product} - €${expense.price}</span>
            <button onclick="showDeleteModal(${originalIndex})" class="delete-btn">Eliminar</button>
        `;
        expenseList.appendChild(li);
    });
}

function renderVendes() {
    vendesList.innerHTML = '';
    const allExpenses = [];
    clients.forEach(client => {
        client.expenses.forEach((expense, index) => {
            if (expense.product !== null && expense.price !== null) {
                allExpenses.push({
                    clientId: client.id,
                    clientName: client.name,
                    expenseIndex: index,
                    date: expense.date,
                    product: expense.product,
                    price: expense.price
                });
            }
        });
    });
    allExpenses.sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date) - new Date(a.date);
    });
    allExpenses.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${formatDate(item.date)} - ${item.clientName} - ${item.product} - €${item.price}</span>
            <button onclick="showDeleteVendesModal(${item.clientId}, ${item.expenseIndex})" class="delete-btn small-delete-btn">Eliminar</button>
        `;
        vendesList.appendChild(li);
    });
}

async function addExpense() {
    const date = document.getElementById('expenseDate').value;
    const product = document.getElementById('expenseProduct').value;
    const price = parseFloat(document.getElementById('expensePrice').value);

    if (!date || !product || !price || isNaN(price)) {
        alert('Si us plau, omple tots els camps correctament.');
        return;
    }

    const client = clients.find(c => c.id === currentClientId);
    if (!client) return;

    const newExpense = { date, product, price };
    client.expenses.push(newExpense);
    try {
        await saveClients();
        renderExpenses(client.expenses);
        addExpenseForm.reset();
        // Set the date field to the current date after reset
        document.getElementById('expenseDate').value = getCurrentDate();
    } catch (error) {
        // Remove the expense from local array if save failed
        client.expenses.pop();
        alert('Error en guardar la venda. Torna-ho a provar.');
    }
}

function filterClients() {
    const searchTerm = normalizeString(searchInput.value);
    const filteredClients = clients.filter(client =>
        normalizeString(client.name).includes(searchTerm)
    );

    clientList.innerHTML = '';
    filteredClients.forEach(client => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${client.name}</span>
            <button class="delete-btn">🗑️</button>
        `;
        li.addEventListener('click', () => showClientDetails(client.id));
        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showDeleteClientModal(client.id);
        });
        clientList.appendChild(li);
    });
}

function filterSnippets() {
    const searchTerm = normalizeString(snippetSearch.value);
    renderSnippets(searchTerm);
}



function exportAllToExcel() {
    showExportModal();
}

function showExportModal() {
    exportModal.style.display = 'flex';
}

function hideExportModal() {
    exportModal.style.display = 'none';
}

function performExport() {
    const startDate = exportStartDate.value;
    const endDate = exportEndDate.value;

    if (!startDate) {
        alert("Data d'inici requerida.");
        return;
    }
    if (!endDate) {
        alert("Data de fi requerida.");
        return;
    }

    const data = [];
    clients.forEach(client => {
        client.expenses.forEach(expense => {
            if (expense.date >= startDate && expense.date <= endDate) {
                data.push({
                    Data: expense.date,
                    Client: client.name,
                    'Producte/Servei': expense.product,
                    Preu: expense.price
                });
            }
        });
    });

    if (data.length === 0) {
        alert("No hi ha dades en el rang de dates seleccionat.");
        return;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
        {wch: 20}, // Client
        {wch: 12}, // Data
        {wch: 25}, // Producte/Servei
        {wch: 10}  // Preu (€)
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clients');
    XLSX.writeFile(wb, `clients_${startDate}_to_${endDate}.xlsx`);

    hideExportModal();
}

function exportClientToExcel() {
    const client = clients.find(c => c.id === currentClientId);
    if (!client) return;

    const data = client.expenses.map(expense => ({
        Data: formatDate(expense.date),
        Client: client.name,
        'Producte / Servei': expense.product,
        'Preu (€)': expense.price
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
        {wch: 12}, // Data
        {wch: 20}, // Client
        {wch: 25}, // Producte / Servei
        {wch: 10}  // Preu (€)
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, client.name);
    XLSX.writeFile(wb, `${client.name}.xlsx`);
}

function exportDatabase() {
    fetch('http://localhost:3000/api/export-db')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to download database');
            }
            return response.blob();
        })
        .then(blob => {
            saveAs(blob, 'clients.db');
        })
        .catch(error => {
            console.error('Error downloading database:', error);
            alert('Error downloading database. Please try again.');
        });
}



function showSnippetsModal() {
    snippetsModal.style.display = 'flex';
    snippetSearch.value = '';
    renderSnippets();
}

function hideSnippetsModal() {
    snippetsModal.style.display = 'none';
}

function renderSnippets(filterTerm = '') {
    snippetsList.innerHTML = '';
    const filteredSnippets = snippets.filter(snippet =>
        normalizeString(snippet.text).includes(normalizeString(filterTerm))
    );
    filteredSnippets.forEach((snippet, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${snippet.text} - €${snippet.price}</span>
            <button onclick="selectSnippet('${snippet.text}', ${snippet.price})">Seleccionar</button>
            <button onclick="showDeleteSnippetModal(${snippets.indexOf(snippet)}); event.stopPropagation();" class="delete-btn">🗑️</button>
        `;
        snippetsList.appendChild(li);
    });
}

function saveSnippet() {
    const text = document.getElementById('snippetText').value;
    const price = parseFloat(document.getElementById('snippetPrice').value);

    if (text && price) {
        snippets.push({ text, price });
        saveSnippets();
        renderSnippets();
        document.getElementById('snippetText').value = '';
        document.getElementById('snippetPrice').value = '';
    }
}

function selectSnippet(text, price) {
    document.getElementById('expenseProduct').value = text;
    document.getElementById('expensePrice').value = price;
    hideSnippetsModal();
}

let expenseToDelete = null;
let clientToDelete = null;
let snippetToDelete = null;

function showDeleteModal(index) {
    expenseToDelete = index;
    clientToDelete = null;
    deleteModal.style.display = 'flex';
}

function showDeleteClientModal(clientId) {
    clientToDelete = clientId;
    expenseToDelete = null;
    deleteModal.style.display = 'flex';
}

function showDeleteSnippetModal(index) {
    snippetToDelete = index;
    expenseToDelete = null;
    clientToDelete = null;
    vendesToDelete = null;
    deleteModal.style.display = 'flex';
}

function showDeleteVendesModal(clientId, expenseIndex) {
    vendesToDelete = { clientId, expenseIndex };
    expenseToDelete = null;
    clientToDelete = null;
    snippetToDelete = null;
    deleteModal.style.display = 'flex';
}

function hideDeleteModal() {
    deleteModal.style.display = 'none';
    expenseToDelete = null;
    clientToDelete = null;
    snippetToDelete = null;
    vendesToDelete = null;
}

async function deleteExpense() {
    if (expenseToDelete !== null) {
        const client = clients.find(c => c.id === currentClientId);
        if (client) {
            const deletedExpense = client.expenses.splice(expenseToDelete, 1)[0];
            try {
                await saveClients();
                renderExpenses(client.expenses);
            } catch (error) {
                // Restore the expense from local array if save failed
                client.expenses.splice(expenseToDelete, 0, deletedExpense);
                alert('Failed to delete expense. Please try again.');
            }
        }
    } else if (clientToDelete !== null) {
        const deletedClient = clients.find(c => c.id === clientToDelete);
        clients = clients.filter(c => c.id !== clientToDelete);
        try {
            await saveClients();
            renderClientList();
        } catch (error) {
            // Restore the client if save failed
            clients.push(deletedClient);
            alert('Failed to delete client. Please try again.');
        }
    } else if (vendesToDelete !== null) {
        const client = clients.find(c => c.id === vendesToDelete.clientId);
        if (client) {
            const deletedExpense = client.expenses.splice(vendesToDelete.expenseIndex, 1)[0];
            try {
                await saveClients();
                renderVendes();
            } catch (error) {
                // Restore the expense if save failed
                client.expenses.splice(vendesToDelete.expenseIndex, 0, deletedExpense);
                alert('Failed to delete expense. Please try again.');
            }
        }
    }
    hideDeleteModal();
}

// API functions
async function loadClients() {
    try {
        const response = await fetch('http://localhost:3000/api/clients');
        clients = await response.json();
        renderClientList();
    } catch (error) {
        console.error('Error loading clients:', error);
    }
}

async function saveClients() {
    try {
        const response = await fetch('http://localhost:3000/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clients)
        });
        if (!response.ok) {
            throw new Error('Failed to save clients');
        }
        // Reload clients to ensure UI reflects server state
        await loadClients();
    } catch (error) {
        console.error('Error saving clients:', error);
        alert('Error saving clients. Please try again.');
        throw error; // Re-throw to handle in caller
    }
}

async function loadSnippets() {
    try {
        const response = await fetch('http://localhost:3000/api/snippets');
        snippets = await response.json();
        renderSnippets();
    } catch (error) {
        console.error('Error loading snippets:', error);
    }
}

async function saveSnippets() {
    try {
        await fetch('http://localhost:3000/api/snippets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(snippets)
        });
    } catch (error) {
        console.error('Error saving snippets:', error);
    }
}

// Notepad functions
async function saveNotepad() {
    const client = clients.find(c => c.id === currentClientId);
    if (!client) return;

    client.notepad = notepadTextarea.value;
    try {
        await saveClients();
    } catch (error) {
        console.error('Error saving notepad:', error);
    }
}

function toggleNotepadSize() {
    clientNotepad.classList.toggle('expanded');
    if (clientNotepad.classList.contains('expanded')) {
        expandNotepadBtn.textContent = '⤣';
    } else {
        expandNotepadBtn.textContent = '⤢';
    }
}
