import { jq, log } from './help.js';

document.addEventListener('DOMContentLoaded', () => {
    const wrap = document.getElementById('messagesWrap'); // container that wraps all messages
    const ticketId = document.getElementById('ticketId').value; //console.log(ticketId);

    wrap.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.edit-msg');
        const saveBtn = e.target.closest('.save-msg');
        const cancelBtn = e.target.closest('.cancel-edit');
        const delButton = e.target.closest('.delete-msg');

        // === EDIT clicked: swap <p.message-text> -> <textarea> + Save/Cancel ===
        if (editBtn) {
            const card = editBtn.closest('[data-msg-id]') || editBtn.closest('#msg-' + editBtn.value) || editBtn.closest('.card');
            if (!card) return;

            // Avoid opening multiple editors for the same card
            if (card.querySelector('form.inline-edit-form')) return;

            const textEl = card.querySelector('.message-text');
            if (!textEl) return;

            const originalText = textEl.textContent; // keep as plain text

            // Hide original text and inject inline form
            textEl.style.display = 'none';

            const form = document.createElement('form');
            form.className = 'inline-edit-form mt-2';
            form.dataset.msgId = editBtn.value; // keep id on the form for convenience
            form.innerHTML = `
            <div class="mb-2">
              <textarea class="form-control edit-textarea" rows="3">${originalText.trim()}</textarea>
            </div>
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-sm btn-primary save-msg" value="${editBtn.value}">Save</button>
              <button type="button" class="btn btn-sm btn-secondary cancel-edit">Cancel</button>
            </div>
            <div class="small text-muted mt-1 edit-hint d-none">Saving…</div>
            <div class="small text-danger mt-1 edit-error d-none"></div>
          `;
            textEl.after(form);
            return;
        }

        // === CANCEL clicked: restore original text ===
        if (cancelBtn) {
            const form = cancelBtn.closest('form.inline-edit-form');
            const card = cancelBtn.closest('.card');
            const textEl = card?.querySelector('.message-text');
            if (form && textEl) {
                form.remove();
                textEl.style.display = '';
            }
            return;
        }

        // === SAVE clicked: call /messge/update and update DOM on success ===
        if (saveBtn) {
            const msgId = saveBtn.value; // from button value attribute
            const form = saveBtn.closest('form.inline-edit-form');
            const card = saveBtn.closest('.card');
            const textEl = card?.querySelector('.message-text');
            const textarea = form?.querySelector('.edit-textarea');
            const hint = form?.querySelector('.edit-hint');
            const errBox = form?.querySelector('.edit-error');

            if (!msgId || !form || !textEl || !textarea) return;

            const newText = textarea.value.trim();
            if (!newText) {
                // simple client-side validation
                errBox.classList.remove('d-none');
                errBox.textContent = 'Message text is required.';
                return;
            }

            // UI: indicate saving & disable buttons to prevent double submit
            hint?.classList.remove('d-none');
            errBox?.classList.add('d-none');
            const buttons = form.querySelectorAll('button');
            buttons.forEach(b => b.disabled = true);

            try {
                const res = await fetch('/auth/ticket/message/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {})
                    },
                    body: JSON.stringify({ id: msgId, message: newText, ticketId })
                });

                const data = await res.json().catch(() => ({}));

                if (!res.ok || data?.status !== true) {
                    throw new Error(data?.error || data?.message || 'Update failed');
                }

                // Success: update UI text and close editor
                // textEl.textContent = newText; // keep plain text (prevents HTML injection)
                // form.remove();
                // textEl.style.display = '';
                window.location.reload();
            } catch (err) {
                // Show error & re-enable buttons
                errBox?.classList.remove('d-none');
                errBox.textContent = err.message || 'Something went wrong.';
                buttons.forEach(b => b.disabled = false);
                hint?.classList.add('d-none');
            }
        }

        if (delButton) {
            const msgId = delButton.value; // no need for Number() unless required
            if (!confirm('Are you sure you want to delete this message?')) return;

            try {
                const res = await fetch('/auth/ticket/message/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: msgId })
                });

                const data = await res.json().catch(() => ({}));

                if (!res.ok || data?.status !== true) {
                    throw new Error(data?.error || data?.message || 'Delete failed');
                }

                // window.location.reload(); // ✅ refresh on success
                const card = document.querySelector(`#msg-${msgId}`);
                if (card) card.remove();
            } catch (err) {
                alert(err.message || 'Something went wrong while deleting.');
            }
        }

    });

})

