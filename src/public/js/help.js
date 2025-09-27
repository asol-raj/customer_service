import 'https://unpkg.com/axios/dist/axios.min.js';
import 'https://code.jquery.com/jquery-3.7.1.min.js';

export const log = console.log;
export const jq = jQuery;
export const axios = window.axios;
import Fields from './formfields.js';

/**
 * Helper to fetch data using GET request.
 * @param {string} url - The endpoint URL.
 * @param {object|null} params - Optional query parameters.
 * @returns {Promise<any>} - Response data or error.
 */
export async function fetchData(url, params = null) {
    if (!url) return;

    try {
        const response = await axios.get(url, {
            params, // axios puts these into the query string
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching data:", error.message);
        throw error; // rethrow to let caller handle it
    }
}

/**
 * Helper to send a POST request.
 * @param {string} url - The endpoint URL.
 * @param {object} data - The data to send in the body.
 * @param {object|null} config - Optional Axios config (e.g., headers).
 * @returns {Promise<any>} - Response data or error.
 */
export async function postData(url, body = {}, config = null) {
    if (!url) return;

    try {
        const response = await axios.post(url, body, config || {});
        return response.data;
    } catch (error) {
        // log(error);
        // console.log("Error posting data:", error.message);
        throw error;
    }
}


/**
 * Creates and returns a Bootstrap 5 modal.
 * The modal is automatically removed from the DOM when hidden.
 *
 * @param {string} title - The title to display in the modal header.
 * @param {string} [size=''] - The size of the modal. Can be 'sm', 'lg', 'xl', or empty for default.
 * @returns {jQuery} - The jQuery object of the created modal element.
 */
export function showModal(title, size = "lg", hideFooter = false) {
    // Determine the modal dialog size class
    let sizeClass = "";
    if (size) {
        sizeClass = `modal-${size}`;
    }

    // Construct the modal HTML
    const modalHtml = `
        <div class="modal fade" tabindex="-1" role="dialog" aria-labelledby="modalTitle" aria-hidden="true">
            <div class="modal-dialog  modal-dialog-scrollable ${sizeClass}" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modalTitle">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body"></div>
                    <div class="modal-footer ${hideFooter ? 'd-none' : ''}">
                        <span class="small me-auto rsp-msg"></span>
                        <button type="button" class="btn btn-secondary close" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-primary apply d-none">Apply</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Create the modal element using jQuery
    const $modal = $(modalHtml);

    // Append the modal to the body
    $("body").append($modal);

    // Initialize the Bootstrap modal instance
    const bsModal = new bootstrap.Modal($modal[0]);

    // Add an event listener to remove the modal from the DOM when it's hidden
    $modal.on("hidden.bs.modal", function () {
        $modal.remove(); // Remove the modal element from the DOM
    });

    // You can also choose to show the modal immediately here if you want:
    // bsModal.show();
    // However, for more control, it's often better to return the jQuery object
    // and let the caller decide when to show it.

    // Store the Bootstrap modal instance on the jQuery object for easy access if needed
    $modal.data("bs.modal", bsModal);

    return $modal;
}

/*   Example Usage:
  Assuming you have jQuery and Bootstrap 5 JS loaded

  1. Create a default-sized modal
  const myModal = showModal('My First Modal', '');
  myModal.find('.modal-body').text('This is the content of my first modal.');
  myModal.data('bs.modal').show(); // Show the modal

  2. Create a large modal
  const largeModal = showModal('Large Modal Example', 'lg');
  largeModal.find('.modal-body').html('<p>This is a <strong>large</strong> modal!</p>');
  largeModal.data('bs.modal').show();

  3. Create an extra-large modal for dynamic content
  const xlModal = showModal('XL Modal for Data', 'xl');
  xlModal.find('.modal-body').append('<ul><li>Item 1</li><li>Item 2</li></ul>');
  xlModal.data('bs.modal').show();
 */

export function createForm({ title, formId = 'myForm', formData = {}, submitBtnText = 'Submit', showSubmitBtn = true, formWidth = '100%' }) {
    const formConfig = Fields[title];
    if (!formConfig) {
        console.error(`Form config for "${title}" not found.`);
        return '';
    }

    const visibleFields = Object.entries(formConfig).filter(([_, cfg]) => cfg.type !== 'hidden');
    const hiddenFields = Object.entries(formConfig).filter(([_, cfg]) => cfg.type === 'hidden');

    const hasFileField = visibleFields.some(([_, cfg]) => cfg.type === 'file');

    let formHtml = `<form id="${formId}" class="mb-0 needs-validation" novalidate ${hasFileField ? 'enctype="multipart/form-data"' : ''} style="width: ${formWidth}"><div class="row g-3">`;

    const twoCol = visibleFields.length > 6;
    const colClass = twoCol ? 'col-md-6' : 'col-12';

    for (const [name, config] of visibleFields) {
        const type = (config.type || 'text').toLowerCase();
        const id = `${formId}-${name}`;
        const required = config.required ? 'required' : '';
        const value = formData[name] ?? config.default ?? '';
        const titleAttr = config.required ? `title="${config.label} is required"` : '';
        let fieldHtml = '';

        switch (type) {
            case 'text':
            case 'email':
            case 'number':
            case 'date':
            case 'password': {
                fieldHtml = `
          <div class="${colClass}">
            <div class="form-floating">
              <input type="${type}" 
                     class="form-control" 
                     id="${id}" 
                     name="${name}" 
                     value="${value}" 
                     placeholder="${config.label}"
                     ${required} ${titleAttr}>
              <label for="${id}">${config.label}</label>
            </div>
          </div>`;
                break;
            }

            case 'textarea': {
                fieldHtml = `
          <div class="${colClass}">
            <div class="form-floating">
              <textarea class="form-control" 
                        id="${id}" 
                        name="${name}" 
                        placeholder="${config.label}"
                        style="height: 100px"
                        ${required} ${titleAttr}>${value}</textarea>
              <label for="${id}">${config.label}</label>
            </div>
          </div>`;
                break;
            }

            case 'select': {
                const options = (config.options || [])
                    .map(opt => {
                        if (typeof opt === 'object' && opt !== null) {
                            const selected = (opt.id === value) ? 'selected' : '';
                            return `<option value="${opt.id}" ${selected}>${opt.value}</option>`;
                        } else {
                            const selected = (opt === value) ? 'selected' : '';
                            return `<option value="${opt}" ${selected}>${opt}</option>`;
                        }
                    }).join('');

                fieldHtml = `
          <div class="${colClass}">
            <div class="form-floating">
              <select class="form-select" id="${id}" name="${name}" ${required} ${titleAttr}>
                ${options}
              </select>
              <label for="${id}">${config.label}</label>
            </div>
          </div>`;
                break;
            }

            case 'radio': {
                const radios = (config.options || [])
                    .map(opt => {
                        const checked = (opt === value) ? 'checked' : '';
                        return `
              <div class="form-check form-check-inline">
                <input class="form-check-input" type="radio" name="${name}" id="${id}-${opt}" value="${opt}" ${checked}>
                <label class="form-check-label" for="${id}-${opt}">
                  ${opt}
                </label>
              </div>`;
                    }).join('');
                fieldHtml = `
          <div class="${colClass}">
            <label class="form-label d-block">${config.label}</label>
            ${radios}
          </div>`;
                break;
            }

            case 'checkbox': {
                const defaults = Array.isArray(value) ? value : [value];
                const checkboxes = (config.options || [])
                    .map(opt => {
                        const checked = defaults.includes(opt) ? 'checked' : '';
                        return `
              <div class="form-check form-check-inline">
                <input class="form-check-input" type="checkbox" 
                       name="${name}[]" id="${id}-${opt}" value="${opt}" ${checked}>
                <label class="form-check-label" for="${id}-${opt}">
                  ${opt}
                </label>
              </div>`;
                    }).join('');
                fieldHtml = `
          <div class="${colClass}">
            <label class="form-label d-block">${config.label}</label>
            ${checkboxes}
          </div>`;
                break;
            }

            case 'file': {
                let previewHtml = `<div class="mt-2" id="${id}-preview"></div>`;
                if (value) {
                    const files = Array.isArray(value) ? value : [value];
                    previewHtml = `<div class="mt-2" id="${id}-preview">` +
                        files.map(file => {
                            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file);
                            if (isImage) {
                                return `<img src="${file}" alt="Preview" class="img-thumbnail me-2 mb-2" style="max-width: 150px; height: auto;">`;
                            } else {
                                return `<small class="text-muted d-block">Current file: 
                          <a href="${file}" target="_blank">${file.split('/').pop()}</a>
                        </small>`;
                            }
                        }).join('') +
                        `</div>`;
                }

                fieldHtml = `
          <div class="${colClass}">
            <label for="${id}" class="form-label">${config.label}</label>
            <input type="file" class="form-control" id="${id}" name="${name}[]" multiple ${required} ${titleAttr}>
            ${previewHtml}
          </div>`;
                break;
            }

            default: {
                fieldHtml = `
          <div class="${colClass}">
            <div class="form-floating">
              <input type="text" class="form-control" id="${id}" name="${name}" 
                     value="${value}" placeholder="${config.label}" ${required} ${titleAttr}>
              <label for="${id}">${config.label}</label>
            </div>
          </div>`;
                break;
            }
        }

        formHtml += fieldHtml;
    }

    formHtml += `</div>`;

    hiddenFields.forEach(([name, cfg]) => {
        const id = `${formId}-${name}`;
        const value = formData[name] ?? cfg.default ?? '';
        formHtml += `<input type="hidden" id="${id}" name="${name}" value="${value}">`;
    });

    const submitBtn = showSubmitBtn ? `<div class="mt-4 text-end"><button type="submit" class="btn btn-primary">${submitBtnText}</button></div>` : '';

    formHtml += `${submitBtn}</form>`;

    // multiple file preview
    setTimeout(() => {
        document.querySelectorAll(`#${formId} input[type="file"]`).forEach(input => {
            input.addEventListener('change', function () {
                const preview = document.getElementById(this.id + '-preview');
                if (!preview) return;
                preview.innerHTML = '';
                Array.from(this.files).forEach(file => {
                    if (file.type.startsWith('image/')) {
                        const img = document.createElement('img');
                        img.src = URL.createObjectURL(file);
                        img.className = 'img-thumbnail me-2 mb-2';
                        img.style.maxWidth = '150px';
                        img.onload = () => URL.revokeObjectURL(img.src);
                        preview.appendChild(img);
                    } else {
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(file);
                        link.target = '_blank';
                        link.textContent = file.name;
                        const wrapper = document.createElement('div');
                        wrapper.className = 'small text-muted mt-1';
                        wrapper.appendChild(document.createTextNode('Selected File: '));
                        wrapper.appendChild(link);
                        preview.appendChild(wrapper);
                    }
                });
            });
        });
    });

    return formHtml;
}

