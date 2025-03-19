document.addEventListener('DOMContentLoaded', function() {
    // First, run the boot sequence
    retroBootSequence();
    
    // The actual initialization will happen in initApp() after boot sequence
});

// Retro boot sequence function
function retroBootSequence() {
    const container = document.querySelector('.container');
    const originalContent = container.innerHTML;
    
    // Hide original content
    container.innerHTML = `
        <div class="boot-sequence text-center my-5">
            <pre class="text-secondary">
 _    _               _                            
| |  | |             | |                           
| |__| | __ _ _ __ __| |_      ____ _ _ __ ___     
|  __  |/ _\` | '__/ _\` \\ \\ /\\ / / _\` | '__/ _ \\   
| |  | | (_| | | | (_| |\\ V  V / (_| | | |  __/   
|_|  |_|\\__,_|_|  \\__,_| \\_/\\_/ \\__,_|_|  \\___|   
                                                  
 _____                      _                     
|_   _|                    | |                    
  | |  _ ____   _____ _ __ | |_ ___  _ __ _   _   
  | | | '_ \\ \\ / / _ \\ '_ \\| __/ _ \\| '__| | | |  
 _| |_| | | \\ V /  __/ | | | || (_) | |  | |_| |  
|_____|_| |_|\\_/ \\___|_| |_|\\__\\___/|_|   \\__, |  
                                           __/ |  
                                          |___/   
            </pre>
            <div class="loading-text my-4 text-secondary">
                <p>INITIALIZING SYSTEM...</p>
                <div class="progress mb-3">
                    <div class="progress-bar bg-info" role="progressbar" style="width: 0%" id="boot-progress"></div>
                </div>
                <p id="boot-status">Loading components...</p>
            </div>
        </div>
    `;
    
    // Simulate boot sequence
    let progress = 0;
    const bootStatuses = [
        "Loading core system...",
        "Initializing database...",
        "Scanning inventory...",
        "Calibrating sensors...",
        "Loading interface...",
        "System ready!"
    ];
    
    const progressBar = document.getElementById('boot-progress');
    const bootStatus = document.getElementById('boot-status');
    
    const interval = setInterval(() => {
        progress += 5;
        progressBar.style.width = `${progress}%`;
        
        if (progress % 20 === 0) {
            bootStatus.textContent = bootStatuses[Math.floor(progress / 20)];
        }
        
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                container.innerHTML = originalContent;
                // Initialize the real app
                initApp();
            }, 1000);
        }
    }, 100);
}

