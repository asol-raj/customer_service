import { log, jq, advanceQuery, formatNumberUS, createTableNew } from "../help.js";

document.addEventListener('DOMContentLoaded', () => {
    log('opk');
    loadData();

    jq('#totalUsers').parent('div').on('click', async () => {
        try {
            let sql = "SELECT id, username, date_format(created_at, '%m-%d-%Y, %r') created_at FROM users WHERE user_type = 'customer' ORDER BY id DESC"
            let rsp = await advanceQuery({ qry: sql }); log(rsp.data);
            let tbl = createTableNew({ data: rsp.data });
            jq('div.dataTable').html(tbl.table);
        } catch (error) {
            log(error);
        }
    })

    jq('#newUsers').parent('div').on('click', async () => {
        try {
            let sql = "SELECT id, username, date_format(created_at, '%m-%d-%Y, %r') created_at FROM users WHERE user_type = 'customer' AND created_at >= NOW() - INTERVAL 7 DAY ORDER BY id DESC"
            let rsp = await advanceQuery({ qry: sql }); log(rsp.data);
            let tbl = createTableNew({ data: rsp.data });
            jq('div.dataTable').html(tbl.table);
        } catch (error) {
            log(error);
        }
    })

    jq('#totalTickets').parent('div').on('click', async () => {
        try {
            let rsp = await advanceQuery({ fn: 'tickets' }); //log(rsp.data);
            let tbl = createTableNew({ data: rsp.data });
            jq('div.dataTable').html(tbl.table);
            jq(tbl.tbody).find('tr').addClass('role-btn').each(function (i, e) {
                jq(e).on('click', function () {
                    log(rsp.data[i].id);
                    location.href = '/staff/ticket/' + rsp.data[i].id;
                })
            })
        } catch (error) {
            log(error);
        }
    })


})

async function loadData() {
    try {
        // Single query to get all counts at once
        const query = `
        SELECT
            (SELECT COUNT(*) FROM users WHERE user_type = 'customer') AS totalUsers,
            (SELECT COUNT(*) FROM users WHERE user_type = 'customer' AND created_at >= NOW() - INTERVAL 7 DAY) AS newUsers,
            (SELECT COUNT(*) FROM tickets) AS totalTickets,
            (SELECT COUNT(*) FROM tickets WHERE created_at >= NOW() - INTERVAL 7 DAY) AS newTickets
        `;

        const result = await advanceQuery({ qry: query });

        // Destructure the first (and only) row of data
        const [counts] = result.data;

        // Update the UI with the fetched data
        jq('#totalUsers').text(formatNumberUS(counts.totalUsers));
        jq('#newUsers').text(formatNumberUS(counts.newUsers));
        jq('#totalTickets').text(formatNumberUS(counts.totalTickets));
        jq('#newTickets').text(formatNumberUS(counts.newTickets));

    } catch (error) {
        log(error);
    }
}

