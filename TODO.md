# TODO: Add Search Bar to Llista de Vendes

## Steps to Complete

- [ ] Add search input field in `index.html` below `<h2>Llista de Vendes</h2>` with ID `searchVendesInput` and placeholder "Buscar per client o venda...".
- [ ] In `script.js`, declare `const searchVendesInput = document.getElementById('searchVendesInput');`.
- [ ] Add event listener in `script.js`: `searchVendesInput.addEventListener('input', filterVendes);`.
- [ ] Modify `renderVendes(filterTerm = '')` in `script.js` to accept an optional filter term.
- [ ] In `renderVendes`, filter `allExpenses` by client name or product using normalized strings, then sort and render the filtered list.
- [ ] Create `filterVendes()` function in `script.js` to call `renderVendes(searchVendesInput.value)`.
- [ ] Update `showVendes()` in `script.js` to call `renderVendes()` (no filter) and reset the search input.
- [ ] Test the search functionality by running the app and verifying filtering works for client names and products.