// This function will be called after boot sequence completes
function initApp() {
    // DOM elements
    const componentInput = document.getElementById('componentInput');
    const previewBtn = document.getElementById('previewBtn');
    const addComponentBtn = document.getElementById('addComponentBtn');
    const parsePreview = document.getElementById('parsePreview');
    const inventoryTable = document.getElementById('inventoryTable');
    const categoryFilter = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const advancedFilters = document.getElementById('advancedFilters');
    const categoryCheckboxes = document.getElementById('categoryCheckboxes');
    const minQuantityFilter = document.getElementById('minQuantityFilter');
    const maxQuantityFilter = document.getElementById('maxQuantityFilter');
    const storageFilter = document.getElementById('storageFilter');
    const zeroQuantityFilter = document.getElementById('zeroQuantityFilter');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    
    // Event listeners
    previewBtn.addEventListener('click', previewParse);
    addComponentBtn.addEventListener('click', addComponent);
    componentInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            addComponent();
        }
    });
    categoryFilter.addEventListener('change', loadComponents);
    searchBtn.addEventListener('click', performSearch);
    clearSearchBtn.addEventListener('click', clearSearch);
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            performSearch();
        }
    });
    applyFiltersBtn.addEventListener('click', performSearch);
    resetFiltersBtn.addEventListener('click', resetFilters);
    
    // Add retro "click" sound to buttons (optional - only if you have the sound file)
    try {
        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', () => {
                try {
                    const clickSound = new Audio('/static/sounds/click.mp3');
                    clickSound.volume = 0.3;
                    clickSound.play().catch(e => console.log('Audio not loaded yet'));
                } catch (err) {
                    console.log('Sound playback not supported');
                }
            });
        });
    } catch (err) {
        console.log('Could not add sound effects');
    }
    
    // Load initial components
    loadComponents();
    
    // ALL OTHER FUNCTIONS GO HERE
    // Copy all your existing functions from the working version
    
    function previewParse() {
        const input = componentInput.value.trim();
        
        if (!input) {
            alert('Please enter a component description');
            return;
        }
        
        fetch('/api/parse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ input: input }),
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('preview-name').textContent = data.name;
            document.getElementById('preview-category').textContent = data.category;
            document.getElementById('preview-quantity').textContent = data.quantity;
            document.getElementById('preview-source').textContent = data.source || 'N/A';
            document.getElementById('preview-specifications').textContent = data.specifications || 'N/A';
            
            parsePreview.classList.remove('d-none');
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to parse input');
        });
    }
    
    function addComponent() {
        const input = componentInput.value.trim();
        if (!input) {
            alert('Please enter a component description');
            return;
        }
        
        // Show a retro "adding" animation
        showAddingAnimation();
        
        fetch('/api/components', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ input: input })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response error');
            }
            return response.json();
        })
        .then(data => {
            // Clear input
            componentInput.value = '';
            parsePreview.classList.add('d-none');
            
            // Hide the adding animation
            hideAddingAnimation();
            
            // Load the components but with a flag to highlight the new one
            loadComponentsWithHighlight(data.parsed_data);
            
            // Show success message
            const flashMessage = document.createElement('div');
            flashMessage.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3';
            flashMessage.style.zIndex = '9999';
            flashMessage.innerHTML = `
                <i class="bi bi-check-circle me-2"></i>
                Component added successfully
            `;
            document.body.appendChild(flashMessage);
            
            // Remove the flash message after a few seconds
            setTimeout(() => {
                flashMessage.remove();
            }, 3000);
        })
        .catch(error => {
            // Hide the adding animation
            hideAddingAnimation();
            
            console.error('Error:', error);
            alert('Failed to add component');
        });
    }
    
    // Show a retro "ADDING COMPONENT" animation
    function showAddingAnimation() {
        const overlay = document.createElement('div');
        overlay.id = 'addingOverlay';
        overlay.className = 'adding-overlay';
        
        overlay.innerHTML = `
            <div class="adding-container">
                <div class="adding-header">SYSTEM UPDATE</div>
                <div class="adding-content">
                    <div class="adding-progress">
                        <div class="progress my-3">
                            <div class="progress-bar progress-bar-striped progress-bar-animated bg-success" role="progressbar" style="width: 0%"></div>
                        </div>
                        <div class="terminal-line">
                            <span class="text-success">> </span><span id="addingText"></span><span class="blink-cursor">_</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Start progress animation
        const progressBar = overlay.querySelector('.progress-bar');
        const addingText = document.getElementById('addingText');
        
        const messages = [
            "PARSING COMPONENT DATA",
            "VALIDATING INPUT",
            "ALLOCATING STORAGE",
            "UPDATING DATABASE",
            "REFRESHING INVENTORY"
        ];
        
        let messageIndex = 0;
        let width = 0;
        
        // Animate the text typing effect
        function typeText(text, index = 0) {
            if (index <= text.length) {
                addingText.textContent = text.substring(0, index);
                setTimeout(() => typeText(text, index + 1), 30);
            }
        }
        
        // Update progress bar and messages
        const interval = setInterval(() => {
            width += 5;
            progressBar.style.width = `${width}%`;
            
            if (width % 20 === 0) {
                const newText = messages[messageIndex++];
                if (newText) {
                    typeText(newText);
                }
            }
            
            if (width >= 100) {
                clearInterval(interval);
            }
        }, 150);
    }
    
    // Hide the adding animation
    function hideAddingAnimation() {
        const overlay = document.getElementById('addingOverlay');
        if (overlay) {
            overlay.classList.add('fade-out');
            setTimeout(() => {
                overlay.remove();
            }, 500);
        }
    }
    
    // Include all other functions from your original working JavaScript
    // You need to include: loadComponents, performSearch, etc.
}

// Keep track of all available categories
let allCategories = [];

// Function to load components
function loadComponents() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.classList.remove('d-none');
    }
    
    inventoryTable.classList.add('d-none');
    
    const selectedCategory = categoryFilter.value;
    
    fetch('/api/components')
    .then(response => {
        if (!response.ok) {
            throw new Error(`Network response error: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Components loaded successfully:', data.length);
        // Hide loading after data is fetched
        if (loadingIndicator) {
            loadingIndicator.classList.add('d-none');
        }
        inventoryTable.classList.remove('d-none');
        
        // Update available categories for search filters
        updateAvailableCategories(data);
        
        // Clear existing table
        inventoryTable.innerHTML = '';
        
        // Filter by selected category if applicable
        const filteredData = selectedCategory 
            ? data.filter(item => item.category === selectedCategory)
            : data;
        
        // Get unique categories for the filter dropdown
        const categories = [...new Set(data.map(item => item.category))];
        updateCategoryFilter(categories);
        
        // Group components by category
        const groupedComponents = {};
        filteredData.forEach(item => {
            if (!groupedComponents[item.category]) {
                groupedComponents[item.category] = [];
            }
            groupedComponents[item.category].push(item);
        });
        
        // Render components
        Object.keys(groupedComponents).sort().forEach(category => {
            // Add category header
            if (!selectedCategory) {
                const categoryRow = document.createElement('tr');
                categoryRow.innerHTML = `
                    <td colspan="7" class="bg-light">
                        <strong>${category}</strong>
                    </td>
                `;
                inventoryTable.appendChild(categoryRow);
            }
            
            // Add components for this category
            groupedComponents[category].forEach(item => {
                const row = document.createElement('tr');
                row.dataset.componentId = item.id;
                
                // Add 'has-similar' class if the item has similar components
                if (item.has_similar) {
                    row.classList.add('has-similar');
                }
                
                row.innerHTML = `
                    <td>${item.category}</td>
                    <td>
                        ${item.name}
                        ${item.has_similar ? 
                            `<div class="duplicate-badge">
                                <span class="blink-text">DUPLICATE DETECTED</span>
                             </div>` : 
                            ''
                        }
                    </td>
                    <td>${item.specifications || 'N/A'}</td>
                    <td>${item.source || 'N/A'}</td>
                    <td class="quantity-col ${item.quantity === 0 ? 'zero-quantity' : ''}">
                        <div class="quantity-control">
                            <button class="btn btn-sm btn-outline-danger decrease-qty-btn">-</button>
                            <span class="quantity-value">${item.quantity}</span>
                            <button class="btn btn-sm btn-outline-success increase-qty-btn">+</button>
                        </div>
                    </td>
                    <td>
                        <span class="storage-text">${item.storage || 'Not specified'}</span>
                        <button class="btn btn-sm btn-outline-secondary edit-storage-btn ms-2">
                            <i class="bi bi-pencil-square"></i>
                        </button>
                    </td>
                    <td>
                        <div class="d-flex flex-column gap-1">
                            ${item.has_similar ? 
                                `<button class="btn btn-sm btn-outline-warning find-similar-btn">
                                    <i class="bi bi-exclamation-triangle-fill me-1"></i> Merge Similar
                                 </button>` : 
                                '<span class="text-muted small"><i class="bi bi-check-circle-fill me-1"></i> No duplicates</span>'
                            }
                            <div class="d-flex gap-1">
                                <button class="btn btn-sm btn-outline-primary edit-component-btn">
                                    <i class="bi bi-gear-fill me-1"></i> Edit
                                </button>
                                <button class="btn btn-sm btn-outline-danger quick-delete-btn">
                                    <i class="bi bi-trash-fill"></i>
                                </button>
                            </div>
                        </div>
                    </td>
                `;
                inventoryTable.appendChild(row);
                
                // Add event listeners to the row buttons
                addRowEventListeners(row, item);
            });
        });
        
        // Show message if no components
        if (filteredData.length === 0) {
            inventoryTable.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">No components found</td>
                </tr>
            `;
        }
        
        // Call updateDuplicateWarning safely
        try {
            updateDuplicateWarning(data);
        } catch (err) {
            console.error('Error in updateDuplicateWarning:', err);
        }
    })
    .catch(error => {
        console.error('Error loading components:', error);
        
        if (loadingIndicator) {
            loadingIndicator.classList.add('d-none');
        }
        inventoryTable.classList.remove('d-none');
        
        inventoryTable.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger">
                    Failed to load components: ${error.message || 'Unknown error'}
                </td>
            </tr>
        `;
    });
}