// Flyout menu helper
export function createFlyoutMenu(triggerElement, items, handlerMap = {}, rowData = null) {
    // Remove old menu if exists
    const oldMenu = document.querySelector(".flyout-menu");
    if (oldMenu) oldMenu.remove();

    const menu = document.createElement("div");
    menu.className = "flyout-menu";

    items.forEach(item => {
        const menuItem = document.createElement("div");
        menuItem.className = "flyout-menu-item";
        if (item.id) menuItem.id = item.id;
        menuItem.textContent = item.key;

        menu.appendChild(menuItem);

        // --- Bind handler from handlerMap if exists ---
        if (item.id && handlerMap[item.id]) {
            jq(menuItem).off('click').on('click', () => {
                handlerMap[item.id](rowData, triggerElement, item); // pass trigger element & item
                menu.remove(); // remove menu after click
            });
        } else {
            // default: remove menu when clicked
            jq(menuItem).off('click').on('click', () => menu.remove());
        }
    });

    document.body.appendChild(menu);

    // --- Position menu intelligently ---
    const rect = triggerElement.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    let top = rect.bottom;
    let left = rect.left;

    if (left + menuRect.width > window.innerWidth) {
        left = rect.right - menuRect.width;
    }
    if (top + menuRect.height > window.innerHeight) {
        top = rect.top - menuRect.height;
    }

    menu.style.position = "absolute";
    menu.style.top = `${Math.max(0, top)}px`;
    menu.style.left = `${Math.max(0, left)}px`;

    // --- Close on outside click ---
    const handleClickOutside = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener("click", handleClickOutside);
        }
    };
    setTimeout(() => document.addEventListener("click", handleClickOutside), 0);
}