import { log, jq, advanceQuery, formatNumberUS, createTableNew, createFlyoutMenu, createForm, showModal, postData } from "../help.js";

document.addEventListener('DOMContentLoaded', () => {
    loadData();   


    jq('#totalStaff').parent('div').on('click', async () => {
        try {
            let sql = "SELECT id, username, date_format(created_at, '%m-%d-%Y, %r') created_at FROM users WHERE user_type = 'staff' ORDER BY id DESC"
            let rsp = await advanceQuery({ qry: sql });
            handelClick(rsp.data);
        } catch (error) {
            log(error);
        }
    })

    jq('#agencyUsers').parent('div').on('click', async () => {
        try {
            let sql = "SELECT id, username, date_format(created_at, '%m-%d-%Y, %r') created_at FROM users WHERE user_type = 'agent' ORDER BY id DESC"
            let rsp = await advanceQuery({ qry: sql });
            handelClick(rsp.data);
        } catch (error) {
            log(error);
        }
    })

    jq('#totalCustomers').parent('div').on('click', async () => {
        try {
            let sql = "SELECT id, username, date_format(created_at, '%m-%d-%Y, %r') created_at FROM users WHERE user_type = 'customer' ORDER BY id DESC"
            let rsp = await advanceQuery({ qry: sql });
            handelClick(rsp.data);
        } catch (error) {
            log(error);
        }
    })

    jq('#newUsers').parent('div').on('click', async () => {
        try {
            let sql = "SELECT id, username, date_format(created_at, '%m-%d-%Y, %r') created_at FROM users WHERE user_type = 'customer' AND created_at >= NOW() - INTERVAL 7 DAY ORDER BY id DESC"
            let rsp = await advanceQuery({ qry: sql }); log(rsp.data);
            handelClick(rsp.data);
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
            (SELECT COUNT(*) FROM users WHERE user_type = 'customer') AS totalCustomers,
            (SELECT COUNT(*) FROM users WHERE user_type = 'staff') AS totalStaff,
            (SELECT COUNT(*) FROM users WHERE user_type = 'agent') AS totalAgents,
            (SELECT COUNT(*) FROM users WHERE user_type = 'customer' AND created_at >= NOW() - INTERVAL 7 DAY) AS newUsers,
            (SELECT COUNT(*) FROM tickets) AS totalTickets,
            (SELECT COUNT(*) FROM tickets WHERE created_at >= NOW() - INTERVAL 7 DAY) AS newTickets
        `;

        const result = await advanceQuery({ qry: query });

        // Destructure the first (and only) row of data
        const [counts] = result.data;

        // Update the UI with the fetched data
        jq('#totalCustomers').text(formatNumberUS(counts.totalCustomers));
        jq('#agencyUsers').text(formatNumberUS(counts.totalAgents));
        jq('#totalStaff').text(formatNumberUS(counts.totalStaff));
        jq('#newUsers').text(formatNumberUS(counts.newUsers));
        jq('#totalTickets').text(formatNumberUS(counts.totalTickets));
        jq('#newTickets').text(formatNumberUS(counts.newTickets));

    } catch (error) {
        log(error);
    }
}

function handelClick(data = []) {
    try {
        let tbl = createTableNew({ data });
        jq('div.dataTable').html(tbl.table);
        jq(tbl.tbody).find(`[data-key="id"]`).addClass('text-primary role-btn').each((i, e) => {
            jq(e).on('click', () => {
                const id = data[i].id;

                createFlyoutMenu(e, [
                    { key: 'Edit', id: 'editDetails' },
                    { key: 'View', id: 'viewDetails' },
                    { key: 'Cancel' }
                ]);

                jq('#editDetails').on('click', async () => {
                    const rsp = await advanceQuery({ qry: 'select * from user_details where user_id = ?', values: [id] });
                    const htmlForm = createForm({
                        title: 'userdetails',
                        formData: rsp.data[0],
                        showSubmitBtn: false
                    });
                    const mb = showModal('Edit Details');
                    jq(mb).find('div.modal-body').html(htmlForm)
                    mb.data('bs.modal').show()

                    jq(mb).find('button.apply').removeClass('d-none').on('click', async () => {
                        const form = document.getElementById('myForm');
                        const fd = new FormData(form);
                        const payload = Object.fromEntries(fd.entries()); log(payload);
                        let res = await postData('/auth/user/update', payload); log(res);
                        if (res.status) {
                            jq('button.apply').addClass('disabled');
                            jq('span.rsp-msg').addClass('text-green').text(res.message);
                        }
                    });

                })

                jq('#viewDetails').on('click', async () => {
                    try {
                        const res = await advanceQuery({
                            qry: 'SELECT * FROM user_details WHERE user_id = ?',
                            values: [id]
                        });

                        const data = res.data[0];
                        if (!data) return alert('No details found');

                        const mb = showModal('User Details', 'md');
                        const m = moment(data.updated_at);

                        // Fields to display
                        const fields = [
                            'id', 'user_id', 'first_name', 'middle_name', 'last_name',
                            'address', 'city', 'zipcode', 'state'
                        ];

                        let html = '<ul class="list-group list-group-flush">';
                        fields.forEach(field => {
                            html += `<li class="list-group-item d-flex jcb aic text-uppercase">
                            <span>${field.replace('_', ' ')}</span>
                                <span>${data[field] || ''}</span>
                            </li>`;
                        });

                        // Updated at field separately for formatting
                        html += `<li class="list-group-item d-flex jcb aic">
                        <span>UPDATED AT</span>
                            <span>${m.format("YYYY-MM-DD HH:mm:ss")}</span>
                        </li>`;
                        html += '</ul>';

                        jq(mb).find('div.modal-body').html(html);
                        mb.data('bs.modal').show();

                    } catch (err) {
                        console.error(err);
                        alert('Failed to fetch user details');
                    }
                });

            })
        })
    } catch (error) {
        log(error);
    }
}