// Function to update category filter
function updateCategoryFilter(categories) {
    // Save current selection
    const currentSelection = categoryFilter.value;
    
    // Clear existing options except "All Categories"
    while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
    }
    
    // Add category options
    categories.sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
    
    // Restore selection if it still exists
    if (currentSelection && categories.includes(currentSelection)) {
        categoryFilter.value = currentSelection;
    }
}

// Function to show similar components
function showSimilarComponents(componentId) {
    fetch(`/api/components/${componentId}/similar`)
    .then(response => response.json())
    .then(data => {
        // Create modal container if it doesn't exist
        let modalContainer = document.getElementById('similarComponentsModal');
        if (modalContainer) {
            modalContainer.remove();
        }
        
        modalContainer = document.createElement('div');
        modalContainer.id = 'similarComponentsModal';
        modalContainer.className = 'modal fade';
        modalContainer.setAttribute('tabindex', '-1');
        document.body.appendChild(modalContainer);
        
        // Get the current component
        const currentComponent = document.querySelector(`tr[data-component-id="${componentId}"]`);
        const componentName = currentComponent.querySelector('td:nth-child(2)').textContent;
        
        // Build retro-styled modal HTML
        const modalHtml = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-circuit-board me-2"></i>
                            SIMILAR COMPONENTS
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="current-component mb-3 p-2" style="border: 1px dashed var(--secondary-color); background: rgba(0,255,255,0.1);">
                            <div class="row">
                                <div class="col-md-12">
                                    <span class="badge bg-info me-2">CURRENT</span>
                                    <strong>${componentName}</strong>
                                </div>
                            </div>
                        </div>
                        <div class="terminal-header mb-2">
                            <span class="text-secondary">// SCANNING DATABASE FOR SIMILAR COMPONENTS...</span>
                        </div>
                        ${data.length > 0 ? `
                            <div class="table-responsive">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Specifications</th>
                                            <th>Source</th>
                                            <th>Quantity</th>
                                            <th>Storage</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody id="similarComponentsTable">
                                        ${data.map(comp => `
                                            <tr data-component-id="${comp.id}">
                                                <td>${comp.name}</td>
                                                <td>${comp.specifications || 'N/A'}</td>
                                                <td>${comp.source || 'N/A'}</td>
                                                <td>${comp.quantity}</td>
                                                <td>${comp.storage || 'Not specified'}</td>
                                                <td>
                                                    <button class="btn btn-sm btn-primary merge-into-btn">
                                                        <i class="bi bi-arrow-down-right-square"></i> Merge Into This
                                                    </button>
                                                    <button class="btn btn-sm btn-secondary merge-from-btn mt-1">
                                                        <i class="bi bi-arrow-up-left-square"></i> Merge From This
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : `
                            <div class="alert" style="background-color: rgba(255,0,0,0.2); color: #ff6b6b; border: 1px solid #ff6b6b;">
                                <i class="bi bi-exclamation-triangle me-2"></i>
                                NO SIMILAR COMPONENTS FOUND IN DATABASE
                            </div>
                        `}
                    </div>
                    <div class="modal-footer">
                        <div class="terminal-line text-secondary me-auto">
                            <span class="blink-cursor">_</span>
                        </div>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-1"></i> CLOSE
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        modalContainer.innerHTML = modalHtml;
        
        // Initialize the Bootstrap modal
        const modal = new bootstrap.Modal(modalContainer);
        modal.show();
        
        // Add blinking cursor animation
        const blinkCursor = modalContainer.querySelector('.blink-cursor');
        setInterval(() => {
            blinkCursor.style.opacity = blinkCursor.style.opacity === '0' ? '1' : '0';
        }, 500);
        
        // Add event listeners for merge buttons
        if (data.length > 0) {
            modalContainer.querySelectorAll('.merge-into-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const targetId = this.closest('tr').dataset.componentId;
                    mergeComponents(componentId, targetId, modal);
                });
            });
            
            modalContainer.querySelectorAll('.merge-from-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const sourceId = this.closest('tr').dataset.componentId;
                    mergeComponents(sourceId, componentId, modal);
                });
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to load similar components');
    });
}

// Function to merge components
function mergeComponents(sourceId, targetId, modal) {
    fetch('/api/components/merge', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            source_id: sourceId,
            target_id: targetId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
            return;
        }
        
        alert('Components merged successfully!');
        // Reload the inventory to show the changes
        loadComponents();
        modal.hide();
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to merge components');
    });
}

