import { advanceQuery, createFlyoutMenu, createTableNew, jq, log } from './help.js';

document.addEventListener('DOMContentLoaded', () => {
    log('ok');

    loadTickets();
})

async function loadTickets() {
    try {
        let rsp = await advanceQuery({ fn: 'openTickets' }); //log(rsp.data);
        let tbl = createTableNew({ data: rsp?.data || [], border: true });
        jq(tbl.tbody).find(`[data-key="id"]`).prop('role', 'button').addClass('text-primary').each(function () {
            jq(this).on('click', function (e) {
                createFlyoutMenu(e.target, [
                    { key: 'View Ticket', id: 'viewTicket' },
                    { key: 'Mark Status', id: 'markStatus' },
                    { key: 'Cancel' }
                ])

                jq('#viewTicket').on('click', function (r) {
                    log('view detials', i)
                    log(r)
                    // log(rsp.data[i])
                })
            })
        })
        jq('div.dataTable').html(tbl.table);
    } catch (error) {
        log(error);
    }
}