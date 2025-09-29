import { advanceQuery, createTableNew, jq, log } from './help.js';

document.addEventListener('DOMContentLoaded', ()=>{
    log('ok');

    loadTickets();
})

async function loadTickets(){
    try {
        let rsp = await advanceQuery({ fn: 'openTickets'}); //log(rsp.data);
        let tbl = createTableNew({ data: rsp?.data || [], border: true });
        jq('div.dataTable').html(tbl.table);
    } catch (error) {
        log(error);
    }
}