// Function to edit storage
function editStorage(componentId, currentStorage) {
    // Create modal container if it doesn't exist
    let modalContainer = document.getElementById('editStorageModal');
    if (modalContainer) {
        modalContainer.remove();
    }
    
    modalContainer = document.createElement('div');
    modalContainer.id = 'editStorageModal';
    modalContainer.className = 'modal fade';
    modalContainer.setAttribute('tabindex', '-1');
    document.body.appendChild(modalContainer);
    
    // Get the component name
    const componentRow = document.querySelector(`tr[data-component-id="${componentId}"]`);
    const componentName = componentRow.querySelector('td:nth-child(2)').textContent;
    
    // Build retro-styled modal HTML
    const modalHtml = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="bi bi-geo-alt me-2"></i>
                        EDIT STORAGE LOCATION
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="component-info mb-3 p-2" style="border: 1px dashed var(--secondary-color); background: rgba(0,255,255,0.1);">
                        <strong>${componentName}</strong>
                    </div>
                    
                    <div class="terminal-header mb-2">
                        <span class="text-secondary">// ENTER STORAGE LOCATION...</span>
                    </div>
                    
                    <div class="form-group">
                        <label for="storageLocationInput" class="text-secondary mb-2">LOCATION:</label>
                        <input type="text" class="form-control" id="storageLocationInput" value="${currentStorage}" 
                               placeholder="Where is this component stored?">
                    </div>
                </div>
                <div class="modal-footer">
                    <div class="terminal-line text-secondary me-auto">
                        <span class="blink-cursor">_</span>
                    </div>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        <i class="bi bi-x-circle me-1"></i> CANCEL
                    </button>
                    <button type="button" class="btn btn-primary" id="saveStorageBtn">
                        <i class="bi bi-save me-1"></i> SAVE
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modalContainer.innerHTML = modalHtml;
    
    // Initialize the Bootstrap modal
    const modal = new bootstrap.Modal(modalContainer);
    modal.show();
    
    // Add blinking cursor animation
    const blinkCursor = modalContainer.querySelector('.blink-cursor');
    setInterval(() => {
        blinkCursor.style.opacity = blinkCursor.style.opacity === '0' ? '1' : '0';
    }, 500);
    
    // Add event listener for the save button
    modalContainer.querySelector('#saveStorageBtn').addEventListener('click', function() {
        const storageLocation = document.getElementById('storageLocationInput').value;
        
        fetch(`/api/components/${componentId}/storage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                storage: storageLocation
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }
            
            // Update the storage text in the component row
            const storageText = componentRow.querySelector('.storage-text');
            storageText.textContent = storageLocation || 'Not specified';
            
            // Close the modal
            modal.hide();
            
            // Show a success indicator
            const flashMessage = document.createElement('div');
            flashMessage.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3';
            flashMessage.style.zIndex = '9999';
            flashMessage.innerHTML = `
                <i class="bi bi-check-circle me-2"></i>
                Storage location updated successfully
            `;
            document.body.appendChild(flashMessage);
            
            // Remove the flash message after a few seconds
            setTimeout(() => {
                flashMessage.remove();
            }, 3000);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to update storage location');
        });
    });
    
    // Focus the input field when the modal is shown
    modalContainer.addEventListener('shown.bs.modal', function() {
        document.getElementById('storageLocationInput').focus();
    });
    
    // Add keyboard event to save on Enter
    document.getElementById('storageLocationInput').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            modalContainer.querySelector('#saveStorageBtn').click();
        }
    });
}

// Function to update component quantity
function updateQuantity(componentId, newQuantity, quantityCell, quantityValue) {
    fetch(`/api/components/${componentId}/quantity`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            quantity: newQuantity
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
            return;
        }
        
        // Update the quantity display
        quantityValue.textContent = newQuantity;
        
        // Add or remove zero-quantity class
        if (newQuantity === 0) {
            quantityCell.classList.add('zero-quantity');
        } else {
            quantityCell.classList.remove('zero-quantity');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to update quantity');
    });
}

// Function to update available categories for search filters
function updateAvailableCategories(data) {
    allCategories = [...new Set(data.map(item => item.category))].sort();
    
    // Update category checkboxes
    categoryCheckboxes.innerHTML = '';
    allCategories.forEach(category => {
        const checkboxDiv = document.createElement('div');
        checkboxDiv.classList.add('form-check', 'form-check-inline');
        checkboxDiv.innerHTML = `
            <input class="form-check-input" type="checkbox" id="category-${category}" value="${category}">
            <label class="form-check-label" for="category-${category}">${category}</label>
        `;
        categoryCheckboxes.appendChild(checkboxDiv);
    });
}

// Function to perform search with filters
function performSearch() {
    const query = searchInput.value.trim();
    
    // Build filters object
    const filters = {};
    
    // Get selected categories
    const selectedCategories = [];
    document.querySelectorAll('#categoryCheckboxes input[type="checkbox"]:checked').forEach(checkbox => {
        selectedCategories.push(checkbox.value);
    });
    
    if (selectedCategories.length > 0) {
        filters.categories = selectedCategories;
    }
    
    // Get quantity range
    if (minQuantityFilter.value) {
        filters.min_quantity = parseInt(minQuantityFilter.value);
    }
    
    if (maxQuantityFilter.value) {
        filters.max_quantity = parseInt(maxQuantityFilter.value);
    }
    
    // Get storage filter
    if (storageFilter.value) {
        filters.storage = storageFilter.value.trim();
    }
    
    // Get zero quantity filter
    if (zeroQuantityFilter.value === 'zero') {
        filters.show_zero_quantity = true;
    } else if (zeroQuantityFilter.value === 'nonzero') {
        filters.show_zero_quantity = false;
    }
    
    // Send search request
    fetch('/api/components/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query: query,
            filters: filters
        })
    })
    .then(response => response.json())
    .then(displaySearchResults)
    .catch(error => {
        console.error('Error:', error);
        alert('Search failed. Please try again.');
    });
}

// Function to display search results
function displaySearchResults(data) {
    // Clear existing table
    inventoryTable.innerHTML = '';
    
    if (data.length === 0) {
        inventoryTable.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">No components found matching your search criteria</td>
            </tr>
        `;
        return;
    }
    
    // Group components by category
    const groupedComponents = {};
    data.forEach(item => {
        if (!groupedComponents[item.category]) {
            groupedComponents[item.category] = [];
        }
        groupedComponents[item.category].push(item);
    });
    
    // Render components
    Object.keys(groupedComponents).sort().forEach(category => {
        // Add category header
        const categoryRow = document.createElement('tr');
        categoryRow.innerHTML = `
            <td colspan="7" class="bg-light">
                <strong>${category}</strong>
            </td>
        `;
        inventoryTable.appendChild(categoryRow);
        
        // Add components for this category
        groupedComponents[category].forEach(item => {
            const row = document.createElement('tr');
            row.dataset.componentId = item.id;
            
            // Add 'has-similar' class if the item has similar components
            if (item.has_similar) {
                row.classList.add('has-similar');
            }
            
            row.innerHTML = `
                <td>${item.category}</td>
                <td>
                    ${item.name}
                    ${item.has_similar ? 
                        `<div class="duplicate-badge">
                            <span class="blink-text">DUPLICATE DETECTED</span>
                         </div>` : 
                        ''
                    }
                </td>
                <td>${item.specifications || 'N/A'}</td>
                <td>${item.source || 'N/A'}</td>
                <td class="quantity-col ${item.quantity === 0 ? 'zero-quantity' : ''}">
                    <div class="quantity-control">
                        <button class="btn btn-sm btn-outline-danger decrease-qty-btn">-</button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="btn btn-sm btn-outline-success increase-qty-btn">+</button>
                    </div>
                </td>
                <td>
                    <span class="storage-text">${item.storage || 'Not specified'}</span>
                    <button class="btn btn-sm btn-outline-secondary edit-storage-btn ms-2">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                </td>
                <td>
                    <div class="d-flex flex-column gap-1">
                        ${item.has_similar ? 
                            `<button class="btn btn-sm btn-outline-warning find-similar-btn">
                                <i class="bi bi-exclamation-triangle-fill me-1"></i> Merge Similar
                             </button>` : 
                            '<span class="text-muted small"><i class="bi bi-check-circle-fill me-1"></i> No duplicates</span>'
                        }
                        <div class="d-flex gap-1">
                            <button class="btn btn-sm btn-outline-primary edit-component-btn">
                                <i class="bi bi-gear-fill me-1"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-outline-danger quick-delete-btn">
                                <i class="bi bi-trash-fill"></i>
                            </button>
                        </div>
                    </div>
                </td>
            `;
            inventoryTable.appendChild(row);
            
            // Add event listeners to the buttons
            addRowEventListeners(row, item);
        });
    });
    
    updateDuplicateWarning(data);
}

// Extract row event listeners to reuse in both loadComponents and displaySearchResults
function addRowEventListeners(row, item) {
    // Find Similar button - only add listener if it exists
    const findSimilarBtn = row.querySelector('.find-similar-btn');
    if (findSimilarBtn) {
        findSimilarBtn.addEventListener('click', function() {
            showSimilarComponents(item.id);
        });
    }
    
    // Quick Delete button
    const quickDeleteBtn = row.querySelector('.quick-delete-btn');
    quickDeleteBtn.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent any parent handlers from firing
        showDeleteConfirmation(item, function() {
            deleteComponent(item.id);
        });
    });
    
    // Edit Storage button
    row.querySelector('.edit-storage-btn').addEventListener('click', function() {
        editStorage(item.id, item.storage || '');
    });
    
    // Quantity buttons
    const quantityCell = row.querySelector('.quantity-col');
    const quantityValue = row.querySelector('.quantity-value');
    const decreaseBtn = row.querySelector('.decrease-qty-btn');
    const increaseBtn = row.querySelector('.increase-qty-btn');
    
    decreaseBtn.addEventListener('click', function() {
        const currentQty = parseInt(quantityValue.textContent);
        if (currentQty > 0) {
            updateQuantity(item.id, currentQty - 1, quantityCell, quantityValue);
        }
    });
    
    increaseBtn.addEventListener('click', function() {
        const currentQty = parseInt(quantityValue.textContent);
        updateQuantity(item.id, currentQty + 1, quantityCell, quantityValue);
    });

    // Edit Component button
    row.querySelector('.edit-component-btn').addEventListener('click', function() {
        editComponent(item);
    });
}

// Function to clear search and reset filters
function clearSearch() {
    searchInput.value = '';
    resetFilters();
    loadComponents(); // Load all components again
}

// Function to reset filters
function resetFilters() {
    // Uncheck all category checkboxes
    document.querySelectorAll('#categoryCheckboxes input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Reset other filters
    minQuantityFilter.value = '';
    maxQuantityFilter.value = '';
    storageFilter.value = '';
    zeroQuantityFilter.value = '';
}

// After loading components in loadComponents()
function updateDuplicateWarning(data) {
    if (!data || !Array.isArray(data)) {
        console.error('Invalid data passed to updateDuplicateWarning');
        return;
    }
    
    const duplicateCount = data.filter(item => item.has_similar).length;
    
    // Get or create the warning element
    let warningEl = document.getElementById('duplicate-warning');
    
    // Find the inventory card body
    const inventoryCard = document.querySelector('.inventory-card .card-body');
    if (!inventoryCard) {
        console.error('Inventory card not found in DOM');
        return;
    }
    
    if (duplicateCount > 0) {
        if (!warningEl) {
            warningEl = document.createElement('div');
            warningEl.id = 'duplicate-warning';
            warningEl.className = 'terminal-warning mb-3';
            inventoryCard.insertBefore(warningEl, inventoryCard.firstChild);
        }
        
        warningEl.innerHTML = `
            <div class="terminal-header">
                <span class="terminal-prompt">> SYSTEM ALERT:</span>
                <span class="terminal-output">Detected ${duplicateCount} potential duplicate${duplicateCount > 1 ? 's' : ''} in inventory database.</span>
            </div>
            <div class="terminal-line">
                <span class="terminal-prompt">> RECOMMENDATION:</span>
                <span class="terminal-output">Review and merge similar components to optimize storage.</span>
            </div>
        `;
    } else if (warningEl) {
        warningEl.remove();
    }
}

// Add this function for editing components
function editComponent(component) {
    // Create modal container if it doesn't exist
    let modalContainer = document.getElementById('editComponentModal');
    if (modalContainer) {
        modalContainer.remove();
    }
    
    modalContainer = document.createElement('div');
    modalContainer.id = 'editComponentModal';
    modalContainer.className = 'modal fade';
    modalContainer.setAttribute('tabindex', '-1');
    document.body.appendChild(modalContainer);
    
    // Get all categories for the dropdown
    const categoryOptions = Array.from(
        new Set(
            Array.from(document.querySelectorAll('#inventoryTable tr'))
                .map(row => row.cells[0].textContent)
        )
    ).map(cat => `<option value="${cat}" ${component.category === cat ? 'selected' : ''}>${cat}</option>`).join('');
    
    // Build retro-styled modal HTML
    const modalHtml = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="bi bi-gear me-2"></i>
                        EDIT COMPONENT
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="terminal-header mb-3">
                        <span class="text-secondary">// COMPONENT ID: ${component.id}</span>
                    </div>
                    
                    <form id="editComponentForm">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label for="editName" class="form-label">Name</label>
                                <input type="text" class="form-control" id="editName" value="${component.name}">
                            </div>
                            <div class="col-md-6">
                                <label for="editCategory" class="form-label">Category</label>
                                <select class="form-select" id="editCategory">
                                    ${categoryOptions}
                                    <option value="new">-- Add New Category --</option>
                                </select>
                                <div id="newCategoryInput" class="mt-2 d-none">
                                    <input type="text" class="form-control" id="newCategory" placeholder="Enter new category">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <label for="editQuantity" class="form-label">Quantity</label>
                                <input type="number" class="form-control" id="editQuantity" min="0" value="${component.quantity}">
                            </div>
                            <div class="col-md-6">
                                <label for="editSource" class="form-label">Source</label>
                                <input type="text" class="form-control" id="editSource" value="${component.source || ''}">
                            </div>
                            <div class="col-md-6">
                                <label for="editStorage" class="form-label">Storage Location</label>
                                <input type="text" class="form-control" id="editStorage" value="${component.storage || ''}">
                            </div>
                            <div class="col-12">
                                <label for="editSpecifications" class="form-label">Specifications</label>
                                <textarea class="form-control" id="editSpecifications" rows="3">${component.specifications || ''}</textarea>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer d-flex justify-content-between">
                    <button type="button" class="btn btn-danger delete-component-btn">
                        <i class="bi bi-trash me-1"></i> DELETE COMPONENT
                    </button>
                    <div>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-1"></i> CANCEL
                        </button>
                        <button type="button" class="btn btn-primary" id="saveComponentBtn">
                            <i class="bi bi-save me-1"></i> SAVE CHANGES
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modalContainer.innerHTML = modalHtml;
    
    // Initialize the Bootstrap modal
    const modal = new bootstrap.Modal(modalContainer);
    modal.show();
    
    // Add blinking cursor animation
    const blinkCursor = modalContainer.querySelector('.blink-cursor');
    setInterval(() => {
        blinkCursor.style.opacity = blinkCursor.style.opacity === '0' ? '1' : '0';
    }, 500);
    
    // Show/hide new category input if "Add New Category" is selected
    const categorySelect = document.getElementById('editCategory');
    const newCategoryInput = document.getElementById('newCategoryInput');
    
    categorySelect.addEventListener('change', function() {
        if (this.value === 'new') {
            newCategoryInput.classList.remove('d-none');
        } else {
            newCategoryInput.classList.add('d-none');
        }
    });
    
    // Add event listener for the save button
    modalContainer.querySelector('#saveComponentBtn').addEventListener('click', function() {
        // Gather form data
        const updatedComponent = {
            name: document.getElementById('editName').value,
            quantity: parseInt(document.getElementById('editQuantity').value),
            source: document.getElementById('editSource').value,
            storage: document.getElementById('editStorage').value,
            specifications: document.getElementById('editSpecifications').value
        };
        
        // Handle category selection
        if (categorySelect.value === 'new') {
            const newCategoryValue = document.getElementById('newCategory').value.trim();
            if (newCategoryValue) {
                updatedComponent.category = newCategoryValue;
            } else {
                alert('Please enter a new category name');
                return;
            }
        } else {
            updatedComponent.category = categorySelect.value;
        }
        
        // Send update to server
        fetch(`/api/components/${component.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedComponent)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Close the modal
            modal.hide();
            
            // Show success message
            const flashMessage = document.createElement('div');
            flashMessage.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3';
            flashMessage.style.zIndex = '9999';
            flashMessage.innerHTML = `
                <i class="bi bi-check-circle me-2"></i>
                Component updated successfully
            `;
            document.body.appendChild(flashMessage);
            
            // Remove the flash message after a few seconds
            setTimeout(() => {
                flashMessage.remove();
            }, 3000);
            
            // Refresh the component list
            loadComponents();
        })
        .catch(error => {
            console.error('Error updating component:', error);
            alert('Failed to update component: ' + error.message);
        });
    });

    // Add event listener for the delete button
    modalContainer.querySelector('.delete-component-btn').addEventListener('click', function() {
        // Show styled confirmation modal
        showDeleteConfirmation(component, function() {
            // This is the callback that will run if user confirms deletion
            
            // Send delete request to server
            deleteComponent(component.id);
        });
    });
}

// Add this function for a better delete confirmation dialog
function showDeleteConfirmation(component, callback) {
    // Create modal container
    let confirmModal = document.getElementById('deleteConfirmModal');
    if (confirmModal) {
        confirmModal.remove();
    }
    
    confirmModal = document.createElement('div');
    confirmModal.id = 'deleteConfirmModal';
    confirmModal.className = 'modal fade';
    confirmModal.setAttribute('tabindex', '-1');
    document.body.appendChild(confirmModal);
    
    confirmModal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header bg-danger text-white">
                    <h5 class="modal-title">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>
                        CONFIRM DELETION
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-danger">
                        <p>You are about to delete the following component:</p>
                        <div class="p-3 border border-danger mt-2 mb-3 rounded">
                            <h6>${component.name}</h6>
                            <div class="small">
                                <div><strong>Category:</strong> ${component.category}</div>
                                <div><strong>Quantity:</strong> ${component.quantity}</div>
                                ${component.specifications ? `<div><strong>Specifications:</strong> ${component.specifications}</div>` : ''}
                            </div>
                        </div>
                        <p class="text-danger mb-0"><strong>This action cannot be undone!</strong></p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                        <i class="bi bi-x-circle me-1"></i> CANCEL
                    </button>
                    <button type="button" class="btn btn-danger" id="confirmDeleteBtn">
                        <i class="bi bi-trash me-1"></i> DELETE PERMANENTLY
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Initialize the Bootstrap modal
    const modal = new bootstrap.Modal(confirmModal);
    modal.show();
    
    // Add event listener to confirm button
    document.getElementById('confirmDeleteBtn').addEventListener('click', function() {
        modal.hide();
        callback();
    });
}

// Improve the loadComponentsWithHighlight function to handle category headers
function loadComponentsWithHighlight(newComponentData) {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.classList.remove('d-none');
    }
    
    inventoryTable.classList.add('d-none');
    
    const selectedCategory = categoryFilter.value;
    
    fetch('/api/components')
    .then(response => {
        if (!response.ok) {
            throw new Error(`Network response error: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Components loaded successfully:', data.length);
        
        if (loadingIndicator) {
            loadingIndicator.classList.add('d-none');
        }
        inventoryTable.classList.remove('d-none');
        
        // Find the new component if it exists
        let newComponent = null;
        if (newComponentData) {
            newComponent = data.find(c => 
                c.name === newComponentData.name && 
                c.category === newComponentData.category
            );
        }
        
        // Update available categories for search filters
        updateAvailableCategories(data);
        
        // Filter by category if needed
        if (selectedCategory) {
            data = data.filter(item => item.category === selectedCategory);
        }
        
        // Clear the table
        inventoryTable.innerHTML = '';
        
        if (data.length === 0) {
            inventoryTable.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">No components found</td>
                </tr>
            `;
            return;
        }
        
        // Group components by category
        const componentsByCategory = {};
        
        data.forEach(item => {
            if (!componentsByCategory[item.category]) {
                componentsByCategory[item.category] = [];
            }
            componentsByCategory[item.category].push(item);
        });
        
        // If we have a new component, we'll create a special section at the top
        if (newComponent) {
            // Create a temporary "New Component" section at the top
            const tempHeader = document.createElement('tr');
            tempHeader.className = 'new-component-header';
            tempHeader.innerHTML = `
                <td colspan="7" class="bg-accent text-center">
                    <strong>NEW COMPONENT: ${newComponent.category}</strong>
                </td>
            `;
            inventoryTable.appendChild(tempHeader);
            
            // Add the new component with highlight
            addComponentRow(newComponent, true);
            
            // Add a small spacer
            const spacer = document.createElement('tr');
            spacer.className = 'spacer-row';
            spacer.innerHTML = '<td colspan="7" style="height: 20px;"></td>';
            inventoryTable.appendChild(spacer);
        }
        
        // Render the components by category (excluding the new one)
        Object.keys(componentsByCategory).sort().forEach(category => {
            const components = componentsByCategory[category];
            
            // Create category header
            const categoryHeader = document.createElement('tr');
            categoryHeader.className = 'category-header';
            categoryHeader.innerHTML = `
                <td colspan="7" class="bg-light">
                    <strong>${category}</strong>
                </td>
            `;
            inventoryTable.appendChild(categoryHeader);
            
            // Add components (filter out the new one, we already showed it at the top)
            components.filter(c => !newComponent || c.id !== newComponent.id)
                      .forEach(item => addComponentRow(item, false));
        });
        
        // Schedule the animation to move the new component to its correct category
        if (newComponent) {
            setTimeout(() => animateComponentToFinalPosition(newComponent, data), 2000);
        }
        
        // Call updateDuplicateWarning safely
        try {
            updateDuplicateWarning(data);
        } catch (err) {
            console.error('Error in updateDuplicateWarning:', err);
        }
    })
    .catch(error => {
        console.error('Error loading components:', error);
        
        if (loadingIndicator) {
            loadingIndicator.classList.add('d-none');
        }
        inventoryTable.classList.remove('d-none');
        
        inventoryTable.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger">
                    Failed to load components: ${error.message || 'Unknown error'}
                </td>
            </tr>
        `;
    });
}

// Helper function to add a component row with optional highlight
function addComponentRow(item, isNew = false) {
    const row = document.createElement('tr');
    row.dataset.componentId = item.id;
    
    // Add 'has-similar' class if the item has similar components
    if (item.has_similar) {
        row.classList.add('has-similar');
    }
    
    // Add 'new-component' class if it's a new component
    if (isNew) {
        row.classList.add('new-component');
        row.id = `component-${item.id}`;
    }
    
    row.innerHTML = `
        <td>${item.category}</td>
        <td>
            ${item.name}
            ${item.has_similar ? 
                `<div class="duplicate-badge">
                    <span class="blink-text">DUPLICATE DETECTED</span>
                 </div>` : 
                ''
            }
            ${isNew ? '<span class="new-item-badge">NEW</span>' : ''}
        </td>
        <td>${item.specifications || 'N/A'}</td>
        <td>${item.source || 'N/A'}</td>
        <td class="quantity-col ${item.quantity === 0 ? 'zero-quantity' : ''}">
            <div class="quantity-control">
                <button class="btn btn-sm btn-outline-danger decrease-qty-btn">-</button>
                <span class="quantity-value">${item.quantity}</span>
                <button class="btn btn-sm btn-outline-success increase-qty-btn">+</button>
            </div>
        </td>
        <td>
            <span class="storage-text">${item.storage || 'Not specified'}</span>
            <button class="btn btn-sm btn-outline-secondary edit-storage-btn ms-2">
                <i class="bi bi-pencil-square"></i>
            </button>
        </td>
        <td>
            <div class="d-flex flex-column gap-1">
                ${item.has_similar ? 
                    `<button class="btn btn-sm btn-outline-warning find-similar-btn">
                        <i class="bi bi-exclamation-triangle-fill me-1"></i> Merge Similar
                     </button>` : 
                    '<span class="text-muted small"><i class="bi bi-check-circle-fill me-1"></i> No duplicates</span>'
                }
                <div class="d-flex gap-1">
                    <button class="btn btn-sm btn-outline-primary edit-component-btn">
                        <i class="bi bi-gear-fill me-1"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger quick-delete-btn">
                        <i class="bi bi-trash-fill"></i>
                    </button>
                </div>
            </div>
        </td>
    `;
    
    inventoryTable.appendChild(row);
    
    // Add event listeners to the row buttons
    addRowEventListeners(row, item);
}

// Update animateComponentToFinalPosition to maintain category structure
function animateComponentToFinalPosition(component, allComponents) {
    // Get the current new component row
    const newRow = document.getElementById(`component-${component.id}`);
    if (!newRow) return;
    
    // Add a class to initiate the move
    newRow.classList.add('moving');
    
    // Create a clone of the row at its current position for the animation
    const clone = newRow.cloneNode(true);
    clone.classList.add('animating-clone');
    clone.style.position = 'absolute';
    clone.style.width = `${newRow.offsetWidth}px`;
    clone.style.left = `${newRow.offsetLeft}px`;
    clone.style.top = `${newRow.offsetTop}px`;
    
    document.body.appendChild(clone);
    
    // Find the category header for this component
    const categoryHeaders = Array.from(document.querySelectorAll('.category-header'));
    const targetHeader = categoryHeaders.find(header => 
        header.querySelector('strong').textContent === component.category
    );
    
    if (!targetHeader) {
        console.error('Category header not found:', component.category);
        return;
    }
    
    // Create a new row for the final position
    const finalRow = document.createElement('tr');
    finalRow.dataset.componentId = component.id;
    finalRow.id = `component-${component.id}`;
    finalRow.classList.add('target-position');
    
    if (component.has_similar) {
        finalRow.classList.add('has-similar');
    }
    
    finalRow.innerHTML = newRow.innerHTML;
    
    // Find the right position within the category section
    let targetPosition = targetHeader.nextElementSibling;
    
    // Get all components in this category
    const categoryComponents = allComponents.filter(c => c.category === component.category);
    
    // Sort alphabetically
    categoryComponents.sort((a, b) => a.name.localeCompare(b.name));
    
    // Find this component's position in the sorted list
    const componentIndex = categoryComponents.findIndex(c => c.id === component.id);
    
    // Find the correct position in the DOM
    if (componentIndex > 0) {
        // There's a component before this one, find it in the DOM
        const prevComponentId = categoryComponents[componentIndex - 1].id;
        const prevRow = document.querySelector(`tr[data-component-id="${prevComponentId}"]`);
        
        if (prevRow) {
            targetPosition = prevRow.nextElementSibling;
        }
    }
    
    // Insert at the target position
    if (targetPosition) {
        inventoryTable.insertBefore(finalRow, targetPosition);
    } else {
        // Append after the category header
        if (targetHeader.nextElementSibling) {
            inventoryTable.insertBefore(finalRow, targetHeader.nextElementSibling);
        } else {
            inventoryTable.appendChild(finalRow);
        }
    }
    
    // Add event listeners to the new row buttons
    addRowEventListeners(finalRow, component);
    
    // Clean up the temporary sections
    const tempHeader = document.querySelector('.new-component-header');
    const spacer = document.querySelector('.spacer-row');
    
    if (tempHeader) tempHeader.remove();
    if (spacer) spacer.remove();
    if (newRow) newRow.remove();
    
    // Animate the clone to the new position
    const targetBounds = finalRow.getBoundingClientRect();
    
    clone.style.transition = 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
    clone.style.transform = `translateY(${targetBounds.top - clone.offsetTop}px)`;
    clone.style.opacity = '0.85';
    
    // Remove the clone after animation completes
    setTimeout(() => {
        clone.remove();
        finalRow.classList.add('new-component');
        
        // Remove the highlight class after a few more seconds
        setTimeout(() => {
            finalRow.classList.remove('new-component', 'target-position');
        }, 3000);
    }, 800);
}

// Update the deleteComponent function to include animation
function deleteComponent(componentId) {
    // Find the row to be deleted and add animation class
    const row = document.querySelector(`tr[data-component-id="${componentId}"]`);
    if (row) {
        row.classList.add('deleting');
        
        // Wait for animation to complete before making API call
        setTimeout(() => {
            fetch(`/api/components/${componentId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Network response error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Show success message
                const flashMessage = document.createElement('div');
                flashMessage.className = 'alert alert-warning position-fixed top-0 start-50 translate-middle-x mt-3';
                flashMessage.style.zIndex = '9999';
                flashMessage.innerHTML = `
                    <i class="bi bi-trash-fill me-2"></i>
                    Component deleted successfully
                `;
                document.body.appendChild(flashMessage);
                
                // Remove the flash message after a few seconds
                setTimeout(() => {
                    flashMessage.remove();
                }, 3000);
                
                // Refresh the component list
                loadComponents();
            })
            .catch(error => {
                console.error('Error deleting component:', error);
                alert('Failed to delete component: ' + error.message);
                
                // Remove the animation class if deletion fails
                row.classList.remove('deleting');
            });
        }, 500); // Match this to the animation duration
    } else {
        // Row not found in DOM, just make the API call directly
        // This is a fallback in case the row isn't in the current view
        fetch(`/api/components/${componentId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            loadComponents();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to delete component');
        });
    }
} 